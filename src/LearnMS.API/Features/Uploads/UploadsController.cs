using LearnMS.API.Common;
using LearnMS.API.Common.ImgBb;
using LearnMS.API.Entities;
using LearnMS.API.Security;
using Microsoft.AspNetCore.Mvc;

namespace LearnMS.API.Features.Uploads;

[ApiController]
[Route("api/uploads")]
public sealed class UploadsController(IImgBbService imgBbService) : ControllerBase
{
    [HttpPost("imgbb")]
    [ApiAuthorize(Role = UserRole.Assistant, Permissions = [Permission.ManageCourses, Permission.ManageFiles])]
    public async Task<ApiWrapper.Success<ImgBbUploadResponse>> UploadImgBb(IFormFile file, CancellationToken ct)
    {
        if (file.Length == 0)
            throw new ApiException(new ApiError("Upload.Empty", "File is empty", StatusCodes.Status400BadRequest));

        if (file.Length > 10 * 1024 * 1024)
            throw new ApiException(new ApiError("Upload.TooLarge", "Image must be less than 10MB",
                StatusCodes.Status400BadRequest));

        var url = await imgBbService.UploadAsync(file, ct);
        return new ApiWrapper.Success<ImgBbUploadResponse>
        {
            Data = new ImgBbUploadResponse { Url = url },
            Message = "Image uploaded successfully"
        };
    }
}

public sealed class ImgBbUploadResponse
{
    public required string Url { get; set; }
}
