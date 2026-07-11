namespace LearnMS.API.Entities;

public sealed class LessonAttendance
{
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;
    public DateTime? ExpirationDate { get; set; }
}