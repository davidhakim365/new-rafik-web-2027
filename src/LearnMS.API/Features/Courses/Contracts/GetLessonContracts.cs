using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;
using LearnMS.API.ThirdParties;
using LearnMS.API.ThirdParties.VdoCipher;

namespace LearnMS.API.Features.Courses.Contracts;


public record GetLessonQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid LessonId { get; init; }
}


[JsonDerivedType(typeof(GetStudentLessonResult), nameof(GetStudentCoursesResult))]
[JsonDerivedType(typeof(GetDashboardLessonResult), nameof(GetDashboardLessonResult))]
public abstract record GetLessonResult
{

    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required string Title { get; init; }
    [Required]
    public required int ExpirationHours { get; init; }
    [Required]
    public required decimal RenewalPrice { get; init; }
    [Required]
    public required string Description { get; init; }
}

public record GetDashboardLessonResult : GetLessonResult
{
    public VideoOTP? VideoOTP { get; init; }
    public required string? VideoId { get; init; }
}

// for student

public record GetStudentLessonQuery
{
    public required Guid CourseId { get; init; }
    public required Guid LectureId { get; init; }
    public required Guid StudentId { get; init; }
    public required Guid LessonId { get; init; }
}



public record GetStudentLessonResult : GetLessonResult
{
    public DateTime? ExpiresAt { get; init; }
    [Required]
    public string Enrollment
    {
        get
        {
            // Unlimited lessons skip the start-session gate.
            if (ExpirationHours == 0) return "Active";
            if (ExpiresAt is null) return "NotEnrolled";
            if (ExpiresAt < DateTime.UtcNow) return "Expired";
            return "Active";
        }
    }
    public required VideoOTP? VideoOTP { get; init; }
}