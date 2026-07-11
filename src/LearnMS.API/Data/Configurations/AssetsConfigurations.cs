using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class AssetsConfigurations : IEntityTypeConfiguration<Asset>
{
    public void Configure(EntityTypeBuilder<Asset> builder)
    {
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.HasMany(x => x.Lectures).WithMany(x => x.Assets).UsingEntity<LectureAsset>(
            l => l.HasOne(x => x.Lecture).WithMany(x => x.LectureAssets).HasForeignKey(x => x.LectureId),
            r => r.HasOne(x => x.Asset).WithMany(x => x.LectureAssets).HasForeignKey(x => x.AssetId)
        );
    }
}