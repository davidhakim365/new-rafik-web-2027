using System.Globalization;
using CsvHelper;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Features.Rewards.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Rewards;

[Route("api/rewards/store")]
[Tags("AppleStore")]
public sealed class AppleStoreController(
    IAppleStoreService appleStoreService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("settings")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "GetAppleStoreSettings")]
    public async Task<ApiWrapper.Success<AppleStoreSettingsResult>> GetSettings()
    {
        var data = await appleStoreService.GetSettingsAsync();
        return new() { Data = data, Message = "Retrieved store settings" };
    }

    [HttpPut("settings")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "UpdateAppleStoreSettings")]
    public async Task<ApiWrapper.Success<AppleStoreSettingsResult>> UpdateSettings(
        [FromBody] UpsertAppleStoreSettingsRequest request)
    {
        var data = await appleStoreService.UpdateSettingsAsync(request);
        return new() { Data = data, Message = "Store schedule updated" };
    }

    [HttpGet("items")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "ListAppleStoreItems")]
    public async Task<ApiWrapper.Success<List<AppleRewardItemResult>>> ListItems(
        [FromQuery] bool includeInactive = true)
    {
        var data = await appleStoreService.ListItemsAsync(includeInactive);
        return new() { Data = data, Message = "Retrieved store items" };
    }

    [HttpPost("items")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "CreateAppleStoreItem")]
    public async Task<ApiWrapper.Success<AppleRewardItemResult>> CreateItem(
        [FromBody] CreateAppleRewardItemRequest request)
    {
        var data = await appleStoreService.CreateItemAsync(request);
        return new() { Data = data, Message = "Item created" };
    }

    [HttpPut("items/{itemId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "UpdateAppleStoreItem")]
    public async Task<ApiWrapper.Success<AppleRewardItemResult>> UpdateItem(
        Guid itemId,
        [FromBody] UpdateAppleRewardItemRequest request)
    {
        var data = await appleStoreService.UpdateItemAsync(itemId, request);
        return new() { Data = data, Message = "Item updated" };
    }

    [HttpDelete("items/{itemId:guid}")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "DeleteAppleStoreItem")]
    public async Task<ApiWrapper.Success<object?>> DeleteItem(Guid itemId)
    {
        await appleStoreService.DeleteItemAsync(itemId);
        return new() { Data = null, Message = "Item deactivated" };
    }

    [HttpGet("admin/overview")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "GetAppleStoreAdminOverview")]
    public async Task<ApiWrapper.Success<AppleStoreAdminOverviewResult>> GetOverview()
    {
        var data = await appleStoreService.GetAdminOverviewAsync();
        return new() { Data = data, Message = "Retrieved store overview" };
    }

    [HttpGet("admin/orders")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "GetAppleStoreAdminOrders")]
    public async Task<ApiWrapper.Success<AppleStoreAdminOrdersResult>> GetOrders(
        [FromQuery] Guid? itemId,
        [FromQuery] StudentLevel? level,
        [FromQuery] AppleRewardOrderStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var data = await appleStoreService.GetAdminOrdersAsync(itemId, level, status, search, page, pageSize);
        return new() { Data = data, Message = "Retrieved store orders" };
    }

    [HttpGet("admin/orders/export")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageAppleRewardsStore])]
    [SwaggerOperation(OperationId = "ExportAppleStoreOrders")]
    public async Task<IActionResult> ExportOrders(
        [FromQuery] Guid? itemId,
        [FromQuery] StudentLevel? level,
        [FromQuery] AppleRewardOrderStatus? status)
    {
        Response.Headers.Append("Content-Type", "text/csv");
        Response.Headers.Append("Content-Disposition", "attachment; filename=apple-reward-orders.csv");

        await using var sw = new StreamWriter(Response.Body);
        await using var csv = new CsvWriter(sw, CultureInfo.InvariantCulture);

        await foreach (var records in appleStoreService.ExportOrdersAsync(itemId, level, status))
        {
            await csv.WriteRecordsAsync(records);
            await csv.FlushAsync();
            await sw.FlushAsync();
        }

        return new EmptyResult();
    }

    [HttpGet("status")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "GetAppleStoreStatus")]
    public async Task<ApiWrapper.Success<StudentAppleStoreStatusResult>> GetStatus()
    {
        var data = await appleStoreService.GetPublicStatusAsync();
        return new() { Data = data, Message = "Retrieved store status" };
    }

    [HttpGet("catalog")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "GetAppleStoreCatalog")]
    public async Task<ApiWrapper.Success<StudentAppleStoreCatalogResult>> GetCatalog()
    {
        var student = await EnsureStudentAsync();
        var data = await appleStoreService.GetCatalogAsync(student.Id);
        return new() { Data = data, Message = "Retrieved apple rewards catalog" };
    }

    [HttpPost("orders")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "RedeemAppleStoreItem")]
    public async Task<ApiWrapper.Success<RedeemAppleRewardResult>> Redeem(
        [FromBody] RedeemAppleRewardRequest request)
    {
        var student = await EnsureStudentAsync();
        var data = await appleStoreService.RedeemAsync(student.Id, request);
        return new() { Data = data, Message = data.Message };
    }

    [HttpPost("orders/{orderId:guid}/cancel")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "CancelAppleStoreOrder")]
    public async Task<ApiWrapper.Success<CancelAppleRewardResult>> Cancel(Guid orderId)
    {
        var student = await EnsureStudentAsync();
        var data = await appleStoreService.CancelAsync(student.Id, orderId);
        return new() { Data = data, Message = data.Message };
    }

    private async Task<CurrentUser> EnsureStudentAsync()
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        if (currentUser.Role != UserRole.Student)
            throw new ApiException(AuthErrors.Forbidden);

        return currentUser;
    }
}
