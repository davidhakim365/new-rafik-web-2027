namespace LearnMS.API.Entities;

public sealed class CourseEnrollment
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid CourseId { get; set; }
    public Course Course { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
}