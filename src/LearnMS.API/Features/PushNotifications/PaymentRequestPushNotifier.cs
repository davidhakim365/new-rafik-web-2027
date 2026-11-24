using System.Globalization;
using System.Threading.Channels;
using Serilog;

namespace LearnMS.API.Features.PushNotifications;

public readonly record struct NewPaymentRequestAlert(Guid RequestId, string StudentName, decimal Amount);

/// <summary>
/// Sends the phone alert after the student's request is saved.
/// The student does not wait for every assistant's phone to be reached.
/// </summary>
public sealed class PaymentRequestPushNotifier(IServiceScopeFactory scopes) : BackgroundService
{
    private readonly Channel<NewPaymentRequestAlert> _channel = Channel.CreateUnbounded<NewPaymentRequestAlert>(
        new UnboundedChannelOptions { SingleReader = true });

    public void Enqueue(NewPaymentRequestAlert alert)
    {
        if (!_channel.Writer.TryWrite(alert))
            Log.Warning("Payment request push queue rejected {RequestId}", alert.RequestId);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var alert in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var push = scope.ServiceProvider.GetRequiredService<PushNotificationsService>();
                var amount = alert.Amount.ToString("0.##", CultureInfo.InvariantCulture);
                await push.SendToPaymentReviewersAsync(new PushAlert(
                    "New payment request",
                    $"{alert.StudentName} sent {amount} LE",
                    "/dashboard/payment-requests",
                    $"payment-request-{alert.RequestId}"), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Log.Warning(ex, "Failed to push payment request {RequestId}", alert.RequestId);
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _channel.Writer.TryComplete();
        await base.StopAsync(cancellationToken);
    }
}
