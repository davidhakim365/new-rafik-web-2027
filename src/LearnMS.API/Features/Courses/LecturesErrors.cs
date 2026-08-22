using LearnMS.API.Common;

namespace LearnMS.API.Features.Courses;

public static class LecturesErrors
{
    public static readonly ApiError NotFound = new ApiError("lecture/not-found", "Course not found", StatusCodes.Status404NotFound);
    public static readonly ApiError NotPublishable = new ApiError("lecture/not-publishable", "Lecture is not publishable, please complete lecture creation", StatusCodes.Status403Forbidden);
    public static readonly ApiError AlreadyPurchased = new ApiError("lecture/already-purchased", "Lecture already purchased", StatusCodes.Status403Forbidden);
    public static readonly ApiError NotAccessible = new ApiError("lecture/not-accessible", "Lecture is not accessible, please pass all previous exams", StatusCodes.Status403Forbidden);
    public static readonly ApiError InvalidPdfLink = new ApiError("lecture/invalid-pdf-link", "Each PDF requires a title and a valid link", StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidPdfFile = new ApiError("lecture/invalid-pdf-file", "Upload a PDF file (max 50MB)", StatusCodes.Status400BadRequest);
    public static readonly ApiError GoogleDriveUploadFailed = new ApiError(
        "lecture/google-drive-upload-failed",
        "Could not upload the PDF to Google Drive. Enable the Drive API and share a folder with the service account if needed.",
        StatusCodes.Status502BadGateway);
    public static readonly ApiError HomeworkFullMarkRequired = new ApiError(
        "lecture/homework-full-mark-required",
        "Set the essay homework full mark before entering scores",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError QuizFullMarkRequired = new ApiError(
        "lecture/quiz-full-mark-required",
        "Set the quiz full mark before entering scores",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidHomeworkScore = new ApiError(
        "lecture/invalid-homework-score",
        "Essay homework score must be between 0 and the full mark",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidQuizScore = new ApiError(
        "lecture/invalid-quiz-score",
        "Quiz score must be between 0 and the full mark",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError ChooseHomeworkFormRequired = new ApiError(
        "lecture/choose-homework-form-required",
        "Set a Choose Homework Google Form before syncing scores",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError InvalidChooseHomeworkFormId = new ApiError(
        "lecture/invalid-choose-homework-form-id",
        "Paste the Google Form edit URL (docs.google.com/forms/d/{id}/edit) or the form ID — not the public /d/e/ view link",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError ChooseHomeworkStudentIdQuestionMissing = new ApiError(
        "lecture/choose-homework-student-id-question-missing",
        "The Google Form must include a required question titled exactly \"Student ID\"",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError ChooseHomeworkImportSameLecture = new ApiError(
        "lecture/choose-homework-import-same-lecture",
        "Select a different lecture to import Choose Homework scores from",
        StatusCodes.Status400BadRequest);
    public static readonly ApiError ChooseHomeworkImportSourceNotFound = new ApiError(
        "lecture/choose-homework-import-source-not-found",
        "Source lecture was not found in this course",
        StatusCodes.Status404NotFound);
}
