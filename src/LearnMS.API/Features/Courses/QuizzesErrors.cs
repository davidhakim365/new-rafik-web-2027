using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class QuizzesErrors
{
    public static readonly ApiError NotFound = new ApiError("quiz/not-found", "quiz not found", StatusCodes.Status404NotFound);
    public static readonly ApiError AlreadySubmitted = new ApiError("quiz/already-submitted", "quiz already submitted", StatusCodes.Status400BadRequest);

    public static readonly ApiError NotAccessible = new ApiError("quiz/not-accessible", "quiz not accessible, please purchase the course or the lecture first", StatusCodes.Status403Forbidden);
}