using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class QuizzesErrors
{
    public static readonly ApiError NotFound = new ApiError("quiz/not-found", "quiz not found", StatusCodes.Status404NotFound);
    public static readonly ApiError NoQuestions = new ApiError("quiz/no-questions", "Add at least one question before saving the quiz", StatusCodes.Status400BadRequest);
    public static readonly ApiError SaveFailed = new ApiError("quiz/save-failed", "Could not save the quiz. Add a complete question and try again.", StatusCodes.Status400BadRequest);
    public static readonly ApiError AlreadySubmitted = new ApiError("quiz/already-submitted", "quiz already submitted", StatusCodes.Status400BadRequest);

    public static readonly ApiError NotAccessible = new ApiError("quiz/not-accessible", "quiz not accessible, please purchase the course or the lecture first", StatusCodes.Status403Forbidden);
}