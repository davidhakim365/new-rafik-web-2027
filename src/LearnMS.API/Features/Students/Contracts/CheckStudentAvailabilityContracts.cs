namespace LearnMS.API.Features.Students.Contracts;

public sealed record CheckStudentAvailabilityQuery
{
    public string? StudentCode { get; init; }
    public string? PhoneNumber { get; init; }
    public string? Email { get; init; }
}

public sealed record CheckStudentAvailabilityResult
{
    public required bool StudentCodeTaken { get; init; }
    public required bool PhoneNumberTaken { get; init; }
    public required bool EmailTaken { get; init; }
}
