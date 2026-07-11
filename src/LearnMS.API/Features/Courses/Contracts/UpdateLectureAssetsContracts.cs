namespace LearnMS.API.Features.Courses.Contracts;

public sealed record UpdateLectureAssetsCommand
{
    public required Guid LectureId { get; set; }
    public required Guid CourseId { get; set; }
    public required List<string> AssetsIds { get; set; }
}