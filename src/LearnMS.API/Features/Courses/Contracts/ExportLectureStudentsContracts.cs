using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ExportLectureStudentsQuery
{
    public required Guid LectureId { get; init; }
    public required Guid CourseId { get; init; }
}

public sealed record ExportSingleLectureStudentResult
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string Email { get; init; }
    [Required] public decimal? HomeworkScore { get; init; }
    [Required] public decimal? QuizScore { get; init; }
    [Required] public decimal? StudentQuizzesScore { get; init; }
    [Required] public string? CourseTitle { get; init; } 
    [Required] public decimal? TotalQuizzesScore { get; init; }
    [Required] public required bool Attended { get; init; }
    [Required] public required Enrollment Enrollment { get; init; }
}