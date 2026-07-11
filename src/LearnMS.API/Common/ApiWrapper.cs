using Microsoft.AspNetCore.Mvc;
using Serilog;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Common;

public static class ApiWrapper
{
    public class Success<TData>
    {
        public bool Status { get; } = true;
        public string? Message { get; init; }
        public TData? Data { get; init; }
    }

    public class Failure
    {
        public bool Status { get; } = false;
        public string? Message { get; init; }
        public required string Code { get; init; }

        public static IActionResult GenerateErrorResponse(ActionContext context)
        {
            Log.Debug("{@model}", context.ModelState);

            var apiError = new Failure
            {
                Code = $"validation/{context.ModelState.AsEnumerable().First(x => x.Value?.Errors.Count > 0).Key.ToLower()}",
                Message = context.ModelState.AsEnumerable().First(x => x.Value?.Errors.Count > 0).Value?.Errors.AsEnumerable().First().ErrorMessage
            };
            return new BadRequestObjectResult(apiError);
        }
    }
}

[SwaggerDiscriminator("typename")]
[SwaggerSubType(typeof(SuccessApiResponse<string>), DiscriminatorValue = "true")]
[SwaggerSubType(typeof(FailureApiResponse<string>), DiscriminatorValue = "false")]
public abstract record ApiResponse<T>
{
    public abstract string typename { get; }
}

public record SuccessApiResponse<TData> : ApiResponse<TData>
{
    public TData? Data { get; init; }

    public override string typename => "true";
}

public record FailureApiResponse<T> : ApiResponse<T>
{
    public override string typename => "false";
    public string? Message { get; init; }
    public required string Code { get; init; }
}