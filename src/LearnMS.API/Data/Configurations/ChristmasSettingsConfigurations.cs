using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class ChristmasSettingsConfigurations : IEntityTypeConfiguration<ChristmasSettings>
{
    public void Configure(EntityTypeBuilder<ChristmasSettings> builder)
    {
        builder.ToTable("ChristmasSettings");
        builder.HasKey(x => x.Id);
        builder.HasData(new ChristmasSettings
        {
            Id = ChristmasSettings.SingletonId,
            Enabled = false,
            UpdatedAt = new DateTime(2026, 11, 28, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
