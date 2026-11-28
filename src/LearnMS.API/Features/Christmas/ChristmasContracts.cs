namespace LearnMS.API.Features.Christmas;

public sealed class ChristmasSettingsResult
{
    public bool Enabled { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class UpdateChristmasSettingsRequest
{
    public bool Enabled { get; init; }
}
