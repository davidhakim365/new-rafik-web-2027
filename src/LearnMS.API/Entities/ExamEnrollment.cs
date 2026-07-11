using LearnMS.API.Entities;

public sealed class ExamEnrollment
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;

    public ExamSubmission? Submission { get; set; } = null!;

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
}
