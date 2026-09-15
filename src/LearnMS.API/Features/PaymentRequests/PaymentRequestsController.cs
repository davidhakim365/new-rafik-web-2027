using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.PaymentRequests.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.PaymentRequests;

[Route("api/payment-requests")]
[Tags("PaymentRequests")]
[ApiController]
public sealed class PaymentRequestsController(
    IPaymentRequestsService paymentRequestsService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost]
    [ApiAuthorize(Role = UserRole.Student)]
    [RequestSizeLimit(10 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 10 * 1024 * 1024)]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [SwaggerOperation(OperationId = "CreatePaymentRequest")]
    public async Task<ApiWrapper.Success<PaymentRequestItem>> Post(
        [FromForm] CreatePaymentRequestRequest request,
        CancellationToken ct)
    {
        var currentUser = await currentUserService.GetUserAsync();

        if (request.Image is null)
            throw new ApiException(PaymentRequestsErrors.InvalidImage);

        var result = await paymentRequestsService.ExecuteAsync(new CreatePaymentRequestCommand
        {
            StudentId = currentUser!.Id,
            Amount = request.Amount,
            Note = request.Note,
            Image = request.Image
        }, ct);

        Response.StatusCode = StatusCodes.Status201Created;
        return new ApiWrapper.Success<PaymentRequestItem>
        {
            Data = result,
            Message = "Payment request submitted. It will be added to your balance after the teacher confirms it."
        };
    }

    [HttpGet("mine")]
    [ApiAuthorize(Role = UserRole.Student)]
    [SwaggerOperation(OperationId = "GetMyPaymentRequests")]
    public async Task<ApiWrapper.Success<PageList<PaymentRequestItem>>> GetMine(
        [FromQuery] int? page,
        [FromQuery] int? pageSize)
    {
        var currentUser = await currentUserService.GetUserAsync();

        var result = await paymentRequestsService.QueryAsync(new GetMyPaymentRequestsQuery
        {
            StudentId = currentUser!.Id,
            Page = page,
            PageSize = pageSize
        });

        return new ApiWrapper.Success<PageList<PaymentRequestItem>>
        {
            Data = result,
            Message = "successfully retrieved payment requests"
        };
    }

    [HttpGet]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "GetPaymentRequests")]
    public async Task<ApiWrapper.Success<PageList<PaymentRequestItem>>> Get(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search,
        [FromQuery] string? status)
    {
        PaymentRequestStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status)
            && !string.Equals(status, "all", StringComparison.OrdinalIgnoreCase)
            && Enum.TryParse<PaymentRequestStatus>(status, true, out var statusValue))
        {
            parsedStatus = statusValue;
        }

        var result = await paymentRequestsService.QueryAsync(new GetPaymentRequestsQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            Status = parsedStatus
        });

        return new ApiWrapper.Success<PageList<PaymentRequestItem>>
        {
            Data = result,
            Message = "successfully retrieved payment requests"
        };
    }

    [HttpPost("{id:guid}/confirm")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "ConfirmPaymentRequest")]
    public async Task<ApiWrapper.Success<PaymentRequestItem>> Confirm(Guid id)
    {
        var currentUser = await currentUserService.GetUserAsync();

        var result = await paymentRequestsService.ExecuteAsync(new ConfirmPaymentRequestCommand
        {
            Id = id,
            ReviewedById = currentUser!.Id,
            AssistantId = currentUser.Role == UserRole.Assistant ? currentUser.Id : null
        });

        return new ApiWrapper.Success<PaymentRequestItem>
        {
            Data = result,
            Message = "Payment confirmed. The amount was added to the student balance."
        };
    }

    [HttpPost("{id:guid}/reject")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageStudents])]
    [SwaggerOperation(OperationId = "RejectPaymentRequest")]
    public async Task<ApiWrapper.Success<PaymentRequestItem>> Reject(
        Guid id,
        [FromBody] RejectPaymentRequestRequest? request)
    {
        var currentUser = await currentUserService.GetUserAsync();

        var result = await paymentRequestsService.ExecuteAsync(new RejectPaymentRequestCommand
        {
            Id = id,
            ReviewedById = currentUser!.Id,
            Reason = request?.Reason
        });

        return new ApiWrapper.Success<PaymentRequestItem>
        {
            Data = result,
            Message = "Payment request rejected"
        };
    }
}
