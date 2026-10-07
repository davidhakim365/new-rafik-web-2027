using System.Data;
using System.Text.Json;
using LearnMS.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed class GoogleDriveLocalSettings
{
    public string? RefreshToken { get; set; }
    public string? Email { get; set; }
    public string? SharedDriveId { get; set; }
    public string? FolderId { get; set; }
    public string? FolderName { get; set; }
    public string? AccessToken { get; set; }
    public DateTime? AccessTokenIssuedUtc { get; set; }
}

public sealed class GoogleDriveSettingsStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly string _path;
    private readonly IServiceScopeFactory _scopes;
    private readonly object _gate = new();
    private bool _tableReady;

    public GoogleDriveSettingsStore(IHostEnvironment environment, IServiceScopeFactory scopes)
    {
        _scopes = scopes;
        var directory = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(directory);
        _path = Path.Combine(directory, "google-drive.json");
    }

    public GoogleDriveLocalSettings Read()
    {
        GoogleDriveLocalSettings file;
        GoogleDriveLocalSettings? db;
        lock (_gate)
        {
            file = ReadFile();
            db = TryReadDb();
        }

        if (db is null)
        {
            if (!string.IsNullOrWhiteSpace(file.RefreshToken))
                Write(file);
            return file;
        }

        if (!string.IsNullOrWhiteSpace(db.RefreshToken))
            file.RefreshToken = db.RefreshToken;
        if (!string.IsNullOrWhiteSpace(db.Email))
            file.Email = db.Email;
        if (!string.IsNullOrWhiteSpace(db.AccessToken))
        {
            file.AccessToken = db.AccessToken;
            file.AccessTokenIssuedUtc = db.AccessTokenIssuedUtc;
        }
        if (!string.IsNullOrWhiteSpace(db.FolderId))
        {
            file.FolderId = db.FolderId;
            file.FolderName = db.FolderName;
        }
        if (!string.IsNullOrWhiteSpace(db.SharedDriveId))
            file.SharedDriveId = db.SharedDriveId;

        return file;
    }

    public void Write(GoogleDriveLocalSettings settings)
    {
        lock (_gate)
        {
            File.WriteAllText(_path, JsonSerializer.Serialize(settings, JsonOptions));
            TryWriteDb(settings);
        }
    }

    private GoogleDriveLocalSettings ReadFile()
    {
        if (!File.Exists(_path))
            return new GoogleDriveLocalSettings();

        var json = File.ReadAllText(_path);
        return JsonSerializer.Deserialize<GoogleDriveLocalSettings>(json, JsonOptions)
            ?? new GoogleDriveLocalSettings();
    }

    private GoogleDriveLocalSettings? TryReadDb()
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            EnsureTable(db);
            var connection = db.Database.GetDbConnection();
            var openedHere = connection.State != ConnectionState.Open;
            if (openedHere)
                connection.Open();
            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = """
                    SELECT "RefreshToken", "Email", "AccessToken", "AccessTokenIssuedUtc",
                           "FolderId", "FolderName", "SharedDriveId"
                    FROM "GoogleDriveConnection"
                    WHERE "Id" = 1
                    """;
                using var reader = command.ExecuteReader();
                if (!reader.Read())
                    return null;

                return new GoogleDriveLocalSettings
                {
                    RefreshToken = reader.IsDBNull(0) ? null : reader.GetString(0),
                    Email = reader.IsDBNull(1) ? null : reader.GetString(1),
                    AccessToken = reader.IsDBNull(2) ? null : reader.GetString(2),
                    AccessTokenIssuedUtc = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    FolderId = reader.IsDBNull(4) ? null : reader.GetString(4),
                    FolderName = reader.IsDBNull(5) ? null : reader.GetString(5),
                    SharedDriveId = reader.IsDBNull(6) ? null : reader.GetString(6)
                };
            }
            finally
            {
                if (openedHere)
                    connection.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Google Drive settings could not be read from the database: {ex.Message}");
            return null;
        }
    }

    private void TryWriteDb(GoogleDriveLocalSettings settings)
    {
        try
        {
            using var scope = _scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            EnsureTable(db);
            var connection = db.Database.GetDbConnection();
            var openedHere = connection.State != ConnectionState.Open;
            if (openedHere)
                connection.Open();
            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = """
                    INSERT INTO "GoogleDriveConnection" (
                        "Id", "RefreshToken", "Email", "AccessToken", "AccessTokenIssuedUtc",
                        "FolderId", "FolderName", "SharedDriveId", "UpdatedAt"
                    ) VALUES (
                        1, @refreshToken, @email, @accessToken, @issued,
                        @folderId, @folderName, @sharedDriveId, @updated
                    )
                    ON CONFLICT ("Id") DO UPDATE SET
                        "RefreshToken" = EXCLUDED."RefreshToken",
                        "Email" = EXCLUDED."Email",
                        "AccessToken" = EXCLUDED."AccessToken",
                        "AccessTokenIssuedUtc" = EXCLUDED."AccessTokenIssuedUtc",
                        "FolderId" = EXCLUDED."FolderId",
                        "FolderName" = EXCLUDED."FolderName",
                        "SharedDriveId" = EXCLUDED."SharedDriveId",
                        "UpdatedAt" = EXCLUDED."UpdatedAt"
                    """;
                Add(command, "@refreshToken", settings.RefreshToken);
                Add(command, "@email", settings.Email);
                Add(command, "@accessToken", settings.AccessToken);
                Add(command, "@issued", settings.AccessTokenIssuedUtc);
                Add(command, "@folderId", settings.FolderId);
                Add(command, "@folderName", settings.FolderName);
                Add(command, "@sharedDriveId", settings.SharedDriveId);
                Add(command, "@updated", DateTime.UtcNow);
                command.ExecuteNonQuery();
            }
            finally
            {
                if (openedHere)
                    connection.Close();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Google Drive settings could not be saved to the database: {ex.Message}");
        }
    }

    private void EnsureTable(AppDbContext db)
    {
        if (_tableReady)
            return;

        db.Database.ExecuteSqlRaw("""
            CREATE TABLE IF NOT EXISTS "GoogleDriveConnection" (
                "Id" integer PRIMARY KEY,
                "RefreshToken" text NULL,
                "Email" text NULL,
                "AccessToken" text NULL,
                "AccessTokenIssuedUtc" timestamp with time zone NULL,
                "FolderId" text NULL,
                "FolderName" text NULL,
                "SharedDriveId" text NULL,
                "UpdatedAt" timestamp with time zone NOT NULL
            );
            """);
        _tableReady = true;
    }

    private static void Add(System.Data.Common.DbCommand command, string name, object? value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }
}
