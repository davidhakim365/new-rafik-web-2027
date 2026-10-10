using System.Text;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Serilog;

namespace LearnMS.API.Features.AssistantTraces;

public sealed class AssistantTraceMiddleware(RequestDelegate next, AssistantTraceBackgroundWriter writer)
{
    private static readonly string[] MutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    public async Task InvokeAsync(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? string.Empty;
        var user = context.CurrentUser();
        var shouldTrace = ShouldTrace(method, path, user);
        var body = shouldTrace ? await ReadJsonPrefixAsync(context.Request) : null;

        await next(context);

        if (!shouldTrace || user is null || context.Response.StatusCode is < 200 or >= 300)
            return;

        writer.Enqueue(new AssistantTraceRequest(user.Id, user.Role, method, path, body));
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
}
