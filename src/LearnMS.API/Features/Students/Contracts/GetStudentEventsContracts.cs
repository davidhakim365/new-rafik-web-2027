using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentEventsQuery
{
    public required Guid StudentId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? Search { get; init; }
};

public sealed record SingleStudentEvent
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Message { get; init; }
    [Required]
    public required DateTime CreatedAt { get; init; }
}