using LearnMS.API.Common;

public static class QuestionsErrors
{
    public static readonly ApiError NotFound = new("question/not-found", "Question not found", StatusCodes.Status404NotFound);
    public static readonly ApiError InvalidQuestion = new("question/invalid", "Question not found", StatusCodes.Status400BadRequest);
}