using System.ComponentModel.DataAnnotations;
using CsvHelper.Configuration.Attributes;

namespace LearnMS.API.Features.CallCenter.Contracts;

public sealed record GetCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public string? Attendance { get; init; }
    /// <summary>all | called | not-called</summary>
    public string? Called { get; init; }
    /// <summary>all | online | offline — online IDs start with ONL-</summary>
    public string? StudyMode { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}

public sealed record UpsertCallCenterStudentCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
    public string? Comment { get; init; }
    public bool? Called { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record UpsertCallCenterStudentRequest
{
    public string? Comment { get; init; }
    public bool? Called { get; init; }
}

public sealed record RecordCallCenterNotifyCommand
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
    public string? Comment { get; init; }
    public required Guid ActorId { get; init; }
}

public sealed record RecordCallCenterNotifyRequest
{
    public string? Comment { get; init; }
}

public sealed record GetCallCenterHistoryQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
}

public sealed record GetCallCenterStudentLecturesQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
}

public sealed record CallCenterStudentLectureDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required Guid CourseId { get; init; }
    [Required] public required string CourseTitle { get; init; }
    [Required] public required string Title { get; init; }
    [Required] public required int Order { get; init; }
    [Required] public required bool IsCurrent { get; init; }
    [Required] public required bool Attended { get; init; }
    public decimal? HomeworkScore { get; init; }
    public decimal? HomeworkFullMark { get; init; }
    public decimal? ChooseHomeworkScore { get; init; }
    public decimal? ChooseHomeworkFullMark { get; init; }
    public decimal? QuizScore { get; init; }
    public decimal? QuizFullMark { get; init; }
    public decimal? StudentQuizzesScore { get; init; }
    public decimal? TotalQuizzesScore { get; init; }
    public string? EnrollmentStatus { get; init; }
    [Required] public required bool Called { get; init; }
    public string? Comment { get; init; }
}

public sealed record CallCenterStudentLecturesResult
{
    [Required] public required IReadOnlyList<CallCenterStudentLectureDto> Items { get; init; }
    [Required] public required int PresentCount { get; init; }
    [Required] public required int AbsentCount { get; init; }
    [Required] public required int TotalCount { get; init; }
}

public sealed record CallCenterHistoryItemDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string ActionType { get; init; }
    public string? Comment { get; init; }
    [Required] public required Guid ActorId { get; init; }
    [Required] public required string ActorName { get; init; }
    [Required] public required DateTime CreatedAt { get; init; }
}

public sealed record CallCenterStudentDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string StudentCode { get; init; }
    /// <summary>online | offline</summary>
    [Required] public required string StudyMode { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string PhoneNumber { get; init; }
    [Required] public required string ParentPhoneNumber { get; init; }
    [Required] public required bool Attended { get; init; }
    public decimal? HomeworkScore { get; init; }
    public decimal? ChooseHomeworkScore { get; init; }
    public decimal? QuizScore { get; init; }
    public string? Comment { get; init; }
    [Required] public required bool Called { get; init; }
    public DateTime? CalledAt { get; init; }
    [Required] public required bool IsBlocked { get; init; }
}

public sealed record ExportCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public string? Attendance { get; init; }
    /// <summary>all | called | not-called</summary>
    public string? Called { get; init; }
    /// <summary>all | online | offline</summary>
    public string? StudyMode { get; init; }
}

public sealed record SetCallCenterStudentBlockedCommand
{
    public required Guid StudentId { get; init; }
    public required bool IsBlocked { get; init; }
    public Guid? ActorId { get; init; }
}

public sealed record SetCallCenterStudentBlockedRequest
{
    public required bool IsBlocked { get; init; }
}

public sealed record SetCallCenterStudentBlockedResult
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required bool IsBlocked { get; init; }
}

public sealed record ExportCallCenterStudentRow
{
    [Name("Student Code")]
    public required string StudentCode { get; init; }

    [Name("Study Mode")]
    public required string StudyMode { get; init; }

    [Name("Full Name")]
    public required string FullName { get; init; }

    [Name("Parent Phone")]
    public required string ParentPhoneNumber { get; init; }

    [Name("Student Phone")]
    public required string PhoneNumber { get; init; }

    [Name("Attendance")]
    public required string Attendance { get; init; }

    [Name("Essay Homework")]
    public string? HomeworkScore { get; init; }

    [Name("Choose Homework")]
    public string? ChooseHomeworkScore { get; init; }

    [Name("Quiz")]
    public string? QuizScore { get; init; }

    [Name("Comment")]
    public string? Comment { get; init; }

    [Name("Called")]
    public required string Called { get; init; }

    [Name("Called At")]
    public string? CalledAt { get; init; }

    [Name("Blocked")]
    public required string IsBlocked { get; init; }
}
