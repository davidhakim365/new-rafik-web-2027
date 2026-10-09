using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class AssistantTracesConfigurations : IEntityTypeConfiguration<AssistantTrace>
{
    public void Configure(EntityTypeBuilder<AssistantTrace> builder)
    {
        builder.ToTable("AssistantTraces");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ActorRole).HasMaxLength(32).IsRequired();
        builder.Property(x => x.ActorName).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Action).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Detail).HasMaxLength(500);
        builder.Property(x => x.Method).HasMaxLength(16).IsRequired();
        builder.Property(x => x.Path).HasMaxLength(512).IsRequired();
        builder.Property(x => x.CourseTitle).HasMaxLength(256);
        builder.Property(x => x.LectureTitle).HasMaxLength(256);

        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.ActorId);
        builder.HasIndex(x => x.CourseId);
        builder.HasIndex(x => x.LectureId);
    }
}
