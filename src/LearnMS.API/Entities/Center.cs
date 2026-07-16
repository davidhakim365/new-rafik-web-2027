namespace LearnMS.API.Entities;

public sealed class Center
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<LectureAttendance> LectureAttendances { get; } = [];
}
