using System.Data;
using Campfire.Modules.Learning.Application.Abstractions;
using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;
using Campfire.Modules.Learning.Domain.Games;
using Campfire.Modules.Learning.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Campfire.Modules.Learning.Infrastructure.Services;

public sealed class EfVocabularyGameService(LearningDbContext dbContext, TimeProvider timeProvider) : IVocabularyGameService
{
    private static readonly string[] Titles = ["Chào quanh lửa", "Bạn và tôi", "Đếm tia lửa", "Nhịp thời gian", "Mái nhà ấm", "Góc lớp học", "Bữa ăn vui", "Đi khắp phố", "Nối ý nhanh", "Từ vựng nâng cao"];
    private static readonly string[] Themes = ["Chào hỏi", "Đại từ", "Con số", "Thời gian", "Gia đình", "Trường học", "Ẩm thực", "Địa điểm", "Liên từ", "Khái niệm"];

    public async Task<LearningResult<LearningModels.VocabularyGameOverview>> GetOverviewAsync(Guid userId, CancellationToken cancellationToken)
    {
        var words = await dbContext.VocabularyGameWords.AsNoTracking().OrderBy(x => x.Level).ThenBy(x => x.OrderIndex).ToListAsync(cancellationToken);
        if (words.Count == 0) return LearningResult<LearningModels.VocabularyGameOverview>.Failure("not_found", "Chưa có dữ liệu trò chơi từ vựng.");
        var progress = await dbContext.VocabularyGameProgress.AsNoTracking().Where(x => x.UserId == userId).ToDictionaryAsync(x => x.Level, cancellationToken);
        return LearningResult<LearningModels.VocabularyGameOverview>.Success(BuildOverview(words, progress));
    }

    public async Task<LearningResult<LearningModels.VocabularyGameResult>> SubmitResultAsync(Guid userId, int level, int score, int correct, int total, int remainingLives, CancellationToken cancellationToken)
    {
        var settings = Settings(level);
        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        await dbContext.Database.ExecuteSqlInterpolatedAsync($"SELECT pg_advisory_xact_lock(hashtext({userId.ToString()}), {level})", cancellationToken);
        if (level > 1 && !await dbContext.VocabularyGameProgress.AnyAsync(x => x.UserId == userId && x.Level == level - 1 && x.CompletedAtUtc != null, cancellationToken))
            return LearningResult<LearningModels.VocabularyGameResult>.Failure("forbidden", "Hãy hoàn thành cấp độ trước để mở khóa.");

        var progress = await dbContext.VocabularyGameProgress.SingleOrDefaultAsync(x => x.UserId == userId && x.Level == level, cancellationToken);
        if (progress is null)
        {
            progress = new UserVocabularyGameProgress(userId, level);
            dbContext.VocabularyGameProgress.Add(progress);
        }
        var newlyCompleted = progress.RecordAttempt(score, correct, total, remainingLives, settings.RequiredHits, timeProvider.GetUtcNow());
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        var highest = Math.Min(10, (await dbContext.VocabularyGameProgress.AsNoTracking().Where(x => x.UserId == userId && x.CompletedAtUtc != null).Select(x => (int?)x.Level).MaxAsync(cancellationToken) ?? 0) + 1);
        return LearningResult<LearningModels.VocabularyGameResult>.Success(new(level, progress.CompletedAtUtc is not null, newlyCompleted, progress.BestScore, progress.BestAccuracy, Math.Max(1, highest)));
    }

    private static LearningModels.VocabularyGameOverview BuildOverview(IReadOnlyList<VocabularyGameWord> words, IReadOnlyDictionary<int, UserVocabularyGameProgress> progress)
    {
        var completed = progress.Values.Count(x => x.CompletedAtUtc is not null);
        var highestUnlocked = Math.Min(10, Math.Max(1, progress.Values.Where(x => x.CompletedAtUtc is not null).Select(x => x.Level + 1).DefaultIfEmpty(1).Max()));
        var levels = Enumerable.Range(1, 10).Select(level =>
        {
            var setting = Settings(level);
            progress.TryGetValue(level, out var current);
            var unlocked = level <= highestUnlocked;
            var levelWords = unlocked
                ? words.Where(x => x.Level == level).Select(x => new LearningModels.VocabularyGameWord(x.Id, x.Chinese, x.Pinyin, x.MeaningVi)).ToList()
                : [];
            return new LearningModels.VocabularyGameLevel(level, Titles[level - 1], Themes[level - 1], setting.SpawnIntervalMs, setting.FallDurationMs, setting.MaxActiveWords, setting.RequiredHits, unlocked, current?.CompletedAtUtc is not null, current?.BestScore ?? 0, current?.BestAccuracy ?? 0, levelWords);
        }).ToList();
        return new(highestUnlocked, completed, levels);
    }

    private static (int SpawnIntervalMs, int FallDurationMs, int MaxActiveWords, int RequiredHits) Settings(int level)
    {
        if (level is < 1 or > 10) throw new ArgumentOutOfRangeException(nameof(level));
        return (Math.Max(900, 2_100 - (level - 1) * 120), Math.Max(5_500, 10_500 - (level - 1) * 500), Math.Min(4, 1 + (level - 1) / 3), 6 + level);
    }
}
