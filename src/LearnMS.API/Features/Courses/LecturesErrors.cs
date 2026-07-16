using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class LecturesErrors
{
    public static readonly ApiError NotFound = new ApiError("lecture/not-found", "Course not found", StatusCodes.Status404NotFound);
    public static readonly ApiError NotPublishable = new ApiError("lecture/not-publishable", "Lecture is not publishable, please complete lecture creation", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyPurchased = new ApiError("lecture/already-purchased", "Lecture already purchased", StatusCodes.Status403Forbidden);
    public static readonly ApiError NotAccessible = new ApiError("lecture/not-accessible", "Lecture is not accessible, please pass all previous exams", StatusCodes.Status403Forbidden);
    public static readonly ApiError InvalidPdfLink = new ApiError("lecture/invalid-pdf-link", "Each PDF requires a title and a valid Google Drive link", StatusCodes.Status400BadRequest);
    public static readonly ApiError HomeworkFullMarkRequired = new ApiError(
        "lecture/homework-full-mark-required",
        "Set the homework full mark before entering scores",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError QuizFullMarkRequired = new ApiError(
        "lecture/quiz-full-mark-required",
        "Set the quiz full mark before entering scores",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidHomeworkScore = new ApiError(
        "lecture/invalid-homework-score",
        "Homework score must be between 0 and the full mark",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidQuizScore = new ApiError(
        "lecture/invalid-quiz-score",
        "Quiz score must be between 0 and the full mark",
        StatusCodes.Status400BadRequest);
}
