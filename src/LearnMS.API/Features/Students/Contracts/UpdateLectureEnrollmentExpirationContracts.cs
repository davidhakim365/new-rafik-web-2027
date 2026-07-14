using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record UpdateLectureEnrollmentExpirationCommand
{
    public required Guid StudentId;
    public required Guid LectureId;
    public required DateTime ExpiresAt;
}

public sealed record UpdateLectureEnrollmentExpirationRequest
{
    [Required]
    public required DateTime ExpiresAt { get; init; }
}
