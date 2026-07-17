using LearnMS.API.Entities;

namespace LearnMS.API.Features.Rewards.Contracts;

public sealed record AttendAssistantSessionCommand
{
    public required Guid AssistantId { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record AttendAssistantByCodeCommand
{
    public required string Code { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record AdjustAssistantApplesCommand
{
    public required Guid AssistantId { get; init; }
    public required int Amount { get; init; }
    public string? Reason { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record PayAssistantRewardsCommand
{
    public Guid? ActorId { get; init; }
    public Guid? AssistantId { get; init; }
}

public sealed record AddStudentApplesCommand
{
    public required Guid StudentId { get; init; }
    public required int Amount { get; init; }
    public string? Reason { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record LookupStudentByCodeQuery
{
    public required string Code { get; init; }
}

public sealed record AddStudentApplesByCodeCommand
{
    public required string Code { get; init; }
    public required int Amount { get; init; }
    public string? Reason { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record GetAssistantRewardsQuery
{
    public required Guid AssistantId { get; init; }
}

public sealed record GetMyRewardsQuery
{
    public required Guid AssistantId { get; init; }
}

public sealed record AttendAssistantSessionRequest;

public sealed record AttendAssistantByCodeRequest
{
    public required string Code { get; init; }
}

public sealed record AdjustAssistantApplesRequest
{
    public required int Amount { get; init; }
    public string? Reason { get; init; }
}

public sealed record PayAssistantRewardsRequest
{
    public Guid? AssistantId { get; init; }
}

public sealed record AddStudentApplesRequest
{
    public required int Amount { get; init; }
    public string? Reason { get; init; }
}

public sealed record LookupStudentByCodeRequest
{
    public required string Code { get; init; }
}

public sealed record AddStudentApplesByCodeRequest
{
    public required string Code { get; init; }
    public required int Amount { get; init; }
    public string? Reason { get; init; }
}

public sealed record AssistantRewardEventDto
{
    public required Guid Id { get; init; }
    public required string Type { get; init; }
    public required int Amount { get; init; }
    public int? SessionsAttendedAfter { get; init; }
    public string? Reason { get; init; }
    public required DateTime CreatedAt { get; init; }
}

public sealed record AssistantRewardsResult
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string Code { get; init; }
    public required int Apples { get; init; }
    public required int SessionsAttended { get; init; }
    public required int CurrentSessionValue { get; init; }
    public required int NextSessionValue { get; init; }
    public required int SessionsUntilNextBonus { get; init; }
    public required int BaseSessionValue { get; init; }
    public required int SessionsPerMilestone { get; init; }
    public required int SessionBonusIncrement { get; init; }
    public required List<AssistantRewardEventDto> Events { get; init; }
}

public sealed record AttendAssistantSessionResult
{
    public required Guid AssistantId { get; init; }
    public required string Email { get; init; }
    public required string Code { get; init; }
    public required int Apples { get; init; }
    public required int ApplesAdded { get; init; }
    public required int SessionsAttended { get; init; }
    public required int CurrentSessionValue { get; init; }
    public required int SessionsUntilNextBonus { get; init; }
    public required string Message { get; init; }
}

public sealed record PayAssistantRewardsResult
{
    public required int AssistantsPaid { get; init; }
    public required int TotalApplesPaid { get; init; }
    public required string Message { get; init; }
}

public sealed record StudentAppleLookupResult
{
    public required Guid StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required int Apples { get; init; }
}

public sealed record AddStudentApplesResult
{
    public required Guid StudentId { get; init; }
    public required string FullName { get; init; }
    public required string StudentCode { get; init; }
    public required int Apples { get; init; }
    public required int AmountAdded { get; init; }
    public required string Message { get; init; }
}
