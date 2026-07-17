using System.Text.Json.Serialization;

namespace LearnMS.API.Entities;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AssistantRewardEventType
{
    SessionAttendance,
    ManualAdjust,
    Payout
}

public class AssistantRewardEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required Guid AssistantId { get; init; }
    public Guid? ActorId { get; init; }
    public required AssistantRewardEventType Type { get; init; }
    public required int Amount { get; init; }
    public int? SessionsAttendedAfter { get; init; }
    public string? Reason { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
