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

    /// <summary>
    /// Optional Source Choose Homework lecture. When omitted, previous lecture by order is used.
    /// </summary>
    public Guid? CompareChooseHomeworkLectureId { get; init; }
}

public sealed record AttendLectureResult
{
    [Required]
    public required Guid StudentId { get; init; }
    [Required]
    public required string StudentCode { get; init; }
    [Required]
    public required string FullName { get; init; }
    [Required]
    public required string CenterName { get; init; }
    public Guid? CompareChooseHomeworkLectureId { get; init; }
    public string? CompareChooseHomeworkLectureTitle { get; init; }
    public decimal? CompareChooseHomeworkScore { get; init; }
    public bool IsChooseHomeworkDone => CompareChooseHomeworkScore is not null;
}

public sealed record ToggleLectureAttendanceRequest
{
    public Guid? CenterId { get; init; }
}
