using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class CoursesErrors
{
    public static readonly ApiError NotFound = new ApiError("course/not-found", "Course not found", StatusCodes.Status404NotFound);
    public static readonly ApiError NotPublishable = new ApiError("course/not-publishable", "Course not publishable, please complete the course creation", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyPurchased = new ApiError(
        "course/already-purchased",
        "Course already purchased",
        StatusCodes.Status403Forbidden
    );
    public static readonly ApiError WrongLevel = new ApiError(
        "course/wrong-level",
        "This course is not available for your grade",
        StatusCodes.Status403Forbidden
    );
}