namespace LearnMS.API.Entities;

public sealed class AssistantTrace
{
    public Guid Id { get; set; }
    public Guid ActorId { get; set; }
    public string ActorRole { get; set; } = string.Empty;
    public string ActorName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Detail { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public Guid? CourseId { get; set; }
    public string? CourseTitle { get; set; }
    public Guid? LectureId { get; set; }
    public string? LectureTitle { get; set; }
    public DateTime CreatedAt { get; set; }
}
