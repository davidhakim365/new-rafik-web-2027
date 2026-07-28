using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class RewardSystemSettingsConfigurations : IEntityTypeConfiguration<RewardSystemSettings>
{
    public void Configure(EntityTypeBuilder<RewardSystemSettings> builder)
    {
        builder.ToTable("RewardSystemSettings");
        builder.HasKey(x => x.Id);
        builder.HasData(new RewardSystemSettings
        {
            Id = RewardSystemSettings.SingletonId,
            BaseSessionValue = 150,
            SessionsPerMilestone = 20,
            SessionBonusIncrement = 20,
            MaxSessionValue = 200,
            UpdatedAt = new DateTime(2026, 7, 28, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
