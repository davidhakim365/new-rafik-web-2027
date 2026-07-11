using System.ComponentModel.DataAnnotations;

namespace LearnMS.API.Features.Auth.Contracts;

public sealed record LoginRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }
    [Required, MinLength(8)]
    public required string Password { get; set; }
};

public sealed record LoginExternalRequest(
    string Token,
    string Provider
);


public sealed record LoginCommand
{

    public required string Email { get; set; }
    public required string Password { get; set; }
    public string? DeviceKey { get; set; } = null;
}


public sealed record LoginExternalCommand(
    string Token,
    string Provider
);


public sealed record LoginResult
{
    [Required]
    public required Guid Id { get; set; }
    [Required]
    public required string Token { get; set; }
    [Required]
    public required UserRole Role { get; set; }
    [Required]
    public required string? DeviceKey { get; set; }
};

public sealed record LoginResponse
{
    [Required]
    public required Guid Id { get; set; }
    [Required]
    public required string Token { get; set; }
    [Required]
    public required UserRole Role { get; set; }
    public required string? DeviceKey { get; set; }
};