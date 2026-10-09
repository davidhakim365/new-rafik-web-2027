using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureStudentDiscountsConfigurations : IEntityTypeConfiguration<LectureStudentDiscount>
{
    public void Configure(EntityTypeBuilder<LectureStudentDiscount> builder)
    {
        builder.ToTable("LectureStudentDiscounts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Percentage)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(x => x.AppliesTo)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => new { x.StudentId, x.LectureId }).IsUnique();

        builder.HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Lecture)
            .WithMany()
            .HasForeignKey(x => x.LectureId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
