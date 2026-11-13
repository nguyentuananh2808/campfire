using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;

namespace Campfire.Modules.Learning.Application.Abstractions;

public interface IVocabularyGameService
{
    Task<LearningResult<LearningModels.VocabularyGameOverview>> GetOverviewAsync(Guid userId, CancellationToken cancellationToken);
    Task<LearningResult<LearningModels.VocabularyGameResult>> SubmitResultAsync(Guid userId, int level, int score, int correct, int total, int remainingLives, CancellationToken cancellationToken);
}
