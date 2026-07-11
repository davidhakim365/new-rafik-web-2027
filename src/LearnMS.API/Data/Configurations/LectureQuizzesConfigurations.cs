using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LectureQuizzesConfigurations : IEntityTypeConfiguration<LectureQuiz>
{
    public void Configure(EntityTypeBuilder<LectureQuiz> builder)
    {
        builder.HasKey(x => new { x.LectureId, x.StudentId });

        builder.HasOne<Lecture>().WithMany().HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
    }
}