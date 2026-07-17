using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Parent.Contracts;

public sealed record ParentProgressResult
{
    [Required] public required ParentStudentSummary Student { get; init; }
    [Required] public required ParentStatistics Statistics { get; init; }
    [Required] public required IReadOnlyList<ParentAttendanceItem> Attendance { get; init; }
    [Required] public required IReadOnlyList<ParentQuizGradeItem> QuizGrades { get; init; }
    [Required] public required IReadOnlyList<ParentExamGradeItem> ExamGrades { get; init; }
    [Required] public required IReadOnlyList<ParentAppleTransactionItem> AppleTransactions { get; init; }
}

public sealed record ParentStatistics
{
    [Required] public required int TotalSessions { get; init; }
    [Required] public required int AttendedSessions { get; init; }
    [Required] public required double AttendanceRate { get; init; }
    [Required] public required int QuizCount { get; init; }
    [Required] public required int ExamCount { get; init; }
    public decimal? AverageQuizScorePercent { get; init; }
    public decimal? AverageExamScorePercent { get; init; }
}

public sealed record ParentAttendanceItem
{
    [Required] public required Guid LectureId { get; init; }
    [Required] public required string LectureTitle { get; init; }
    [Required] public required string CourseTitle { get; init; }
    [Required] public required bool Attended { get; init; }
    public DateTime? AttendedAt { get; init; }
}

public sealed record ParentQuizGradeItem
{
    [Required] public required Guid LectureId { get; init; }
    [Required] public required string LectureTitle { get; init; }
    [Required] public required string CourseTitle { get; init; }
    public decimal? OfflineQuizScore { get; init; }
    public decimal? HomeworkScore { get; init; }
    public decimal? OnlineCorrect { get; init; }
    public decimal? OnlineTotal { get; init; }
}

public sealed record ParentExamGradeItem
{
    [Required] public required Guid ExamId { get; init; }
    [Required] public required string Title { get; init; }
    [Required] public required string CourseTitle { get; init; }
    public decimal? StudentScore { get; init; }
    public decimal? TotalScore { get; init; }
    public DateTime? SubmittedAt { get; init; }
}

public sealed record ParentAppleTransactionItem
{
    [Required] public required Guid Id { get; init; }
    [Required] public required int Amount { get; init; }
    public string? Reason { get; init; }
    [Required] public required DateTime CreatedAt { get; init; }
}
