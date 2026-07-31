namespace LearnMS.API.Entities;

public sealed class LectureStudentCallLog
{
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; } = null!;
    public string? Comment { get; set; }
    public bool Called { get; set; }
    public DateTime? CalledAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
