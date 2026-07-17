namespace LearnMS.API.Entities;

public class StudentAppleTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid StudentId { get; init; }
    public Guid? ActorId { get; init; }
    public required int Amount { get; init; }
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
