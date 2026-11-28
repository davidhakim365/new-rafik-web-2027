using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class RamadanSettingsConfigurations : IEntityTypeConfiguration<RamadanSettings>
{
    public void Configure(EntityTypeBuilder<RamadanSettings> builder)
    {
        builder.ToTable("RamadanSettings");
        builder.HasKey(x => x.Id);
        builder.HasData(new RamadanSettings
        {
            Id = RamadanSettings.SingletonId,
            Enabled = false,
            UpdatedAt = new DateTime(2026, 11, 28, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
