using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class ExamsConfigurations : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ResultType)
            .HasConversion(x => x.ToString(), x => (ResultType)Enum.Parse(typeof(ResultType), x));

        builder.HasOne(x => x.Course).WithMany(x => x.Exams).HasForeignKey(x => x.CourseId);

        builder.HasMany(a => a.Questions)
            .WithMany(x => x.Exams).UsingEntity<ExamQuestion>(
                l => l.HasOne(x => x.Question).WithMany(x => x.ExamQuestions).HasForeignKey(x => x.QuestionId),
                r => r.HasOne(x => x.Exam).WithMany(x => x.ExamQuestions).HasForeignKey(x => x.ExamId)
            );

        builder.HasMany(x => x.EnrolledStudents).WithMany(x => x.PurchasedExams).UsingEntity<ExamEnrollment>(
          l => l.HasOne(x => x.Student).WithMany(x => x.ExamEnrollments).HasForeignKey(x => x.StudentId),
          r => r.HasOne(x => x.Exam).WithMany(x => x.ExamEnrollments).HasForeignKey(x => x.ExamId), b =>
          {
              b.HasKey(x => new
              {
                  x.StudentId,
                  x.ExamId
              });

              b.HasOne(x => x.Submission).WithOne(x => x.ExamEnrollment).HasForeignKey<ExamSubmission>(x => new
              {
                  x.StudentId,
                  x.ExamId
              });
          }
      );
    }
}

public sealed class ExamSubmissionConfigurations : IEntityTypeConfiguration<ExamSubmission>
{
    public void Configure(EntityTypeBuilder<ExamSubmission> builder)
    {
        builder.HasKey(x => new
        {
            x.StudentId,
            x.ExamId
        });

    }
}