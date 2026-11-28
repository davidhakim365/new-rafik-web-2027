namespace LearnMS.API.Features.Christmas;

public interface IChristmasService
{
    Task<ChristmasSettingsResult> GetAsync(CancellationToken ct = default);
    Task<ChristmasSettingsResult> UpdateAsync(bool enabled, CancellationToken ct = default);
}
