using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record ImportChooseHomeworkScoresRequest
{
    [Required]
    public required Guid SourceLectureId { get; init; }
}

public sealed record ImportChooseHomeworkScoresCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid SourceLectureId { get; init; }
}

public sealed record ImportChooseHomeworkScoresResult
{
    [Required]
    public required int SourceCount { get; init; }

    [Required]
    public required int Imported { get; init; }

    [Required]
    public required int Updated { get; init; }

    [Required]
    public required int Created { get; init; }
}
