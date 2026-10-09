using System.Text;
using LearnMS.API.Data;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Microsoft.EntityFrameworkCore;
using Serilog;

namespace LearnMS.API.Features.AssistantTraces;

public sealed class AssistantTraceMiddleware(RequestDelegate next)
{
    private static readonly string[] MutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;
        var user = context.CurrentUser();
        var shouldTrace = ShouldTrace(method, path, user);
        var body = shouldTrace ? await ReadJsonPrefixAsync(context.Request) : null;

        await next(context);

        if (!shouldTrace || context.Response.StatusCode is < 200 or >= 300)
            return;

        try
        {
            await WriteAsync(db, user!, method, path, body);
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "Failed to write assistant trace for {Method} {Path}", method, path);
        }
    }

    private static bool ShouldTrace(string method, string path, CurrentUser? user)
    {
        if (user is null)
            return false;
        if (user.Role is not (UserRole.Assistant or UserRole.Teacher))
            return false;
        if (!MutatingMethods.Contains(method, StringComparer.OrdinalIgnoreCase))
            return false;
        if (!path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
            return false;
        return !AssistantTraceDescription.ShouldSkip(path);
    }

    private static async Task<string?> ReadJsonPrefixAsync(HttpRequest request)
    {
        var contentType = request.ContentType;
        if (contentType is null || !contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
            return null;
        if (request.ContentLength is > 256_000)
            return null;

        try
        {
            request.EnableBuffering(bufferThreshold: 32 * 1024, bufferLimit: 256 * 1024);
            request.Body.Position = 0;
            using var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true);
            var buffer = new char[32_768];
            var read = await reader.ReadAsync(buffer.AsMemory());
            return read == 0 ? null : new string(buffer, 0, read);
        }
        catch (Exception ex)
        {
            Log.Debug(ex, "Could not read request body for assistant trace");
            return null;
        }
        finally
        {
            if (request.Body.CanSeek)
                request.Body.Position = 0;
        }
    }

    private static async Task WriteAsync(AppDbContext db, CurrentUser user, string method, string path, string? body)
    {
        var (courseId, lectureId, studentId, studentCode) = AssistantTraceDescription.ExtractIds(path);
        AssistantTraceDescription.ReadIdsFromBody(body, ref courseId, ref lectureId, ref studentId);

        string? courseTitle = null;
        string? lectureTitle = null;
        if (lectureId is not null)
        {
            var lecture = await db.Lectures.AsNoTracking()
                .Where(item => item.Id == lectureId)
                .Select(item => new { item.Title, item.CourseId, CourseTitle = item.Course.Title })
                .FirstOrDefaultAsync();
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
                .FirstOrDefaultAsync();
        }

        string? studentLabel = null;
        if (studentId is not null)
        {
            var student = await db.Students.AsNoTracking()
                .Where(item => item.Id == studentId)
                .Select(item => new { item.FullName, item.StudentCode })
                .FirstOrDefaultAsync();
            if (student is not null)
                studentLabel = Label(student.FullName, student.StudentCode);
        }
        else if (!string.IsNullOrWhiteSpace(studentCode))
        {
            var student = await db.Students.AsNoTracking()
                .Where(item => item.StudentCode == studentCode)
                .Select(item => new { item.FullName, item.StudentCode })
                .FirstOrDefaultAsync();
            if (student is not null)
                studentLabel = Label(student.FullName, student.StudentCode);
        }

        var detail = AssistantTraceDescription.BuildDetail(body);
        if (!string.IsNullOrWhiteSpace(studentLabel))
            detail = string.IsNullOrWhiteSpace(detail) ? studentLabel : $"{studentLabel} · {detail}";
        if (detail is { Length: > 500 })
            detail = detail[..500];

        var actorName = await ActorNameAsync(db, user);
        var tracePath = path.Length > 512 ? path[..512] : path;

        db.AssistantTraces.Add(new AssistantTrace
        {
            Id = Guid.NewGuid(),
            ActorId = user.Id,
            ActorRole = user.Role.ToString(),
            ActorName = actorName,
            Action = AssistantTraceDescription.Describe(method, path),
            Detail = detail,
            Method = method.ToUpperInvariant(),
            Path = tracePath,
            CourseId = courseId,
            CourseTitle = Trim(courseTitle, 256),
            LectureId = lectureId,
            LectureTitle = Trim(lectureTitle, 256),
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }

    private static async Task<string> ActorNameAsync(AppDbContext db, CurrentUser user)
    {
        if (user.Role == UserRole.Teacher)
            return "Admin";

        var assistant = await db.Assistants.AsNoTracking()
            .Where(item => item.Id == user.Id)
            .Select(item => item.FullName)
            .FirstOrDefaultAsync();
        if (!string.IsNullOrWhiteSpace(assistant))
            return Trim(assistant.Trim(), 256)!;

        var email = await db.Accounts.AsNoTracking()
            .Where(item => item.Id == user.Id)
            .Select(item => item.Email)
            .FirstOrDefaultAsync();
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
