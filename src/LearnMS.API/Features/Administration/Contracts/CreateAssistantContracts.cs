using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Administration.Contracts;


public sealed record CreateAssistantCommand
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? ProfilePicture { get; set; }
}

public sealed record CreateAssistantRequest
{
    [Required, MinLength(2)]
    public required string FullName { get; set; }

    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required, MinLength(8)]
    public required string Password { get; set; }

    public string? ProfilePicture { get; set; }
}
