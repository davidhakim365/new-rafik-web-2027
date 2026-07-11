namespace LearnMS.API.Entities;

public sealed class LectureEnrollment
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
}