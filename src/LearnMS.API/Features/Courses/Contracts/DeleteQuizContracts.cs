namespace LearnMS.API.Features.Courses.Contracts;

public sealed record DeleteQuizCommand
{
    public required Guid Id;
    public required Guid CourseId;
    public required Guid LectureId;
}