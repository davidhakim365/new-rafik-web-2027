using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record StudentRegistrationSettingsResult
{
    public required bool IsSignupEnabled { get; init; }
    public required DateTime UpdatedAt { get; init; }
}

public sealed record UpdateStudentRegistrationSettingsRequest
{
    [Required]
    public required bool IsSignupEnabled { get; init; }
}
