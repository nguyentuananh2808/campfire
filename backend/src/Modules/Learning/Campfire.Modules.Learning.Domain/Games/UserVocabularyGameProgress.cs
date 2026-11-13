namespace Campfire.Modules.Learning.Domain.Games;

public sealed class UserVocabularyGameProgress
{
    private UserVocabularyGameProgress() { }

    public UserVocabularyGameProgress(Guid userId, int level)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        if (level is < 1 or > 10) throw new ArgumentOutOfRangeException(nameof(level));
        UserId = userId;
        Level = level;
    }

    public Guid UserId { get; private set; }
    public int Level { get; private set; }
    public int BestScore { get; private set; }
    public int BestAccuracy { get; private set; }
    public int Attempts { get; private set; }
    public DateTimeOffset? CompletedAtUtc { get; private set; }

    public bool RecordAttempt(int score, int correct, int total, int remainingLives, int requiredHits, DateTimeOffset occurredAtUtc)
    {
        if (score < 0) throw new ArgumentOutOfRangeException(nameof(score));
        if (total <= 0 || correct < 0 || correct > total) throw new ArgumentOutOfRangeException(nameof(correct));
        if (remainingLives is < 0 or > 3) throw new ArgumentOutOfRangeException(nameof(remainingLives));
        if (requiredHits <= 0) throw new ArgumentOutOfRangeException(nameof(requiredHits));

        Attempts++;
        BestScore = Math.Max(BestScore, score);
        BestAccuracy = Math.Max(BestAccuracy, (int)Math.Round(correct * 100d / total));
        var completedNow = CompletedAtUtc is null && correct >= requiredHits && remainingLives > 0;
        if (completedNow) CompletedAtUtc = occurredAtUtc;
        return completedNow;
    }
}
