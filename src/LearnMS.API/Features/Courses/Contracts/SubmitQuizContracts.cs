using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;


public sealed record SubmitQuizCommand
{
    public required Guid QuizId;
    public required Guid CourseId;
    public required Guid LectureId;
    public required Guid StudentId;
    public required List<QuestionAnswer> QuestionAnswers;
}

public sealed record SubmitQuizRequest
{
    [Required]
    public required List<QuestionAnswer> QuestionAnswers { get; set; }
}

public sealed record QuestionAnswer
{
    [Required]
    public required Guid QuestionId { get; set; }
    /// <summary>Empty when the student skipped the question or time ran out.</summary>
    public string Answer { get; set; } = "";
}