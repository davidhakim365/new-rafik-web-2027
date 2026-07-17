using System.ComponentModel.DataAnnotations;
using LearnMS.API.Entities;

namespace LearnMS.API.Features.Assistants.Contracts;



public class UpdateAssistantCommand
{
    public required Guid Id { get; init; }
    public string? FullName { get; init; }
    public string? Password { get; init; }
    public string? Code { get; init; }
    public string? ProfilePicture { get; init; }
    public bool ClearProfilePicture { get; init; }
    public List<Permission>? Permissions { get; init; }
}

public class UpdateAssistantRequest
{
    [MinLength(2)]
    public string? FullName { get; init; }

    [MinLength(8)]
    public string? Password { get; init; }

    public string? Code { get; init; }

    public string? ProfilePicture { get; init; }

    /// <summary>When true, clears the assistant profile picture.</summary>
    public bool ClearProfilePicture { get; init; }

    public List<Permission>? Permissions { get; init; }
}
