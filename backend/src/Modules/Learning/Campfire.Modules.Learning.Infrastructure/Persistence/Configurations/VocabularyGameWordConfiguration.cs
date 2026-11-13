using Campfire.Modules.Learning.Domain.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Campfire.Modules.Learning.Infrastructure.Persistence.Configurations;

public sealed class VocabularyGameWordConfiguration : IEntityTypeConfiguration<VocabularyGameWord>
{
    public void Configure(EntityTypeBuilder<VocabularyGameWord> builder)
    {
        builder.ToTable("vocabulary_game_words", table =>
        {
            table.HasCheckConstraint("CK_vocabulary_game_words_Level", "\"Level\" BETWEEN 1 AND 10");
            table.HasCheckConstraint("CK_vocabulary_game_words_OrderIndex", "\"OrderIndex\" BETWEEN 1 AND 20");
        });
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Chinese).HasMaxLength(20).IsRequired();
        builder.Property(x => x.Pinyin).HasMaxLength(60).IsRequired();
        builder.Property(x => x.MeaningVi).HasMaxLength(120).IsRequired();
        builder.HasIndex(x => new { x.Level, x.OrderIndex }).IsUnique();
    }
}
