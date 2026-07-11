using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;


public sealed record SubmitExamCommand
{
    public required Guid ExamId;
    public required Guid CourseId;
    public required Guid StudentId;
    public required List<QuestionAnswer> QuestionAnswers;
}

public sealed record SubmitExamRequest
{
    [Required]
    public required List<QuestionAnswer> QuestionAnswers { get; set; }
}

