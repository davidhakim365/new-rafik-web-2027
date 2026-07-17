using LearnMS.API.Common;
using LearnMS.API.Features.Parent.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Parent;

[Route("api/parent")]
[Tags("Parent")]
[ApiController]
[AllowAnonymous]
public sealed class ParentController(IParentService parentService) : ControllerBase
{
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ApiWrapper.Success<ParentLoginResult>> Login([FromBody] ParentLoginRequest request)
    {
        var result = await parentService.LoginAsync(new ParentLoginCommand
        {
            StudentCode = request.StudentCode,
            PhoneNumber = request.PhoneNumber,
            ParentPhoneNumber = request.ParentPhoneNumber
        });

        return new()
        {
            Data = result,
            Message = "Parent signed in successfully"
        };
    }

    [HttpGet("progress")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ApiWrapper.Success<ParentProgressResult>> GetProgress()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var headerValue))
            throw new ApiException(ParentErrors.InvalidToken);

        var authorizationHeader = headerValue.FirstOrDefault() ?? string.Empty;
        var token = authorizationHeader.Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();

        if (string.IsNullOrWhiteSpace(token))
            throw new ApiException(ParentErrors.InvalidToken);

        var result = await parentService.GetProgressAsync(token);

        return new()
        {
            Data = result,
            Message = "Student progress retrieved successfully"
        };
    }
}
