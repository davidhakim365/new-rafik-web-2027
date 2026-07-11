using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentLectureConfigurations : IEntityTypeConfiguration<LectureEnrollment>
{
    public void Configure(EntityTypeBuilder<LectureEnrollment> builder)
    {
        builder.HasKey(x => new { x.StudentId, x.LectureId });

        builder.HasOne<Lecture>().WithOne().HasForeignKey<LectureEnrollment>(x => x.LectureId);
        builder.HasOne<Student>().WithOne().HasForeignKey<LectureEnrollment>(x => x.StudentId);
    }
}