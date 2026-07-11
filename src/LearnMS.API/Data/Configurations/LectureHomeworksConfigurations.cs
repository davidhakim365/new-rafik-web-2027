using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureHomeworksConfigurations : IEntityTypeConfiguration<LectureHomework>
{
    public void Configure(EntityTypeBuilder<LectureHomework> builder)
    {
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder.HasOne<Lecture>().WithMany().HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
    }
}