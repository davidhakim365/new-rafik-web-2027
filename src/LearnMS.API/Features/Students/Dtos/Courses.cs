using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Dtos;

public sealed record StudentCourseDto(
    [Required] Guid Id,
    [Required] string Title,
    string? Description,
    [Required] string ImageUrl,
    [Required] decimal Price,
    [Required] decimal RenewalPrice,
    [Required] StudentLevel Level,
    [Required] int LecturesCount,
    [Required] int ExamsCount,
    int? ExpirationDays,
    DateTime? ExpiresAt
)
{
    [Required]
    public Enrollment Enrollment =>
        ExpiresAt == null ? Enrollment.NotEnrolled :
        ExpiresAt >= DateTime.UtcNow ? Enrollment.Active : Enrollment.Expired;
}

public sealed record StudentCourseDetailsDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
    public string? Description { get; init; }
    [Required] public required string ImageUrl { get; init; }
    [Required] public required decimal Price { get; init; }
    [Required] public required decimal RenewalPrice { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required List<StudentCourseItemDto> Items { get; init; }

    public int? ExpirationDays { get; init; }
    public required DateTime? ExpiresAt { get; init; }

    [Required]
    public Enrollment Enrollment =>
        ExpiresAt == null ? Enrollment.NotEnrolled :
        ExpiresAt >= DateTime.UtcNow ? Enrollment.Active : Enrollment.Expired;
}

[JsonDerivedType(typeof(StudentLectureDto), nameof(StudentLectureDto))]
[JsonDerivedType(typeof(StudentExamDto), nameof(StudentExamDto))]
public abstract record StudentCourseItemDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
    public string? Description { get; init; }
    [Required] public required int Order { get; init; }
};

public sealed record StudentLectureDto : StudentCourseItemDto
{
    [Required] public required List<StudentLectureItemDto> Items { get; init; }
    [Required] public required List<StudentAssetDto> Assets { get; init; }
    [Required] public required decimal Price { get; init; }
    [Required] public required decimal RenewalPrice { get; init; }

    public int? ExpirationDays { get; init; }
    public required DateTime? ExpiresAt { get; init; }

    [Required]
    public Enrollment Enrollment =>
        ExpiresAt == null ? Enrollment.NotEnrolled :
        ExpiresAt >= DateTime.UtcNow ? Enrollment.Active : Enrollment.Expired;
}

public sealed record StudentAssetDto
{
    [Required] public required string Id { get; init; }
    [Required] public required string Name { get; init; }
    [Required] public required AssetType Type { get; init; }
}

[JsonDerivedType(typeof(StudentQuizDto), nameof(StudentQuizDto))]
[JsonDerivedType(typeof(StudentLessonDto), nameof(StudentLessonDto))]
public abstract record StudentLectureItemDto
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Title { get; init; }
    public string? Description { get; init; }
    [Required] public required int Order { get; init; }
}

public sealed record StudentLessonDto : StudentLectureItemDto
{
    [Required] public required decimal RenewalPrice { get; init; }
}

public sealed record StudentQuizDto : StudentLectureItemDto
{
    [Required] public required int QuestionsCount { get; init; }
}

public sealed record StudentExamDto : StudentCourseItemDto
{
    [Required] public required int QuestionsCount { get; init; }
    [Required] public required decimal Price { get; init; }
    [Required] public required decimal RetakePrice { get; init; }
    [Required] public required int ExpiryHours { get; init; }
}