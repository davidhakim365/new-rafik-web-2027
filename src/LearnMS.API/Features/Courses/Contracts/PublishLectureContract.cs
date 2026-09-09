namespace LearnMS.API.Features.Courses.Contracts;


public sealed record PublishLectureCommand
{
    public required Guid Id { get; init; }
    public required Guid CourseId { get; init; }
}

public sealed record PublishLectureAttachmentsCommand
{
    public required Guid Id { get; init; }
    public required Guid CourseId { get; init; }
}


