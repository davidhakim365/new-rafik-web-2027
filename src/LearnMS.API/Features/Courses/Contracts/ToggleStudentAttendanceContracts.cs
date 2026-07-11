namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ToggleStudentAttendance
{
    public required Guid StudentId;
    public required Guid LectureId;
    public bool Attend { get; set; }
}