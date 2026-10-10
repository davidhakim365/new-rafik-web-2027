using LearnMS.API.Data;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace LearnMS.API.Features.AssistantTraces;

public static class AssistantTraceWriter
{
    public static async Task WriteAsync(AppDbContext db, AssistantTraceRequest request, CancellationToken cancellationToken)
    {
        var (courseId, lectureId, studentId, studentCode) = AssistantTraceDescription.ExtractIds(request.Path);
        AssistantTraceDescription.ReadIdsFromBody(request.Body, ref courseId, ref lectureId, ref studentId);

        string? courseTitle = null;
        string? lectureTitle = null;
        if (lectureId is not null)
        {
            var lecture = await db.Lectures.AsNoTracking()
                .Where(item => item.Id == lectureId)
                .Select(item => new { item.Title, item.CourseId, CourseTitle = item.Course.Title })
                .FirstOrDefaultAsync(cancellationToken);
            if (lecture is not null)
            {
                lectureTitle = lecture.Title;
                courseId ??= lecture.CourseId;
                courseTitle = lecture.CourseTitle;
            }
        }

        if (courseId is not null && courseTitle is null)
        {
            courseTitle = await db.Courses.AsNoTracking()
                .Where(item => item.Id == courseId)
                .Select(item => item.Title)
                .FirstOrDefaultAsync(cancellationToken);
        }

        string? studentLabel = null;
        if (studentId is not null)
        {
            var student = await db.Students.AsNoTracking()
                .Where(item => item.Id == studentId)
                .Select(item => new { item.FullName, item.StudentCode })
                .FirstOrDefaultAsync(cancellationToken);
            if (student is not null)
                studentLabel = Label(student.FullName, student.StudentCode);
        }
        else if (!string.IsNullOrWhiteSpace(studentCode))
        {
            var student = await db.Students.AsNoTracking()
                .Where(item => item.StudentCode == studentCode)
                .Select(item => new { item.FullName, item.StudentCode })
                .FirstOrDefaultAsync(cancellationToken);
            if (student is not null)
                studentLabel = Label(student.FullName, student.StudentCode);
        }

        var detail = AssistantTraceDescription.BuildDetail(request.Body);
        if (!string.IsNullOrWhiteSpace(studentLabel))
            detail = string.IsNullOrWhiteSpace(detail) ? studentLabel : $"{studentLabel} · {detail}";
        if (detail is { Length: > 500 })
            detail = detail[..500];

        var actorName = await ActorNameAsync(db, request.ActorId, request.Role, cancellationToken);
        var tracePath = request.Path.Length > 512 ? request.Path[..512] : request.Path;

        db.AssistantTraces.Add(new AssistantTrace
        {
            Id = Guid.NewGuid(),
            ActorId = request.ActorId,
            ActorRole = request.Role.ToString(),
            ActorName = actorName,
            Action = AssistantTraceDescription.Describe(request.Method, request.Path),
            Detail = detail,
            Method = request.Method.ToUpperInvariant(),
            Path = tracePath,
            CourseId = courseId,
            CourseTitle = Trim(courseTitle, 256),
            LectureId = lectureId,
            LectureTitle = Trim(lectureTitle, 256),
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<string> ActorNameAsync(
        AppDbContext db,
        Guid actorId,
        UserRole role,
        CancellationToken cancellationToken)
    {
        if (role == UserRole.Teacher)
            return "Admin";

        var assistant = await db.Assistants.AsNoTracking()
            .Where(item => item.Id == actorId)
            .Select(item => item.FullName)
            .FirstOrDefaultAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(assistant))
            return Trim(assistant.Trim(), 256)!;

        var email = await db.Accounts.AsNoTracking()
            .Where(item => item.Id == actorId)
            .Select(item => item.Email)
            .FirstOrDefaultAsync(cancellationToken);
        return Trim(string.IsNullOrWhiteSpace(email) ? "Assistant" : email, 256)!;
    }

    private static string Label(string name, string code)
    {
        var trimmed = name.Trim();
        return string.IsNullOrWhiteSpace(code) ? trimmed : $"{trimmed} ({code})";
    }

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value;
        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }
}
