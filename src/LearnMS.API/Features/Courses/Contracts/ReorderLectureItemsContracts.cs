namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ReorderLectureItemsRequest
{
    public required List<Guid> ItemIds { get; init; }
}

public sealed record ReorderLectureItemsCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required List<Guid> ItemIds { get; init; }
}
