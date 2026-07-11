
using System.Text.Json;

namespace LearnMS.API.Features.Questions.Contracts;
using LearnMS.API.Entities;

public sealed record AddQuestionRequest
{
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required IFormFile? Image { get; set; }

    public required decimal? ValueCorrect { get; set; }
    public required decimal? ValueTolerance { get; set; }
    public required StudentLevel level {get; set;}
    public required string? MultipleCorrect { get; set; }
    public required List<string>? MultipleChoices { get; set; }
}



public sealed record AddQuestionCommand
{
    public required string Text { get; set; }
    public required string Description { get; set; }
    public required IFormFile? Image { get; set; }
    public required decimal? ValueCorrect { get; set; }
    public required decimal? ValueTolerance { get; set; }
    public required StudentLevel level {get; set;}
    public required string? MultipleCorrect { get; set; }
    public required List<string>? MultipleChoices { get; set; }
}