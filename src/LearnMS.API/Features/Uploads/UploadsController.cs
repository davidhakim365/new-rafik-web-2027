using LearnMS.API.Common;
using LearnMS.API.Common.Cloudinary;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Uploads;

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController(ICloudinaryService cloudinary) : ControllerBase
{
    [HttpPost("cloudinary")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses, Permission.ManageLecture, Permission.ManageFiles, Permission.ManageStudentApples, Permission.ManageAppleRewardsStore])]
    public async Task<ApiWrapper.Success<CloudinaryUploadResponse>> Upload(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
            throw new ApiException(new ApiError("Upload.Empty", "File is empty", StatusCodes.Status400BadRequest));

        if (file.Length > 10 * 1024 * 1024)
            throw new ApiException(new ApiError("Upload.TooLarge", "Image must be less than 10MB",
                StatusCodes.Status400BadRequest));

        var url = await cloudinary.UploadAsync(file, ct);
        return new ApiWrapper.Success<CloudinaryUploadResponse>
        {
            Data = new CloudinaryUploadResponse { Url = url },
            Message = "Image uploaded successfully"
        };
    }
}

public sealed class CloudinaryUploadResponse
{
    public required string Url { get; set; }
}
