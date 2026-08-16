namespace LearnMS.API.Features.Students.Contracts;

public sealed class UnlinkStudentDeviceCommand
{
    public required Guid StudentId { get; set; }
}

public sealed class UnlinkAllStudentDevicesCommand
{
}

public sealed class UnlinkAllStudentDevicesResult
{
    public int UnlinkedCount { get; set; }
}