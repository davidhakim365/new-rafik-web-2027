using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Profile.Contracts;

public sealed record GetProfileQuery
{
    public required Guid Id { get; init; }
}

[JsonDerivedType(typeof(GetStudentProfileResult), nameof(GetStudentProfileResult))]
[JsonDerivedType(typeof(GetTeacherProfileResult), nameof(GetTeacherProfileResult))]
[JsonDerivedType(typeof(GetAssistantProfileResult), nameof(GetAssistantProfileResult))]
public abstract record GetProfileResult
{
    [Required]
    public required Guid Id { get; init; }
    [Required]
    public required UserRole Role { get; init; }
    [Required]
    public required string Email { get; init; }
}

public sealed record GetStudentProfileResult : GetProfileResult
{
    [Required]
    public required string FullName { get; init; }
    [Required]
    public required string PhoneNumber { get; init; }
    [Required]
    public required string ParentPhoneNumber { get; init; }
    [Required]
    public required string StudentCode { get; init; }
    [Required]

    public required string School { get; init; }
    [Required]
    public required StudentLevel Level { get; init; }
    public required string? ProfilePicture { get; init; }
    [Required]
    public required decimal Credits { get; init; }
}

public sealed record GetTeacherProfileResult : GetProfileResult
{
}

public sealed record GetAssistantProfileResult : GetProfileResult
{
    [Required]
    public required List<Permission> Permissions { get; init; }
}

