using System.Text.Json;
using LearnMS.API.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Middlewares;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "[GlobalExceptionHandler] ==> by {host}", httpContext.Request.Host);
        if (exception is ApiException apiException)
        {
            httpContext.Response.StatusCode = apiException.Error.StatusCode;
            await httpContext.Response.WriteAsJsonAsync(new ApiWrapper.Failure
            {
                Code = apiException.Error.Code,
                Message = apiException.Error.Message
            }, cancellationToken: cancellationToken);
            return true;
        }

        if (exception is JsonException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            await httpContext.Response.WriteAsJsonAsync(new ApiWrapper.Failure
            {
                Code = "validation/body",
                Message = "The submitted data is invalid. Check the form and try again."
            }, cancellationToken: cancellationToken);
            return true;
        }

        if (exception is DbUpdateException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await httpContext.Response.WriteAsJsonAsync(new ApiWrapper.Failure
            {
                Code = "server/database",
                Message = "Could not save. Please try again."
            }, cancellationToken: cancellationToken);
            return true;
        }

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await httpContext.Response.WriteAsJsonAsync(ServerErrors.Internal, cancellationToken: cancellationToken);

        return true;
    }
}
