using System.Net;
using System.Security.Cryptography;
using Lib.Net.Http.WebPush;
using Lib.Net.Http.WebPush.Authentication;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Serilog;
using BrowserPushSubscription = Lib.Net.Http.WebPush.PushSubscription;
using WebPushMessage = Lib.Net.Http.WebPush.PushMessage;

namespace LearnMS.API.Features.PushNotifications;

public sealed record PushAlert(string Title, string Body, string Url, string Tag);

public sealed class PushSubscriptionRequest
{
    public string Endpoint { get; init; } = "";
    public PushSubscriptionKeys Keys { get; init; } = new();
}

public sealed class PushSubscriptionKeys
{
    public string P256dh { get; init; } = "";
    public string Auth { get; init; } = "";
}

public sealed class RemovePushSubscriptionRequest
{
    public string Endpoint { get; init; } = "";
}

public sealed class PushNotificationsService(AppDbContext db, IConfiguration cfg)
{
    // Apple only accepts aes128gcm, which this client sends.
    private static readonly PushServiceClient Client = new(new HttpClient { Timeout = TimeSpan.FromSeconds(15) });
    private static readonly SemaphoreSlim KeysLock = new(1, 1);
    private static readonly JsonSerializerSettings JsonSettings = new()
    {
        ContractResolver = new CamelCasePropertyNamesContractResolver()
    };

    public async Task<string> GetPublicKeyAsync(CancellationToken ct = default)
    {
        var keys = await GetKeysAsync(ct);
        return keys.PublicKey;
    }

    public async Task SubscribeAsync(Guid userId, PushSubscriptionRequest request, string? userAgent,
        CancellationToken ct = default)
    {
        var endpoint = request.Endpoint.Trim();
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps
            || string.IsNullOrWhiteSpace(request.Keys.P256dh) || string.IsNullOrWhiteSpace(request.Keys.Auth))
            throw new ArgumentException("Invalid push subscription");

