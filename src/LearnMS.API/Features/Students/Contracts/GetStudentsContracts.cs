using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record GetStudentsQuery
{
    public string? Search { get; init; }
    public int? Page { get; init; } = 0;
    public int? PageSize { get; init; } = 10;
    public StudentLevel? Level;
}

public sealed record SingleStudent
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string Email { get; init; }
    public required string? ProfilePicture { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string PhoneNumber { get; init; }
    [Required] public required string ParentPhoneNumber { get; init; }
    [Required] public required string StudentCode { get; init; }

    [Required] public required string SchoolName { get; init; }
    [Required] public required decimal Credit { get; init; }
    [Required] public required StudentLevel Level { get; init; }
    [Required] public required bool DeviceLinked { get; init; }
}