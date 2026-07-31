namespace LearnMS.API.Entities;

public sealed class LectureEnrollment
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// True when enrollment was granted by center attendance (same-day access).
    /// Excluded from online enrollment statistics until paid buy/renew clears it.
    /// </summary>
    public bool IsFromAttendance { get; set; }
}