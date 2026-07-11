public sealed record ChangeLectureHomeworkScoreCommand
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid StudentId { get; set; }
    public required decimal Score { get; set; }
}

public sealed record ChangeLectureHomeworkScoreRequest
{
    public required decimal Score { get; set; }
}

