using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentExamsQuery
{
    public required Guid StudentId { get; init; }
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

public sealed record SingleStudentExam
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required Guid CourseId { get; init; }
    [Required]
    public required string Title { get; init; }
    public decimal? StudentScore { get; init; }
    public decimal? TotalScore { get; init; }
    public DateTime? SubmittedAt { get; init; }
}