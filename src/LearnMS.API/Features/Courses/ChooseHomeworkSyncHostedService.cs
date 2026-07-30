using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Courses.Contracts;
using LearnMS.API.ThirdParties.GoogleForms;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Courses;

/// <summary>
/// Periodically syncs Choose Homework scores from Google Forms for lectures that have a form configured.
/// </summary>
public sealed class ChooseHomeworkSyncHostedService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ChooseHomeworkSyncHostedService> _logger;

    public ChooseHomeworkSyncHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<ChooseHomeworkSyncHostedService> logger
    )
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Delay first run so the app can finish starting.
        try
        {
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncAllAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Choose homework background sync failed");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task SyncAllAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var googleForms = scope.ServiceProvider.GetRequiredService<IGoogleFormsService>();
        if (!googleForms.IsConfigured)
            return;

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var courses = scope.ServiceProvider.GetRequiredService<ICoursesService>();

        var lectures = await db
            .Set<Lecture>()
            .AsNoTracking()
            .Where(l => l.ChooseHomeworkFormId != null && l.ChooseHomeworkFormId != "")
            .Select(l => new { l.Id, l.CourseId })
            .ToListAsync(cancellationToken);

        foreach (var lecture in lectures)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                await courses.ExecuteAsync(
                    new SyncChooseHomeworkScoresCommand
                    {
                        CourseId = lecture.CourseId,
                        LectureId = lecture.Id
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to sync choose homework for lecture {LectureId}",
                    lecture.Id
                );
            }
        }
    }
}
