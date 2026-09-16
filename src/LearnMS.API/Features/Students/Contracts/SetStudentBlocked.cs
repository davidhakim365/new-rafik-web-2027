using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed class SetStudentBlockedCommand
{
    public required Guid StudentId { get; init; }
    public required bool IsBlocked { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed class SetStudentBlockedRequest
{
    public required bool IsBlocked { get; init; }
}

public sealed class SetStudentBlockedResult
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required bool IsBlocked { get; init; }
}
