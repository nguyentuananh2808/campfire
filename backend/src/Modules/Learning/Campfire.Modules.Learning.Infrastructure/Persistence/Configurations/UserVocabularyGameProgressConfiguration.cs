using Campfire.Modules.Learning.Domain.Games;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Campfire.Modules.Learning.Infrastructure.Persistence.Configurations;

public sealed class UserVocabularyGameProgressConfiguration : IEntityTypeConfiguration<UserVocabularyGameProgress>
{
    public void Configure(EntityTypeBuilder<UserVocabularyGameProgress> builder)
    {
        builder.ToTable("user_vocabulary_game_progress", table =>
        {
            table.HasCheckConstraint("CK_user_vocabulary_game_progress_Level", "\"Level\" BETWEEN 1 AND 10");
            table.HasCheckConstraint("CK_user_vocabulary_game_progress_BestScore", "\"BestScore\" >= 0");
            table.HasCheckConstraint("CK_user_vocabulary_game_progress_BestAccuracy", "\"BestAccuracy\" BETWEEN 0 AND 100");
            table.HasCheckConstraint("CK_user_vocabulary_game_progress_Attempts", "\"Attempts\" >= 0");
        });
        builder.HasKey(x => new { x.UserId, x.Level });
        builder.HasIndex(x => new { x.UserId, x.CompletedAtUtc });
    }
}
