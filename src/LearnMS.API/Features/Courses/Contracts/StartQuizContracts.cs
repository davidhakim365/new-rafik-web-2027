namespace LearnMS.API.Features.Courses.Contracts;

public sealed record StartQuizCommand
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid QuizId { get; set; }
    public required Guid StudentId { get; set; }
}

public sealed record StartQuizResult
{
    public required DateTime? ExpiresAt { get; set; }
    public required int ExpiryMinutes { get; set; }
}
