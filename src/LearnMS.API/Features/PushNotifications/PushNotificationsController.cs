using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.PushNotifications;

[Route("api/push")]
[Tags("PushNotifications")]
[ApiController]
public sealed class PushNotificationsController(
    PushNotificationsService pushNotificationsService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet("public-key")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManagePaymentRequests])]
    [SwaggerOperation(OperationId = "GetPushPublicKey")]
    public async Task<ApiWrapper.Success<string>> GetPublicKey(CancellationToken ct)
    {
        return new ApiWrapper.Success<string>
        {
            Data = await pushNotificationsService.GetPublicKeyAsync(ct),
            Message = "successfully retrieved push key"
        };
    }

    [HttpPost("subscriptions")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManagePaymentRequests])]
    [SwaggerOperation(OperationId = "CreatePushSubscription")]
    public async Task<ApiWrapper.Success<object?>> Subscribe(
        [FromBody] PushSubscriptionRequest request,
        CancellationToken ct)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        try
        {
            await pushNotificationsService.SubscribeAsync(
                currentUser.Id,
                request,
                Request.Headers.UserAgent.ToString(),
                ct);
        }
        catch (ArgumentException)
        {
            throw new ApiException(PushNotificationsErrors.InvalidSubscription);
        }

        return new ApiWrapper.Success<object?>
        {
            Data = null,
            Message = "Payment alerts are on for this phone"
        };
    }

    [HttpPost("test")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManagePaymentRequests])]
    [SwaggerOperation(OperationId = "SendTestPush")]
    public async Task<ApiWrapper.Success<int>> SendTest(CancellationToken ct)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);

        var sent = await pushNotificationsService.SendToUserAsync(currentUser.Id, new PushAlert(
            "Test payment alert",
            "Alerts work on this phone. New payment requests will show up like this.",
            "/dashboard/payment-requests",
            "payment-request-test"), ct);

        return new ApiWrapper.Success<int>
        {
            Data = sent,
            Message = sent > 0 ? "Test alert sent" : "No phone is subscribed yet"
        };
    }

    [HttpPost("subscriptions/remove")]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "RemovePushSubscription")]
    public async Task<ApiWrapper.Success<object?>> Unsubscribe(
        [FromBody] RemovePushSubscriptionRequest request,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request.Endpoint))
            await pushNotificationsService.UnsubscribeAsync(request.Endpoint, ct);

        return new ApiWrapper.Success<object?>
        {
            Data = null,
            Message = "Payment alerts are off for this phone"
        };
    }
}
