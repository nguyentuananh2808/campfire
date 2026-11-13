using Campfire.Modules.Learning.Application.Abstractions;
using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;
using MediatR;

namespace Campfire.Modules.Learning.Application.SubmitVocabularyGame;

public sealed class SubmitVocabularyGameCommandHandler(IVocabularyGameService service) : IRequestHandler<SubmitVocabularyGameCommand, LearningResult<LearningModels.VocabularyGameResult>>
{
    public Task<LearningResult<LearningModels.VocabularyGameResult>> Handle(SubmitVocabularyGameCommand request, CancellationToken cancellationToken) =>
        service.SubmitResultAsync(request.UserId, request.Level, request.Score, request.Correct, request.Total, request.RemainingLives, cancellationToken);
}
