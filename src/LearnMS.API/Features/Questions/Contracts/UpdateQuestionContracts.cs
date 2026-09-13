using LearnMS.API.Entities;

namespace LearnMS.API.Features.Questions.Contracts;

public sealed record UpdateQuestionRequest
{
    public required string Text { get; set; }
    public required string Description { get; set; }
    /// <summary>ImgBB URL for the question image. Empty or null removes it.</summary>
    public string? Image { get; set; }

    public string? SourceTitle { get; set; }
    public int? SourceIndex { get; set; }

    /// <summary>MultipleChoice | ValueTolerance | Essay</summary>
    public required string QuestionType { get; set; }

    public decimal? ValueCorrect { get; set; }
    public decimal? ValueTolerance { get; set; }
    public string? MultipleCorrect { get; set; }
    public List<QuestionChoice>? MultipleChoices { get; set; }
    public int? EssayMaxLength { get; set; }
}

public sealed record UpdateQuestionCommand
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    public required string Description { get; set; }
    public string? Image { get; set; }
    public string? SourceTitle { get; set; }
    public int? SourceIndex { get; set; }
    public required string QuestionType { get; set; }
    public decimal? ValueCorrect { get; set; }
    public decimal? ValueTolerance { get; set; }
    public string? MultipleCorrect { get; set; }
    public List<QuestionChoice>? MultipleChoices { get; set; }
    public int? EssayMaxLength { get; set; }
}
