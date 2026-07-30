namespace LearnMS.API.ThirdParties.GoogleForms;

public sealed record GoogleFormInfo(
    string FormId,
    string? Title,
    string? ResponderUri,
    string? StudentIdQuestionId,
    IReadOnlyList<GoogleFormQuestion> Questions
);

public sealed record GoogleFormQuestion(string QuestionId, string Title);

public sealed record GoogleFormResponseScore(
    string StudentCode,
    decimal TotalScore,
    DateTimeOffset LastSubmittedTime
);
