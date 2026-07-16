using LearnMS.API.Entities;

namespace LearnMS.API.Features.Questions.Contracts;

public sealed record AddQuestionRequest
{
    public required string Text { get; set; }
    public required string Description { get; set; }
    /// <summary>ImgBB URL for the question image.</summary>
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

public sealed record AddQuestionCommand
{
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

/// <summary>Payload used when creating questions inline on quiz/exam save.</summary>
public sealed record InlineQuestionPayload
{
    public string? Text { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    /// <summary>MultipleChoice | ValueTolerance | Essay</summary>
    public required string QuestionType { get; set; }
    public string? MultipleCorrect { get; set; }
    public List<QuestionChoice>? MultipleChoices { get; set; }
    public decimal? ValueCorrect { get; set; }
    public decimal? ValueTolerance { get; set; }
    public int? EssayMaxLength { get; set; }
}
