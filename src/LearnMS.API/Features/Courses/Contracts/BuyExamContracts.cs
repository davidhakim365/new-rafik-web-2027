namespace LearnMS.API.Features.Courses.Contracts;

public sealed record BuyExamCommand
{
    public required Guid CourseId { get; init; }
    public required Guid StudentId { get; init; }
    public required Guid ExamId { get; init; }
}