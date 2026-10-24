using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Students.Contracts;

public sealed class SetStudentMultipleDevicesCommand
{
    public required Guid StudentId { get; init; }
    public required bool AllowMultipleDevices { get; init; }
}

public sealed class SetStudentMultipleDevicesRequest
{
    public required bool AllowMultipleDevices { get; init; }
}

public sealed class SetStudentMultipleDevicesResult
{
    [Required] public required Guid Id { get; init; }
    [Required] public required string FullName { get; init; }
    [Required] public required string StudentCode { get; init; }
    [Required] public required bool AllowMultipleDevices { get; init; }
}
