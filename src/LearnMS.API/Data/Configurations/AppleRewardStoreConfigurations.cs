using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class AppleRewardItemConfigurations : IEntityTypeConfiguration<AppleRewardItem>
{
    public void Configure(EntityTypeBuilder<AppleRewardItem> builder)
    {
        builder.ToTable("AppleRewardItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.ImageUrl).HasMaxLength(2000).IsRequired();
        builder.HasIndex(x => x.IsActive);
        builder.HasIndex(x => x.SortOrder);
    }
}

public sealed class AppleStoreSettingsConfigurations : IEntityTypeConfiguration<AppleStoreSettings>
{
    public void Configure(EntityTypeBuilder<AppleStoreSettings> builder)
    {
        builder.ToTable("AppleStoreSettings");
        builder.HasKey(x => x.Id);
        builder.HasData(new AppleStoreSettings
        {
            Id = AppleStoreSettings.SingletonId,
            IsEnabled = false,
            OpensAt = null,
            ClosesAt = null,
            UpdatedAt = new DateTime(2026, 7, 20, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}

public sealed class AppleRewardOrderConfigurations : IEntityTypeConfiguration<AppleRewardOrder>
{
    public void Configure(EntityTypeBuilder<AppleRewardOrder> builder)
    {
        builder.ToTable("AppleRewardOrders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ItemTitleSnapshot).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => x.ItemId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId);
        builder.HasOne(x => x.Item).WithMany().HasForeignKey(x => x.ItemId);
    }
}
