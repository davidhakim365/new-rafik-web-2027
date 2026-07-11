using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public class LessonsConfigurations : IEntityTypeConfiguration<Lesson>
{
    public void Configure(EntityTypeBuilder<Lesson> builder)
    {
        builder.HasOne(x => x.Lecture).WithMany(x => x.Lessons).HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.AttendedStudents).WithMany(x => x.AttendedLessons).UsingEntity<LessonAttendance>(
            l => l.HasOne(x => x.Student).WithMany(x => x.LessonAttendances).HasForeignKey(x => x.StudentId),
            r => r.HasOne(x => x.Lesson).WithMany(x => x.LessonAttendances).HasForeignKey(x => x.LessonId)
        );
    }
}