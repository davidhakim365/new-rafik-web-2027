namespace LearnMS.API.Entities;

/// <summary>A browser that asked to be woken up for staff alerts such as new payment requests.</summary>
public class WebPushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Endpoint { get; set; }
    public required string P256dh { get; set; }
    public required string Auth { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>Server signing keys for web push. Kept in the database so every deploy reuses them.</summary>
public class WebPushKeys
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public required string PublicKey { get; set; }
    public required string PrivateKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
