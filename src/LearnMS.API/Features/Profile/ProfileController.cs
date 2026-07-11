using System.Text.Json;
using LearnMS.API.Common;
using LearnMS.API.Entities;
using LearnMS.API.Features.Profile.Contracts;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LearnMS.API.Features.Profile;

[Route("api/profile")]
[Tags("Profile")]
public sealed class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly ICurrentUserService _currentUserService;

    public ProfileController(IProfileService profileService, ICurrentUserService currentUserService)
    {
        _profileService = profileService;
        _currentUserService = currentUserService;
    }

    [HttpPatch]
    [ApiAuthorize(Role = UserRole.Student)]
    public async Task<ApiWrapper.Success<object?>> Patch([FromBody] UpdateStudentProfileRequest request)
    {
        var user = await _currentUserService.GetUserAsync();

        if (user is null)
        {
            throw new ApiException(ProfileErrors.NotLoggedIn);
        }

        await _profileService.ExecuteAsync(new UpdateStudentProfileCommand
        {
            Id = user.Id,
            FullName = request.FullName,
            Level = request.Level,
            ParentPhoneNumber = request.ParentPhoneNumber,
            StudentCode = request.StudentCode,
            ProfilePicture = request.ProfilePicture,
            PhoneNumber = request.PhoneNumber,
            SchoolName = request.SchoolName,
        });

        return new()
        {
            Message = "Profile updated successfully"
        };
    }

    [HttpGet]
    [SwaggerOperation(OperationId = "GetProfile")]
    public async Task<ApiWrapper.Success<GetProfileResult?>> Get()
    {
        var user = HttpContext.CurrentUser();

        if (user is null)
        {
            return new()
            {
                Message = "Not logged in"
            };
        }

        return new()
        {
            Data = await _profileService.QueryAsync(new GetProfileQuery { Id = user.Id }),
            Message = "Profile retrieved successfully"
        };
    }
}