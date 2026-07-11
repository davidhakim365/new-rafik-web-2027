using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class LessonsErrors
{
    public static readonly ApiError NotFound = new ApiError("lesson/not-found", "Lesson not found", StatusCodes.Status404NotFound);
    public static readonly ApiError NotAccessible = new ApiError("lesson/not-accessible", "Lesson not accessible, please purchase the lecture or the course first", StatusCodes.Status403Forbidden);
    public static readonly ApiError Blocked = new ApiError("lesson/blocked", "Lesson blocked, please pass all the previous quizzes", StatusCodes.Status403Forbidden);
    public static readonly ApiError NotStarted = new ApiError("lesson/not-attended", "Lesson not attended, please attend the lesson first", StatusCodes.Status400BadRequest);
    public static readonly ApiError Expired = new ApiError("lesson/expired", "Lesson expired", StatusCodes.Status403Forbidden);
    public static readonly ApiError NotAcceptedExpirationRule = new ApiError("lesson/not-accepted-expiration-rule", "Lesson expiration rule not accepted", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyAcceptedExpirationRule = new ApiError("lesson/already-accepted-expiration-rule", "Lesson expiration rule already accepted", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyRenewed = new ApiError("lesson/already-renewed", "Lesson already renewed", StatusCodes.Status403Forbidden);
}