using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class CentersConfigurations : IEntityTypeConfiguration<Center>
{
    public void Configure(EntityTypeBuilder<Center> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Name).IsUnique();
        builder.Property(x => x.Name).IsRequired();
        builder.Property(x => x.IsActive).HasDefaultValue(true);
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("NOW()");
    }
}

public sealed class LectureAttendanceConfigurations : IEntityTypeConfiguration<LectureAttendance>
{
    public void Configure(EntityTypeBuilder<LectureAttendance> builder)
    {
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder
            .HasOne(x => x.Center)
            .WithMany(x => x.LectureAttendances)
            .HasForeignKey(x => x.CenterId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
