namespace LearnMS.API.Features.Students.Contracts;

public sealed class UnlinkStudentDeviceCommand
{
    public required Guid StudentId { get; set; }
}