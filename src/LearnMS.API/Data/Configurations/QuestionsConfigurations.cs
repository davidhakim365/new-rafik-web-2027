using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class QuestionsConfigurations : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        // Quiz <-> Question is configured on QuizzesConfigurations only.
        // Configuring UsingEntity on both sides caused duplicate QuizQuestion inserts.
    }
}
