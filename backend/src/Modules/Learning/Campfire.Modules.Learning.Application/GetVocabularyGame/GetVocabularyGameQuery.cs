using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;
using MediatR;

namespace Campfire.Modules.Learning.Application.GetVocabularyGame;

public sealed record GetVocabularyGameQuery(Guid UserId) : IRequest<LearningResult<LearningModels.VocabularyGameOverview>>;
