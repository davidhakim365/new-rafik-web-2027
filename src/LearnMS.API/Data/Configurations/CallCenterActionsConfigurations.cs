using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class CallCenterActionsConfigurations : IEntityTypeConfiguration<CallCenterAction>
{
    public void Configure(EntityTypeBuilder<CallCenterAction> builder)
    {
        builder.ToTable("CallCenterActions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActionType)
            .HasConversion<string>()
            .HasMaxLength(32);

        builder.Property(x => x.Comment).HasMaxLength(4000);

        builder.HasIndex(x => new { x.LectureId, x.StudentId, x.CreatedAt });

        builder
            .HasOne(x => x.Lecture)
            .WithMany()
            .HasForeignKey(x => x.LectureId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
