using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class PaymentRequestsConfigurations : IEntityTypeConfiguration<PaymentRequest>
{
    public void Configure(EntityTypeBuilder<PaymentRequest> builder)
    {
        builder.ToTable("PaymentRequests");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(x => x.ImageUrl)
            .HasMaxLength(2048)
            .IsRequired();

        builder.Property(x => x.ImageThumbUrl).HasMaxLength(2048);
        builder.Property(x => x.Note).HasMaxLength(500);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .HasDefaultValue(PaymentRequestStatus.Pending);

        builder.Property(x => x.RejectionReason).HasMaxLength(500);

        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => x.StudentId)
            .HasFilter("\"Status\" = 'Pending'")
            .IsUnique()
            .HasDatabaseName("IX_PaymentRequests_StudentId_Pending");

        builder.HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
