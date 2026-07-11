using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class ExamsErrors
{
    public static readonly ApiError NotFound = new ApiError(
        "exam/not-found",
        "exam not found",
        StatusCodes.Status404NotFound
    );
    public static readonly ApiError AlreadySubmitted = new ApiError(
        "exam/already-submitted",
        "exam already submitted",
        StatusCodes.Status400BadRequest
    );
    public static readonly ApiError NotAccessible = new ApiError(
        "exam/not-accessible",
        "exam not accessible, please purchase it first",
        StatusCodes.Status400BadRequest
    );
    public static readonly ApiError AlreadyPurchased = new ApiError(
        "exam/already-purchased",
        "exam already purchased",
        StatusCodes.Status400BadRequest
    );

    public static readonly ApiError ExamExpired = new ApiError(
        "exam/expired",
        "exam expired",
        StatusCodes.Status400BadRequest
    );
}
