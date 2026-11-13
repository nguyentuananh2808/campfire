using Campfire.Modules.Learning.Domain.Games;

namespace Campfire.UnitTests;

public sealed class VocabularyGameProgressTests
{
    [Fact]
    public void Successful_attempt_completes_level_only_once_and_keeps_best_results()
    {
        var progress = new UserVocabularyGameProgress(Guid.NewGuid(), 3);
        var completedAt = DateTimeOffset.UtcNow;

        Assert.True(progress.RecordAttempt(900, 9, 11, 1, 9, completedAt));
        Assert.False(progress.RecordAttempt(700, 9, 10, 2, 9, completedAt.AddMinutes(1)));

        Assert.Equal(completedAt, progress.CompletedAtUtc);
        Assert.Equal(900, progress.BestScore);
        Assert.Equal(90, progress.BestAccuracy);
        Assert.Equal(2, progress.Attempts);
    }

    [Fact]
    public void Attempt_without_remaining_life_does_not_complete_level()
    {
        var progress = new UserVocabularyGameProgress(Guid.NewGuid(), 1);

        Assert.False(progress.RecordAttempt(600, 7, 10, 0, 7, DateTimeOffset.UtcNow));
        Assert.Null(progress.CompletedAtUtc);
    }
}
