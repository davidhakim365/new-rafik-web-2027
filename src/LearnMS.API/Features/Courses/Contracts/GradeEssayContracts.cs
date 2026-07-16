using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GradeEssayRequest
{
    [Required]
    public required Guid StudentId { get; set; }

    [Required]
    public required Guid QuestionId { get; set; }

    [Required]
    public required bool IsCorrect { get; set; }
}

public sealed record GradeQuizEssayCommand
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid QuizId { get; set; }
    public required Guid StudentId { get; set; }
    public required Guid QuestionId { get; set; }
    public required bool IsCorrect { get; set; }
    public required Guid GradedBy { get; set; }
}

public sealed record GradeExamEssayCommand
{
    public required Guid CourseId { get; set; }
    public required Guid ExamId { get; set; }
    public required Guid StudentId { get; set; }
    public required Guid QuestionId { get; set; }
    public required bool IsCorrect { get; set; }
    public required Guid GradedBy { get; set; }
}
