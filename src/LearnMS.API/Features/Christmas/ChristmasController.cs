using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Christmas;

[ApiController]
[Route("api/christmas")]
[Tags("Christmas")]
public sealed class ChristmasController(
    IChristmasService christmasService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "GetChristmasDecorations")]
    public async Task<ApiWrapper.Success<ChristmasSettingsResult>> Get(CancellationToken ct)
    {
        var result = await christmasService.GetAsync(ct);
        return new ApiWrapper.Success<ChristmasSettingsResult>
        {
            Data = result,
            Message = "Christmas decorations"
        };
    }

    [HttpPut]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "UpdateChristmasDecorations")]
    public async Task<ApiWrapper.Success<ChristmasSettingsResult>> Update(
        [FromBody] UpdateChristmasSettingsRequest request,
        CancellationToken ct)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);
        if (currentUser.Role != UserRole.Teacher)
            throw new ApiException(AuthErrors.Forbidden);

        var result = await christmasService.UpdateAsync(request.Enabled, ct);
        return new ApiWrapper.Success<ChristmasSettingsResult>
        {
            Data = result,
            Message = request.Enabled
                ? "Christmas decorations turned on"
                : "Christmas decorations turned off"
        };
    }
}
