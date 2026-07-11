using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentLecturesQuery
{
    public required Guid StudentId;
    public int Page = 1;
    public int PageSize = 10;
    public string? Search;
}

public sealed record SingleStudentLecture
{
    [Required]
    public required Guid CourseId { get; init; }
    [Required]
    public string? CourseTitle { get; set; }
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Title { get; init; }
    [Required]
    public required bool Attended { get; init; }
    public decimal? StudentQuizzesScore { get; init; }
    public decimal? TotalQuizzesScore { get; init; }
    public decimal? HomeworkScore { get; init; }
    public decimal? QuizScore { get; init; }
    public  string? EnrollmentStatus { get; init; } // New field for Enrollment status
}
