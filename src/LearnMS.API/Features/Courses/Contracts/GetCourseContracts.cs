using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;

// for teacher or anyone who wants to get a course

public record GetCourseQuery
{
    public required Guid Id { get; init; }
    public bool? IsCourseItemPublished { get; init; }
}

[JsonDerivedType(typeof(GetDashboardCourseResult), nameof(GetDashboardCourseResult))]
[JsonDerivedType(typeof(GetStudentCourseResult), nameof(GetStudentCourseResult))]
public abstract record GetCourseResult
{

    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Title { get; init; }
}


public record GetDashboardCourseResult : GetCourseResult
{
    [Required]
    public required string? Description { get; init; }
    [Required]
    public required string? ImageUrl { get; init; }
    [Required]
    public required StudentLevel? Level { get; init; }
    [Required]
    public required decimal? Price { get; init; }
    [Required]
    public required decimal? RenewalPrice { get; init; }
    [Required]
    public required int? ExpirationDays { get; init; }
    [Required]
    public required bool IsPublished { get; init; }
    [Required]
    public IEnumerable<SingleCourseItem> Items { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CourseItemType
{
    Lecture,
    Exam
};

public record SingleCourseItem
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Title { get; init; }
    [Required]
    public required int Order { get; init; }
    [Required]
    public decimal? Price { get; init; }
    [Required]
    public decimal? RenewalPrice { get; init; }
    [Required]
    public required CourseItemType Type { get; init; }
    [Required]
    public required bool IsImportant { get; init; }
    [Required]
    public string? ImageUrl { get; init; }
}


// for student purchased the course

public sealed record GetStudentCourseQuery : GetCourseQuery
{
    public required Guid StudentId { get; init; }
}

public sealed record GetStudentCourseResult : GetCourseResult
{
    [Required]
    public required string Description { get; init; }
    [Required]
    public required string ImageUrl { get; init; }
    [Required]
    public required decimal Price { get; init; }
    [Required]
    public Enrollment Enrollment
    {
        get
        {
            if (ExpiresAt is null) return Enrollment.NotEnrolled;
            if (ExpiresAt < DateTime.UtcNow) return Enrollment.Expired;
            return Enrollment.Active;
        }
    }
    [Required]
    public required decimal RenewalPrice { get; init; }
    [Required]
    public required StudentLevel Level { get; init; }
    [Required]
    public required DateTime? ExpiresAt { get; init; }
    [Required]
    public required int ExpirationDays { get; init; }
    [Required]
    public IEnumerable<SingleStudentCourseItem> Items { get; set; } = [];
}



public sealed record SingleStudentCourseItem
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Title { get; init; }
    [Required]
    public required string? Description { get; init; }
    [Required]
    public required int Order { get; init; }
    [Required]
    public required CourseItemType Type { get; init; }
    [Required]
    public required bool IsImportant { get; init; }
    [Required]
    public string? ImageUrl { get; init; }
    [Required]
    public string Enrollment
    {
        get
        {
            if (ExpiresAt is null) return "NotEnrolled";
            if (ExpiresAt < DateTime.UtcNow) return "Expired";
            return "Active";
        }
    }
    [Required]
    public DateTime? ExpiresAt { get; init; }
}