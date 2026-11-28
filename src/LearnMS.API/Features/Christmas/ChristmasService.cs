using LearnMS.API.Data;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Christmas;

public sealed class ChristmasService(AppDbContext db) : IChristmasService
{
    public async Task<ChristmasSettingsResult> GetAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        return Map(settings);
    }

    public async Task<ChristmasSettingsResult> UpdateAsync(bool enabled, CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        settings.Enabled = enabled;
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(settings);
    }

    private async Task<ChristmasSettings> GetOrCreateAsync(CancellationToken ct)
    {
        var settings = await db.ChristmasSettings
            .FirstOrDefaultAsync(x => x.Id == ChristmasSettings.SingletonId, ct);

        if (settings is not null)
            return settings;

        settings = new ChristmasSettings
        {
            Id = ChristmasSettings.SingletonId,
            Enabled = false,
            UpdatedAt = DateTime.UtcNow
        };
        await db.ChristmasSettings.AddAsync(settings, ct);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static ChristmasSettingsResult Map(ChristmasSettings settings) => new()
    {
        Enabled = settings.Enabled,
        UpdatedAt = settings.UpdatedAt
    };
}
