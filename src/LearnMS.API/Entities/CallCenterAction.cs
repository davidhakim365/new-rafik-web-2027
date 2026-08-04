namespace LearnMS.API.Entities;

public enum CallCenterActionType
{
    Call,
    Notify
}

public sealed class CallCenterAction
{
    public Guid Id { get; set; }
    public Guid LectureId { get; set; }
    public Lecture Lecture { get; } = null!;
    public Guid StudentId { get; set; }
    public Student Student { get; } = null!;
    public Guid ActorId { get; set; }
    public CallCenterActionType ActionType { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
