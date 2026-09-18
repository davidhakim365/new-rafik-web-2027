using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class PaymentRequestRejectionReasonsConfigurations
    : IEntityTypeConfiguration<PaymentRequestRejectionReason>
{
    public void Configure(EntityTypeBuilder<PaymentRequestRejectionReason> builder)
    {
        builder.ToTable("PaymentRequestRejectionReasons");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Text)
            .HasMaxLength(500)
            .IsRequired();

        builder.HasIndex(x => x.SortOrder);
    }
}
