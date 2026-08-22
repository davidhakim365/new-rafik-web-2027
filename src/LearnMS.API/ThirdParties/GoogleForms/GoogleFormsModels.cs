namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed record GoogleFormInfo(
    string FormId,
    string? Title,
    string? ResponderUri,
    string? StudentIdQuestionId,
    IReadOnlyList<GoogleFormQuestion> Questions,
    /// <summary>Sum of quiz question point values from the form grading settings.</summary>
    decimal? TotalPointValue
);

public sealed record GoogleFormQuestion(string QuestionId, string Title);

public sealed record GoogleFormResponseScore(
    string StudentCode,
    decimal TotalScore,
    DateTimeOffset LastSubmittedTime
);

public sealed record GoogleDriveUploadResult(string FileId, string ViewerUrl);
