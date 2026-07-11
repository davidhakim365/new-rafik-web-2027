using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class StudentsConfigurations : IEntityTypeConfiguration<Student>
{
    public void Configure(EntityTypeBuilder<Student> builder)
    {
        builder.HasBaseType<User>();

        builder.Property(x => x.Credit).HasField("_credit")
            .UsePropertyAccessMode(PropertyAccessMode.PreferFieldDuringConstruction);

        builder.Property(x => x.Level)
            .HasConversion(x => x.ToString(), x => (StudentLevel)Enum.Parse(typeof(StudentLevel), x));

        builder.HasMany(x => x.PurchasedLectures).WithMany(x => x.EnrolledStudents).UsingEntity<LectureEnrollment>(
            l => l.HasOne(x => x.Lecture).WithMany(x => x.LectureEnrollments).HasForeignKey(x => x.LectureId),
            r => r.HasOne(x => x.Student).WithMany(x => x.LectureEnrollments).HasForeignKey(x => x.StudentId)
        );

        builder.HasMany<Lecture>().WithMany().UsingEntity<LectureHomework>(
            l => l.HasOne(x => x.Lecture).WithMany(x => x.LectureHomeworks).HasForeignKey(x => x.LectureId),
            r => r.HasOne(x => x.Student).WithMany(x => x.LectureHomeworks).HasForeignKey(x => x.StudentId)
        );

        builder.HasMany<Lecture>().WithMany().UsingEntity<LectureQuiz>(
            l => l.HasOne(x => x.Lecture).WithMany(x => x.LectureQuizzes).HasForeignKey(x => x.LectureId),
            r => r.HasOne(x => x.Student).WithMany(x => x.LectureQuizzes).HasForeignKey(x => x.StudentId)
        );

        builder.HasMany(x => x.AttendedLessons).WithMany(x => x.AttendedStudents).UsingEntity<LessonAttendance>(
            l => l.HasOne(x => x.Lesson).WithMany(x => x.LessonAttendances).HasForeignKey(x => x.LessonId),
            r => r.HasOne(x => x.Student).WithMany(x => x.LessonAttendances).HasForeignKey(x => x.StudentId)
        );

        builder.HasMany(x => x.SubmittedQuizzes).WithMany(x => x.SubmittedStudents).UsingEntity<QuizSubmission>(
            l => l.HasOne(x => x.Quiz).WithMany(x => x.QuizSubmissions).HasForeignKey(x => x.QuizId),
            r => r.HasOne(x => x.Student).WithMany(x => x.QuizSubmissions).HasForeignKey(x => x.StudentId)
        );

        builder.HasMany(x => x.Events)
            .WithOne(x => x.Student).HasForeignKey(x => x.StudentId);
    }
}