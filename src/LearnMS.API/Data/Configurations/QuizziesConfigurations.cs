using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;


public class QuizzesConfigurations : IEntityTypeConfiguration<Quiz>
{
    public void Configure(EntityTypeBuilder<Quiz> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ResultType)
            .HasConversion(x => x.ToString(), x => (ResultType)Enum.Parse(typeof(ResultType), x));

        builder.HasOne(x => x.Lecture).WithMany(x => x.Quizzes).HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade);


        builder.HasMany(a => a.Questions)
            .WithMany(x => x.Quizzes).UsingEntity<QuizQuestion>(
                l => l.HasOne(x => x.Question).WithMany(x => x.QuizQuestions).HasForeignKey(x => x.QuestionId),
                r => r.HasOne(x => x.Quiz).WithMany(x => x.QuizQuestions).HasForeignKey(x => x.QuizId)
            );


        builder.HasMany(x => x.SubmittedStudents).WithMany(x => x.SubmittedQuizzes).UsingEntity<QuizSubmission>(
            l => l.HasOne(x => x.Student).WithMany(x => x.QuizSubmissions).HasForeignKey(x => x.StudentId),
            r => r.HasOne(x => x.Quiz).WithMany(x => x.QuizSubmissions).HasForeignKey(x => x.QuizId), jtb =>
            {
                jtb.Property(x => x.QuestionSubmissionsJson);
            }
        );
    }
}

