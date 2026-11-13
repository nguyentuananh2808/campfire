using Campfire.Modules.Learning.Application.Abstractions;
using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;
using MediatR;

namespace Campfire.Modules.Learning.Application.GetVocabularyGame;

public sealed class GetVocabularyGameQueryHandler(IVocabularyGameService service) : IRequestHandler<GetVocabularyGameQuery, LearningResult<LearningModels.VocabularyGameOverview>>
{
    public Task<LearningResult<LearningModels.VocabularyGameOverview>> Handle(GetVocabularyGameQuery request, CancellationToken cancellationToken) =>
        service.GetOverviewAsync(request.UserId, cancellationToken);
}
