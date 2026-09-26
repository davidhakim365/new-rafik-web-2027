using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentDiscountsConfigurations : IEntityTypeConfiguration<StudentDiscount>
{
    public void Configure(EntityTypeBuilder<StudentDiscount> builder)
    {
        builder.ToTable("StudentDiscounts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Percentage)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.Property(x => x.AppliesTo)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.HasIndex(x => x.StudentId).IsUnique();

        builder.HasOne(x => x.Student)
            .WithOne(x => x.Discount)
            .HasForeignKey<StudentDiscount>(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
