using System.Threading.Channels;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using Serilog;

namespace LearnMS.API.Features.AssistantTraces;

public readonly record struct AssistantTraceRequest(
    Guid ActorId,
    UserRole Role,
    string Method,
    string Path,
    string? Body);

/// <summary>
/// Records assistant and teacher actions after the response is already on its way.
/// The trace is still saved. The person who clicked does not wait for the extra lookups.
/// </summary>
public sealed class AssistantTraceBackgroundWriter(IServiceScopeFactory scopes) : BackgroundService
{
    private readonly Channel<AssistantTraceRequest> _channel = Channel.CreateUnbounded<AssistantTraceRequest>(
        new UnboundedChannelOptions { SingleReader = true });

    public void Enqueue(AssistantTraceRequest request)
    {
        if (!_channel.Writer.TryWrite(request))
            Log.Warning("Assistant trace queue rejected {Method} {Path}", request.Method, request.Path);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in _channel.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await AssistantTraceWriter.WriteAsync(db, request, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Log.Warning(ex, "Failed to write assistant trace for {Method} {Path}", request.Method, request.Path);
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _channel.Writer.TryComplete();
        await base.StopAsync(cancellationToken);
    }
}
