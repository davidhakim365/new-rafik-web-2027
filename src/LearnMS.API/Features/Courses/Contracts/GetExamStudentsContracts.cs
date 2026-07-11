using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GetExamStudentsQuery
{
    public required Guid ExamId { get; init; }
    public required Guid CourseId { get; init; }
    public int Page = 1;
    public int PageSize = 10;
    public string? Search;
}

public sealed record SingleExamStudent
{
    [Required] public required Guid Id { get; set; }
    [Required] public required string StudentCode { get; set; }
    [Required] public required string FullName { get; set; }
    [Required] public required string Email { get; set; }
    [Required] public decimal? StudentExamScore { get; set; }
    [Required] public decimal? TotalExamScore { get; set; }
    [Required] public required ExamState State { get; set; }
}

public enum ExamState
{
    WaitingSubmission,
    NotEnrolled,
    Passed,
    Failed
}