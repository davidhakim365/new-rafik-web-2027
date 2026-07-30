using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Courses.Contracts;

public sealed record UpdateLectureCommand
{
    public required Guid Id { get; init; }
    public required Guid CourseId { get; init; }
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? ImageUrl { get; init; }
    public string? HomeworkVideoUrl { get; init; }
    /// <summary>Google Form edit URL or form ID for Choose Homework sync.</summary>
    public string? ChooseHomeworkFormId { get; init; }
    public decimal? Price { get; init; }
    public decimal? RenewalPrice { get; init; }
    public int? ExpirationDays { get; init; }
    public decimal? HomeworkFullMark { get; init; }
    public decimal? ChooseHomeworkFullMark { get; init; }
    public decimal? QuizFullMark { get; init; }
}

public sealed record UpdateLectureRequest
{
    [Length(0, 100)]
    public string? Title { get; init; }

    [Length(0, 1000)]
    public string? Description { get; init; }

    [Range(0, 100)]
    public decimal? Price { get; init; }
    public string? ImageUrl { get; init; }

    [Length(0, 2000)]
    public string? HomeworkVideoUrl { get; init; }

    /// <summary>Google Form edit URL or form ID.</summary>
    [Length(0, 2000)]
    public string? ChooseHomeworkFormId { get; init; }

    [Range(0, 100)]
    public decimal? RenewalPrice { get; init; }

    [Range(0, 1000)]
    public int? ExpirationDays { get; init; }

    [Range(0.01, 10000)]
    public decimal? HomeworkFullMark { get; init; }

    [Range(0.01, 10000)]
    public decimal? ChooseHomeworkFullMark { get; init; }

    [Range(0.01, 10000)]
    public decimal? QuizFullMark { get; init; }
}
