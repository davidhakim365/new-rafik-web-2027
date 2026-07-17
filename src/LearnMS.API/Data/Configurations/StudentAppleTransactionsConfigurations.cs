using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentAppleTransactionsConfigurations : IEntityTypeConfiguration<StudentAppleTransaction>
{
    public void Configure(EntityTypeBuilder<StudentAppleTransaction> builder)
    {
        builder.ToTable("StudentAppleTransactions");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId);
    }
}
