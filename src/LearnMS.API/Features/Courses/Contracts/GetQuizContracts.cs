namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GetQuizQuery
{
    public required Guid Id;
    public required Guid LectureId;
    public required Guid CourseId;
}

public sealed record GetStudentQuizQuery
{
    public required Guid QuizId;
    public required Guid LectureId;
    public required Guid CourseId;
    public required Guid StudentId;
}
