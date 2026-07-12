namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ValidateLessonVideoStatusQuery
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid LessonId { get; set; }
}

public record ValidateLessonVideoStatusResult
{
    public required string VideoId { get; init; }
    public required string Status { get; init; }
}

public record ValidateLessonVideoStatusResponse : ValidateLessonVideoStatusResult;