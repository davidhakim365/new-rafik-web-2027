using System.Text.Json;
using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class QuestionsConfigurations : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {

        builder.HasMany(x => x.Quizzes).WithMany(x => x.Questions).UsingEntity<QuizQuestion>(
            l => l.HasOne(x => x.Quiz).WithMany(x => x.QuizQuestions).HasForeignKey(x => x.QuizId),
            r => r.HasOne(x => x.Question).WithMany(x => x.QuizQuestions).HasForeignKey(x => x.QuestionId)
        );

    }
}
