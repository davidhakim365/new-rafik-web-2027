using LearnMS.API.Entities;

namespace LearnMS.API.Features.Students.Contracts;

public sealed record ExportStudentsQuery
{
    public StudentLevel? Level;
}

public sealed record ExportStudentsResult
{
    public required Guid Id { get; set; }
    public required string Code { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required decimal Credits { get; set; }
    public required string PhoneNumber { get; set; }
    public required string ParentPhoneNumber { get; set; }
    public required string SchoolName { get; set; }
    public required StudentLevel Level { get; set; }
}