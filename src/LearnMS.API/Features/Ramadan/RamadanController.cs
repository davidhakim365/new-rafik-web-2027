using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Auth;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Ramadan;

[ApiController]
[Route("api/ramadan")]
[Tags("Ramadan")]
public sealed class RamadanController(
    IRamadanService ramadanService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "GetRamadanDecorations")]
    public async Task<ApiWrapper.Success<RamadanSettingsResult>> Get(CancellationToken ct)
    {
        var result = await ramadanService.GetAsync(ct);
        return new ApiWrapper.Success<RamadanSettingsResult>
        {
            Data = result,
            Message = "Ramadan decorations"
        };
    }

    [HttpPut]
    [ApiAuthorize]
    [SwaggerOperation(OperationId = "UpdateRamadanDecorations")]
    public async Task<ApiWrapper.Success<RamadanSettingsResult>> Update(
        [FromBody] UpdateRamadanSettingsRequest request,
        CancellationToken ct)
    {
        var currentUser = await currentUserService.GetUserAsync()
            ?? throw new ApiException(AuthErrors.Unauthorized);
        if (currentUser.Role != UserRole.Teacher)
            throw new ApiException(AuthErrors.Forbidden);

        var result = await ramadanService.UpdateAsync(request.Enabled, ct);
        return new ApiWrapper.Success<RamadanSettingsResult>
        {
            Data = result,
            Message = request.Enabled
                ? "Ramadan decorations turned on"
                : "Ramadan decorations turned off"
        };
    }
}
