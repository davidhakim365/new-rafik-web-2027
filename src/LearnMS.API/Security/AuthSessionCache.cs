using LearnMS.API.Entities;
using Microsoft.Extensions.Caching.Memory;

namespace LearnMS.API.Security;

public sealed class AuthSession
{
    public required Guid Id { get; init; }
    public required UserRole Role { get; init; }
    public bool IsBlocked { get; init; }
    public string? DeviceKey { get; init; }
    public Permission[] Permissions { get; init; } = [];
}

public interface IAuthSessionCache
{
    bool TryGet(Guid accountId, out AuthSession session);
    void Set(AuthSession session);
    void Invalidate(Guid accountId);
    void InvalidateAll();
}

/// <summary>
/// Short-lived copy of the account row used to authenticate API calls.
/// Every request used to read Accounts + Users from Postgres. Under traffic that
/// lookup became a large share of database work, while block, device, and
/// permission changes still drop the cached row immediately.
/// </summary>
public sealed class AuthSessionCache(IMemoryCache cache) : IAuthSessionCache
{
    private static readonly TimeSpan Lifetime = TimeSpan.FromSeconds(45);
    private int _generation;

    public bool TryGet(Guid accountId, out AuthSession session)
    {
        if (cache.TryGetValue(Key(accountId), out AuthSession? found) && found is not null)
        {
            session = found;
            return true;
        }

        session = null!;
        return false;
    }

    public void Set(AuthSession session)
    {
        cache.Set(Key(session.Id), session, Lifetime);
    }

    public void Invalidate(Guid accountId) => cache.Remove(Key(accountId));

    public void InvalidateAll() => Interlocked.Increment(ref _generation);

    private string Key(Guid accountId) => $"auth:{Volatile.Read(ref _generation)}:{accountId:N}";
}
