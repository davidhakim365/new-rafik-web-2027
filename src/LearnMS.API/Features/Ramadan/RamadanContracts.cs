namespace LearnMS.API.Features.Ramadan;

public sealed class RamadanSettingsResult
{
    public bool Enabled { get; init; }
    public DateTime UpdatedAt { get; init; }
}

public sealed class UpdateRamadanSettingsRequest
{
    public bool Enabled { get; init; }
}
