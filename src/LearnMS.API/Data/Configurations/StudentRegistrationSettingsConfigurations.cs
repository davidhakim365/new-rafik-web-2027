using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentRegistrationSettingsConfigurations
    : IEntityTypeConfiguration<StudentRegistrationSettings>
{
    public void Configure(EntityTypeBuilder<StudentRegistrationSettings> builder)
    {
        builder.ToTable("StudentRegistrationSettings");
        builder.HasKey(x => x.Id);
        builder.HasData(new StudentRegistrationSettings
        {
            Id = StudentRegistrationSettings.SingletonId,
            IsSignupEnabled = true,
            UpdatedAt = new DateTime(2026, 8, 3, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
