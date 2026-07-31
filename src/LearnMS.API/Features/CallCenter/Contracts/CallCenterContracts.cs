using System.ComponentModel.DataAnnotations;
using CsvHelper.Configuration.Attributes;

namespace LearnMS.API.Features.CallCenter.Contracts;

public sealed record GetCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public string? Attendance { get; init; }
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

public sealed record CallCenterStudentDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string StudentCode { get; init; }
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
}

public sealed record ExportCallCenterStudentsQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public string? Search { get; init; }
    public string? Attendance { get; init; }
}

public sealed record ExportCallCenterStudentRow
{
    [Name("Student Code")]
    public required string StudentCode { get; init; }

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
}
