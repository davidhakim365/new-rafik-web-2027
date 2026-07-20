using LearnMS.API.Entities;

namespace LearnMS.API.Features.Rewards.Contracts;

public sealed class UpsertAppleStoreSettingsRequest
{
    public bool IsEnabled { get; set; }
    public DateTimeOffset? OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
}

public sealed class AppleStoreSettingsResult
{
    public bool IsEnabled { get; set; }
    public DateTimeOffset? OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
    public bool IsOpen { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class CreateAppleRewardItemRequest
{
    public required string Title { get; set; }
    public required string ImageUrl { get; set; }
    public required int AppleCost { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UpdateAppleRewardItemRequest
{
    public required string Title { get; set; }
    public required string ImageUrl { get; set; }
    public required int AppleCost { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class AppleRewardItemResult
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string ImageUrl { get; set; }
    public int AppleCost { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class RedeemAppleRewardRequest
{
    public Guid ItemId { get; set; }
}

public sealed class StudentAppleOrderResult
{
    public Guid Id { get; set; }
    public Guid ItemId { get; set; }
    public required string ItemTitle { get; set; }
    public string? ItemImageUrl { get; set; }
    public int AppleCost { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public sealed class StudentAppleStoreCatalogResult
{
    public bool IsOpen { get; set; }
    public DateTimeOffset? OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
    public int Apples { get; set; }
    public int ApplesSpentOnActiveOrders { get; set; }
    public required List<AppleRewardItemResult> Items { get; set; }
    public required List<StudentAppleOrderResult> MyOrders { get; set; }
}

public sealed class StudentAppleStoreStatusResult
{
    public bool IsOpen { get; set; }
    public DateTimeOffset? OpensAt { get; set; }
    public DateTimeOffset? ClosesAt { get; set; }
}

public sealed class RedeemAppleRewardResult
{
    public Guid OrderId { get; set; }
    public int Apples { get; set; }
    public required string Message { get; set; }
}

public sealed class CancelAppleRewardResult
{
    public Guid OrderId { get; set; }
    public int Apples { get; set; }
    public required string Message { get; set; }
}

public sealed class AppleStoreItemStat
{
    public Guid ItemId { get; set; }
    public required string Title { get; set; }
    public string? ImageUrl { get; set; }
    public int AppleCost { get; set; }
    public long ActiveOrders { get; set; }
    public long CancelledOrders { get; set; }
    public long TotalOrders { get; set; }
    public long ApplesSpentActive { get; set; }
}

public sealed class AppleStoreAdminOverviewResult
{
    public long ActiveOrders { get; set; }
    public long CancelledOrders { get; set; }
    public long TotalOrders { get; set; }
    public long ApplesSpentActive { get; set; }
    public long UniqueStudents { get; set; }
    public required List<AppleStoreItemStat> Items { get; set; }
}

public sealed class AppleStoreAdminOrderItem
{
    public Guid OrderId { get; set; }
    public Guid StudentId { get; set; }
    public required string StudentFullName { get; set; }
    public required string StudentCode { get; set; }
    public StudentLevel Level { get; set; }
    public Guid ItemId { get; set; }
    public required string ItemTitle { get; set; }
    public int AppleCost { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
}

public sealed class AppleStoreAdminOrdersResult
{
    public required List<AppleStoreAdminOrderItem> Items { get; set; }
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public sealed class AppleStoreOrderExportRow
{
    public required string StudentName { get; set; }
    public required string StudentCode { get; set; }
    public required string Level { get; set; }
    public required string ItemTitle { get; set; }
    public int Apples { get; set; }
    public required string Status { get; set; }
    public DateTime ChosenAt { get; set; }
}
