using Campfire.Modules.Learning.Application.Common;
using Campfire.Modules.Learning.Application.Models;
using MediatR;

namespace Campfire.Modules.Learning.Application.SubmitVocabularyGame;

public sealed record SubmitVocabularyGameCommand(Guid UserId, int Level, int Score, int Correct, int Total, int RemainingLives) : IRequest<LearningResult<LearningModels.VocabularyGameResult>>;
