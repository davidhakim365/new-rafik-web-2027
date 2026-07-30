using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record SyncChooseHomeworkScoresCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
}

public sealed record SyncChooseHomeworkScoresResult
{
    [Required]
    public required int Matched { get; init; }

    [Required]
    public required int Updated { get; init; }

    [Required]
    public required int SkippedNoScore { get; init; }

    [Required]
    public required List<string> UnmatchedCodes { get; init; }
}
