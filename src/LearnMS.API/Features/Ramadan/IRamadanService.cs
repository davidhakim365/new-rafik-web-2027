namespace LearnMS.API.Features.Ramadan;

public interface IRamadanService
{
    Task<RamadanSettingsResult> GetAsync(CancellationToken ct = default);
    Task<RamadanSettingsResult> UpdateAsync(bool enabled, CancellationToken ct = default);
}
