using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Courses.Contracts;


// for teacher and anyone who want to purchase a lecture

public sealed record GetLectureQuery
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public bool? IsPublished { get; set; }
    public bool? IsCoursePublished { get; set; }
}

[JsonDerivedType(typeof(GetStudentLectureResult), nameof(GetStudentLectureResult))]
[JsonDerivedType(typeof(GetLectureDashboardResult), nameof(GetLectureDashboardResult))]
public abstract record GetLectureResult
{

    [Required]
    public required Guid Id { get; set; }
    [Required]
    public required Guid CourseId { get; set; }
    [Required]
    public required string Title { get; set; }
    [Required]
    public required List<Asset> Assets { get; set; } = new();
    [Required]
    public List<SingleLectureItem> Items { get; set; } = new();
    [Required]
    public required bool IsImportant { get; init; }
}

public record GetLectureDashboardResult : GetLectureResult
{
    [Required]
    public string? Description { get; set; }
    [Required]
    public string? ImageUrl { get; set; }
    [Required]
    public decimal? Price { get; set; }
    [Required]
    public decimal? RenewalPrice { get; set; }
    [Required]
    public required bool? IsPublished { get; set; }
    [Required]
    public required int? ExpirationDays { get; set; }
}


[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LectureItemType
{
    Quiz, Lesson
}

public record SingleLectureItem
{
    [Required]
    public required Guid Id { get; set; }
    [Required]
    public required string Title { get; set; }
    [Required]
    public required LectureItemType Type { get; set; }
    [Required]
    public required string? Description { get; set; }
    [Required]
    public required int Order { get; set; }
}


// for student

public sealed record GetStudentLectureQuery
{
    public required Guid CourseId { get; set; }
    public required Guid LectureId { get; set; }
    public required Guid StudentId { get; set; }
}


public sealed record GetStudentLectureResult : GetLectureResult
{
    [Required]
    public required string Description { get; set; }
    [Required]
    public required string ImageUrl { get; set; }
    [Required]
    public required decimal Price { get; set; }
    [Required]
    public required decimal RenewalPrice { get; set; }
    [Required]
    public required int ExpirationDays { get; init; }
    public required bool? IsPublished {get; set;}
    public required DateTime? ExpiresAt { get; set; }
    [Required]
    public Enrollment Enrollment
    {
        get
        {
            if (ExpiresAt is null) return Enrollment.NotEnrolled;
            if (DateTime.Now > ExpiresAt) return Enrollment.Expired;
            return Enrollment.Active;
        }
    }
}
