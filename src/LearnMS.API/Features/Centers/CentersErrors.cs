using LearnMS.API.Common;

namespace LearnMS.API.Features.Centers;

public static class CentersErrors
{
    public static readonly ApiError NotFound = new(
        "center/not-found",
        "Center not found or inactive.",
        StatusCodes.Status404NotFound
    );

    public static readonly ApiError NameAlreadyExists = new(
        "center/name-already-exists",
        "A center with this name already exists.",
        StatusCodes.Status409Conflict
    );

    public static readonly ApiError Required = new(
        "center/required",
        "A center must be selected for offline attendance.",
        StatusCodes.Status400BadRequest
    );
}
