using LearnMS.API.Data;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Features.Ramadan;

public sealed class RamadanService(AppDbContext db) : IRamadanService
{
    public async Task<RamadanSettingsResult> GetAsync(CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        return Map(settings);
    }

    public async Task<RamadanSettingsResult> UpdateAsync(bool enabled, CancellationToken ct = default)
    {
        var settings = await GetOrCreateAsync(ct);
        settings.Enabled = enabled;
        settings.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Map(settings);
    }

    private async Task<RamadanSettings> GetOrCreateAsync(CancellationToken ct)
    {
        var settings = await db.RamadanSettings
            .FirstOrDefaultAsync(x => x.Id == RamadanSettings.SingletonId, ct);

        if (settings is not null)
            return settings;

        settings = new RamadanSettings
        {
            Id = RamadanSettings.SingletonId,
            Enabled = false,
            UpdatedAt = DateTime.UtcNow
        };
        await db.RamadanSettings.AddAsync(settings, ct);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static RamadanSettingsResult Map(RamadanSettings settings) => new()
    {
        Enabled = settings.Enabled,
        UpdatedAt = settings.UpdatedAt
    };
}
