using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Parent.Contracts;

public sealed record ParentLoginRequest
{
    [Required]
    public required string StudentCode { get; init; }

    [Required]
    public required string PhoneNumber { get; init; }

    [Required]
    public required string ParentPhoneNumber { get; init; }
}

public sealed record ParentLoginCommand
{
    public required string StudentCode { get; init; }
    public required string PhoneNumber { get; init; }
    public required string ParentPhoneNumber { get; init; }
}

public sealed record ParentStudentSummary
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required string SchoolName { get; init; }
}

public sealed record ParentLoginResult
{
    [Required] public required string Token { get; init; }
    [Required] public required ParentStudentSummary Student { get; init; }
}
