using LearnMS.API.Entities;
using LearnMS.API.Features.Rewards.Contracts;

namespace LearnMS.API.Features.Rewards;

public interface IAppleStoreService
{
    Task<AppleStoreSettingsResult> GetSettingsAsync();
    Task<AppleStoreSettingsResult> UpdateSettingsAsync(UpsertAppleStoreSettingsRequest request);
    Task<List<AppleRewardItemResult>> ListItemsAsync(bool includeInactive);
    Task<AppleRewardItemResult> CreateItemAsync(CreateAppleRewardItemRequest request);
    Task<AppleRewardItemResult> UpdateItemAsync(Guid itemId, UpdateAppleRewardItemRequest request);
    Task DeleteItemAsync(Guid itemId);
    Task<StudentAppleStoreStatusResult> GetPublicStatusAsync();
    Task<StudentAppleStoreCatalogResult> GetCatalogAsync(Guid studentId);
    Task<RedeemAppleRewardResult> RedeemAsync(Guid studentId, RedeemAppleRewardRequest request);
    Task<CancelAppleRewardResult> CancelAsync(Guid studentId, Guid orderId);
    Task<AppleStoreAdminOverviewResult> GetAdminOverviewAsync();
    Task<AppleStoreAdminOrdersResult> GetAdminOrdersAsync(
        Guid? itemId,
        StudentLevel? level,
        AppleRewardOrderStatus? status,
        string? search,
        int page,
        int pageSize);
    IAsyncEnumerable<List<AppleStoreOrderExportRow>> ExportOrdersAsync(
        Guid? itemId,
        StudentLevel? level,
        AppleRewardOrderStatus? status);
}
