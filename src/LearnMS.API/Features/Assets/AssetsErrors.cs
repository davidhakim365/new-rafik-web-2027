using LearnMS.API.Common;

namespace LearnMS.API.Features.Assets;

public static class AssetsErrors
{
    public static readonly ApiError FileWithoutName = new("file/without-name", "File name is required", StatusCodes.Status400BadRequest);
    public static readonly ApiError NotFound = new("file/not-found", "File not found", StatusCodes.Status404NotFound);
}