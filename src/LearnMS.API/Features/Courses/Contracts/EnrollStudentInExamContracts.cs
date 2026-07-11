namespace LearnMS.API.Features.Courses.Contracts;

public sealed record EnrollStudentInExamCommand
{
    public required Guid CourseId { get; set; }
    public required Guid ExamId { get; set; }
    public required Guid StudentId { get; set; }
}