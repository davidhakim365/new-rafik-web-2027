using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class WebPushSubscriptionsConfigurations : IEntityTypeConfiguration<WebPushSubscription>
{
    public void Configure(EntityTypeBuilder<WebPushSubscription> builder)
    {
        builder.ToTable("WebPushSubscriptions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Endpoint).HasMaxLength(2048).IsRequired();
        builder.Property(x => x.P256dh).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Auth).HasMaxLength(256).IsRequired();
        builder.Property(x => x.UserAgent).HasMaxLength(512);
        builder.HasIndex(x => x.Endpoint).IsUnique();
        builder.HasIndex(x => x.UserId);
    }
}

public sealed class WebPushKeysConfigurations : IEntityTypeConfiguration<WebPushKeys>
{
    public void Configure(EntityTypeBuilder<WebPushKeys> builder)
    {
        builder.ToTable("WebPushKeys");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PublicKey).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PrivateKey).HasMaxLength(256).IsRequired();
    }
}
