namespace LearnMS.API.Features.Questions.Contracts;

public sealed class GetQuestionsQuery
{
    public string? Search { get; init; }
    public int Page { get; init; } = 0;
    public int PageSize { get; init; } = 10;
}