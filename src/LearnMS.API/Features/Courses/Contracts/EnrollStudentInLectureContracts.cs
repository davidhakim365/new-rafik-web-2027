namespace LearnMS.API.Features.Courses.Contracts;

public sealed record EnrollStudentInLectureCommand
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid StudentId { get; set; }
}