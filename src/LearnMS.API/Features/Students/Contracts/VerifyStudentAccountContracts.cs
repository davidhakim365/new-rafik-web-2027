namespace LearnMS.API.Features.Students.Contracts;

public sealed record VerifyStudentAccountCommand
{
    public required Guid StudentId { get; set; }
}