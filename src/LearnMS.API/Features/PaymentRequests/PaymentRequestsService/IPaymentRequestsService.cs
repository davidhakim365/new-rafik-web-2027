using LearnMS.API.Features.PaymentRequests.Contracts;

namespace LearnMS.API.Features.PaymentRequests;

public interface IPaymentRequestsService
{
    Task<PaymentRequestItem> ExecuteAsync(CreatePaymentRequestCommand command, CancellationToken ct = default);
    Task<PaymentRequestItem> ExecuteAsync(ConfirmPaymentRequestCommand command);
    Task<PaymentRequestItem> ExecuteAsync(RejectPaymentRequestCommand command);
    Task<PageList<PaymentRequestItem>> QueryAsync(GetMyPaymentRequestsQuery query);
    Task<PageList<PaymentRequestItem>> QueryAsync(GetPaymentRequestsQuery query);
    Task<PaymentRequestStats> QueryStatsAsync(CancellationToken ct = default);
}