        var existing = await db.WebPushSubscriptions.FirstOrDefaultAsync(x => x.Endpoint == endpoint, ct);
        if (existing is null)
        {
            await db.WebPushSubscriptions.AddAsync(new WebPushSubscription
            {
                UserId = userId,
                Endpoint = endpoint,
                P256dh = request.Keys.P256dh.Trim(),
                Auth = request.Keys.Auth.Trim(),
                UserAgent = Truncate(userAgent, 512)
            }, ct);
        }
        else
        {
            existing.UserId = userId;
            existing.P256dh = request.Keys.P256dh.Trim();
            existing.Auth = request.Keys.Auth.Trim();
            existing.UserAgent = Truncate(userAgent, 512);
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task UnsubscribeAsync(string endpoint, CancellationToken ct = default)
    {
        await db.WebPushSubscriptions
            .Where(x => x.Endpoint == endpoint.Trim())
            .ExecuteDeleteAsync(ct);
    }

    /// <summary>Teachers and assistants who can review payments, on every phone they turned alerts on.</summary>
    public async Task SendToPaymentReviewersAsync(PushAlert message, CancellationToken ct = default)
    {
        var subscriptions = await db.WebPushSubscriptions.AsNoTracking().ToListAsync(ct);
        if (subscriptions.Count == 0)
            return;

        var userIds = subscriptions.Select(x => x.UserId).Distinct().ToList();
        var teacherIds = await db.Teachers
            .Where(x => userIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(ct);
        var assistants = await db.Assistants
            .Where(x => userIds.Contains(x.Id))
            .Select(x => new { x.Id, x.Permissions })
            .ToListAsync(ct);

        var allowed = teacherIds.ToHashSet();
        foreach (var assistant in assistants.Where(x => x.Permissions.Contains(Permission.ManagePaymentRequests)))
            allowed.Add(assistant.Id);

        var stale = subscriptions.Where(x => !allowed.Contains(x.UserId)).Select(x => x.Id).ToList();
        await SendAsync(subscriptions.Where(x => allowed.Contains(x.UserId)).ToList(), message, stale, ct);
    }

    /// <summary>Returns how many of the user's phones were reached.</summary>
    public async Task<int> SendToUserAsync(Guid userId, PushAlert message, CancellationToken ct = default)
    {
        var subscriptions = await db.WebPushSubscriptions.AsNoTracking()
            .Where(x => x.UserId == userId)
            .ToListAsync(ct);
        return await SendAsync(subscriptions, message, [], ct);
    }

    private async Task<int> SendAsync(
        IReadOnlyList<WebPushSubscription> subscriptions,
        PushAlert message,
        List<Guid> stale,
        CancellationToken ct)
    {
        var sent = 0;
        var keys = await GetKeysAsync(ct);
        var vapid = new VapidAuthentication(keys.PublicKey, keys.PrivateKey) { Subject = Subject() };
        var payload = JsonConvert.SerializeObject(message, JsonSettings);

        foreach (var subscription in subscriptions)
        {
            var target = new BrowserPushSubscription { Endpoint = subscription.Endpoint };
            target.SetKey(PushEncryptionKeyName.P256DH, subscription.P256dh);
            target.SetKey(PushEncryptionKeyName.Auth, subscription.Auth);

            try
            {
                await Client.RequestPushMessageDeliveryAsync(
                    target,
                    new WebPushMessage(payload)
                    {
                        // High urgency lets the phone wake from sleep right away.
                        Urgency = PushMessageUrgency.High,
                        TimeToLive = 24 * 60 * 60
                    },
                    vapid,
                    ct);
                sent++;
            }
            catch (PushServiceClientException ex) when (
                ex.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone)
            {
                stale.Add(subscription.Id);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Log.Warning(ex, "Web push to {Endpoint} failed", subscription.Endpoint);
            }
        }

        if (stale.Count > 0)
        {
            await db.WebPushSubscriptions
                .Where(x => stale.Contains(x.Id))
                .ExecuteDeleteAsync(ct);
        }

        return sent;
    }

    private string Subject()
    {
        var subject = cfg["WebPush:Subject"];
        return string.IsNullOrWhiteSpace(subject) ? "mailto:admin@mr-rafik.com" : subject;
    }

    private async Task<WebPushKeys> GetKeysAsync(CancellationToken ct)
    {
        var configuredPublic = cfg["WebPush:PublicKey"];
        var configuredPrivate = cfg["WebPush:PrivateKey"];
        if (!string.IsNullOrWhiteSpace(configuredPublic) && !string.IsNullOrWhiteSpace(configuredPrivate))
            return new WebPushKeys { PublicKey = configuredPublic, PrivateKey = configuredPrivate };

        var keys = await db.WebPushKeys.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == WebPushKeys.SingletonId, ct);
        if (keys is not null)
            return keys;

        await KeysLock.WaitAsync(ct);
        try
        {
            var (publicKey, privateKey) = GenerateVapidKeys();
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO "WebPushKeys" ("Id", "PublicKey", "PrivateKey", "CreatedAt")
                VALUES ({WebPushKeys.SingletonId}, {publicKey}, {privateKey}, {DateTime.UtcNow})
                ON CONFLICT ("Id") DO NOTHING
                """, ct);

            return await db.WebPushKeys.AsNoTracking()
                .FirstAsync(x => x.Id == WebPushKeys.SingletonId, ct);
        }
        finally
        {
            KeysLock.Release();
        }
    }

    private static (string PublicKey, string PrivateKey) GenerateVapidKeys()
    {
        using var ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
        var parameters = ecdsa.ExportParameters(true);
        var publicKey = new byte[65];
        publicKey[0] = 0x04;
        parameters.Q.X!.CopyTo(publicKey, 1);
        parameters.Q.Y!.CopyTo(publicKey, 33);
        return (ToBase64Url(publicKey), ToBase64Url(parameters.D!));
    }

    private static string ToBase64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static string? Truncate(string? value, int max) =>
        value is null || value.Length <= max ? value : value[..max];

    public static async Task EnsureSchemaAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "WebPushSubscriptions" (
                "Id" uuid NOT NULL,
                "UserId" uuid NOT NULL,
                "Endpoint" character varying(2048) NOT NULL,
                "P256dh" character varying(256) NOT NULL,
                "Auth" character varying(256) NOT NULL,
                "UserAgent" character varying(512) NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_WebPushSubscriptions" PRIMARY KEY ("Id")
            );

            CREATE UNIQUE INDEX IF NOT EXISTS "IX_WebPushSubscriptions_Endpoint"
                ON "WebPushSubscriptions" ("Endpoint");

            CREATE INDEX IF NOT EXISTS "IX_WebPushSubscriptions_UserId"
                ON "WebPushSubscriptions" ("UserId");

            CREATE TABLE IF NOT EXISTS "WebPushKeys" (
                "Id" integer NOT NULL,
                "PublicKey" character varying(256) NOT NULL,
                "PrivateKey" character varying(256) NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL,
                CONSTRAINT "PK_WebPushKeys" PRIMARY KEY ("Id")
            );
            """);
    }
}
