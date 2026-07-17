using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class AssistantRewardEventsConfigurations : IEntityTypeConfiguration<AssistantRewardEvent>
{
    public void Configure(EntityTypeBuilder<AssistantRewardEvent> builder)
    {
        builder.ToTable("AssistantRewardEvents");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.AssistantId);
        builder.HasIndex(x => x.CreatedAt);
        builder.Property(x => x.Type)
            .HasConversion(x => x.ToString(), x => Enum.Parse<AssistantRewardEventType>(x));
        builder.HasOne<Assistant>().WithMany().HasForeignKey(x => x.AssistantId);
    }
}
