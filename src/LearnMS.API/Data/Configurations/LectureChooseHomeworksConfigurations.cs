using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureChooseHomeworksConfigurations : IEntityTypeConfiguration<LectureChooseHomework>
{
    public void Configure(EntityTypeBuilder<LectureChooseHomework> builder)
    {
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder
            .HasOne(x => x.Lecture)
            .WithMany(x => x.LectureChooseHomeworks)
            .HasForeignKey(x => x.LectureId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasOne(x => x.Student)
            .WithMany(x => x.LectureChooseHomeworks)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
