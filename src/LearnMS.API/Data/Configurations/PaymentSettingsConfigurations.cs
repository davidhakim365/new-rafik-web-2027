using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class PaymentSettingsConfigurations : IEntityTypeConfiguration<PaymentSettings>
{
    public void Configure(EntityTypeBuilder<PaymentSettings> builder)
    {
        builder.ToTable("PaymentSettings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.InstapayNumber).HasMaxLength(64);
        builder.Property(x => x.WalletNumber).HasMaxLength(64);
        builder.HasData(new PaymentSettings
        {
            Id = PaymentSettings.SingletonId,
            InstapayNumber = null,
            WalletNumber = null,
            UpdatedAt = new DateTime(2026, 10, 24, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
