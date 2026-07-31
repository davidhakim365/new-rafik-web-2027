using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureStudentCallLogsConfigurations : IEntityTypeConfiguration<LectureStudentCallLog>
{
    public void Configure(EntityTypeBuilder<LectureStudentCallLog> builder)
    {
        builder.ToTable("LectureStudentCallLogs");
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder
            .HasOne(x => x.Lecture)
            .WithMany(x => x.LectureStudentCallLogs)
            .HasForeignKey(x => x.LectureId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Student)
            .WithMany(x => x.LectureStudentCallLogs)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
