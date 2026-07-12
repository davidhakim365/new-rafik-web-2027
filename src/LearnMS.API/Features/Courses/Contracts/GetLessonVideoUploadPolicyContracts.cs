namespace LearnMS.API.Features.Courses.Contracts;

public sealed record GetLessonVideoUploadPolicyQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid LessonId { get; init; }
}

public record GetLessonVideoUploadPolicyResult
{
    public required string VideoId { get; init; }
    public required string Policy { get; init; }
    public required string Key { get; init; }
    public required string XAmzSignature { get; init; }
    public required string XAmzAlgorithm { get; init; }
    public required string XAmzDate { get; init; }
    public required string XAmzCredential { get; init; }
    public required string UploadLink { get; init; }
}

public record GetLessonVideoUploadPolicyResponse : GetLessonVideoUploadPolicyResult;
