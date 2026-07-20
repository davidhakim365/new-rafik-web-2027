using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AppleRewardOrderStatus
{
    Active,
    Cancelled
}

public class AppleRewardItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string ImageUrl { get; set; }
    public required int AppleCost { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AppleStoreSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public bool IsEnabled { get; set; }
    public DateTimeOffset? OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public bool IsOpenAt(DateTimeOffset now)
    {
        if (!IsEnabled) return false;
        if (OpensAt is not null && now < OpensAt) return false;
        if (ClosesAt is not null && now > ClosesAt) return false;
        return true;
    }
}

public class AppleRewardOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid StudentId { get; set; }
    public required Guid ItemId { get; set; }
    public required string ItemTitleSnapshot { get; set; }
    public required int AppleCostSnapshot { get; set; }
    public AppleRewardOrderStatus Status { get; set; } = AppleRewardOrderStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }

    public Student? Student { get; set; }
    public AppleRewardItem? Item { get; set; }
}
