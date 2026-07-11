
namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GetExamQuery
{
    public required Guid Id;
    public required Guid CourseId;
    public Guid? StudentId;
}