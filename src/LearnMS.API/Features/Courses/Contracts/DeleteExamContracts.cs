namespace LearnMS.API.Features.Courses.Contracts;

public sealed record DeleteExamCommand
{
    public required Guid Id { get; set; }
    public required Guid CourseId { get; set; }
}