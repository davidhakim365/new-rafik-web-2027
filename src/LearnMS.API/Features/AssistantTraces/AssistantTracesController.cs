using System.ComponentModel.DataAnnotations;
using LearnMS.API.Common;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.AssistantTraces;

public sealed record AssistantTraceItem
{
    [Required] public required Guid Id { get; init; }
    [Required] public required Guid ActorId { get; init; }
    [Required] public required string ActorRole { get; init; }
    [Required] public required string ActorName { get; init; }
    [Required] public required string Action { get; init; }
    public string? Detail { get; init; }
    [Required] public required string Method { get; init; }
    [Required] public required string Path { get; init; }
    public Guid? CourseId { get; init; }
    public string? CourseTitle { get; init; }
    public Guid? LectureId { get; init; }
    public string? LectureTitle { get; init; }
    [Required] public required DateTime CreatedAt { get; init; }
}

public sealed record AssistantTraceCourseOption
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
}

public sealed record AssistantTraceLectureOption
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
    [Required] public required Guid CourseId { get; init; }
    [Required] public required string CourseTitle { get; init; }
}

public sealed record AssistantTraceAssistantOption
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string Email { get; init; }
}

public sealed record AssistantTraceOptions
{
    [Required] public required List<AssistantTraceCourseOption> Courses { get; init; }
    [Required] public required List<AssistantTraceLectureOption> Lectures { get; init; }
    [Required] public required List<AssistantTraceAssistantOption> Assistants { get; init; }
}

[Route("api/assistant-traces")]
[Tags("Assistant Traces")]
[ApiController]
[ApiAuthorize]
public sealed class AssistantTracesController(AppDbContext context) : ControllerBase
{
    [HttpGet("options")]
    public async Task<ApiWrapper.Success<AssistantTraceOptions>> Options()
    {
        RequireTeacher();

        var courses = await context.Courses.AsNoTracking()
            .OrderBy(item => item.Title)
            .Select(item => new AssistantTraceCourseOption
            {
                Id = item.Id,
                Title = item.Title
            })
            .ToListAsync();

        var lectures = await context.Lectures.AsNoTracking()
            .OrderBy(item => item.Course.Title)
            .ThenBy(item => item.Order)
            .ThenBy(item => item.Title)
            .Select(item => new AssistantTraceLectureOption
            {
                Id = item.Id,
                Title = item.Title,
                CourseId = item.CourseId,
                CourseTitle = item.Course.Title
            })
            .ToListAsync();

        var assistants = await context.Assistants.AsNoTracking()
            .Select(item => new AssistantTraceAssistantOption
            {
                Id = item.Id,
                FullName = item.FullName,
                Email = item.Accounts.Select(account => account.Email).FirstOrDefault() ?? ""
            })
            .ToListAsync();

        assistants = assistants
            .OrderBy(item => string.IsNullOrWhiteSpace(item.FullName) ? item.Email : item.FullName)
            .ToList();

        return new ApiWrapper.Success<AssistantTraceOptions>
        {
            Data = new AssistantTraceOptions
            {
                Courses = courses,
                Lectures = lectures,
                Assistants = assistants
            }
        };
    }

    [HttpGet]
    public async Task<ApiWrapper.Success<PageList<AssistantTraceItem>>> Get(
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        [FromQuery] string? search,
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? lectureId,
        [FromQuery] string? actor)
    {
        var user = RequireTeacher();
        var pageNumber = page is null or < 1 ? 1 : page.Value;
        var size = pageSize is null or < 1 ? 20 : Math.Min(pageSize.Value, 100);

        var query = context.AssistantTraces.AsNoTracking().AsQueryable();

        if (courseId is not null)
            query = query.Where(item => item.CourseId == courseId);
        if (lectureId is not null)
            query = query.Where(item => item.LectureId == lectureId);

        if (string.Equals(actor, "me", StringComparison.OrdinalIgnoreCase))
            query = query.Where(item => item.ActorId == user.Id);
        else if (Guid.TryParse(actor, out var actorId))
            query = query.Where(item => item.ActorId == actorId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(item =>
                item.Action.ToLower().Contains(term)
                || item.ActorName.ToLower().Contains(term)
                || (item.Detail != null && item.Detail.ToLower().Contains(term))
                || (item.CourseTitle != null && item.CourseTitle.ToLower().Contains(term))
                || (item.LectureTitle != null && item.LectureTitle.ToLower().Contains(term)));
        }

        query = query.OrderByDescending(item => item.CreatedAt);

        var projected = query.Select(item => new AssistantTraceItem
        {
            Id = item.Id,
            ActorId = item.ActorId,
            ActorRole = item.ActorRole,
            ActorName = item.ActorName,
            Action = item.Action,
            Detail = item.Detail,
            Method = item.Method,
            Path = item.Path,
            CourseId = item.CourseId,
            CourseTitle = item.CourseTitle,
            LectureId = item.LectureId,
            LectureTitle = item.LectureTitle,
            CreatedAt = item.CreatedAt
        });

        var result = await PageList<AssistantTraceItem>.CreateAsync(projected, pageNumber, size);
        return new ApiWrapper.Success<PageList<AssistantTraceItem>>
        {
            Data = result
        };
    }

    private CurrentUser RequireTeacher()
    {
        var user = HttpContext.CurrentUser();
        if (user is null)
            throw new ApiException(AuthErrors.Unauthorized);
        if (user.Role != UserRole.Teacher)
            throw new ApiException(AuthErrors.Forbidden);
        return user;
    }
}
