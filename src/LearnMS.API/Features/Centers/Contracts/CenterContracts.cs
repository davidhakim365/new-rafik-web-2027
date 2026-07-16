using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Centers.Contracts;

public sealed record CenterDto
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Name { get; init; }
    [Required]
    public required bool IsActive { get; init; }
}

public sealed record CreateCenterRequest
{
    [Required]
    [MinLength(2)]
    public required string Name { get; init; }
}

public sealed record AttendLectureRequest
{
    [Required]
    public required Guid CenterId { get; init; }
}

public sealed record ToggleLectureAttendanceRequest
{
    public Guid? CenterId { get; init; }
}
