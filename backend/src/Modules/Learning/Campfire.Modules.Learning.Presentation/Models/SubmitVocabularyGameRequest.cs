namespace Campfire.Modules.Learning.Presentation.Models;

public sealed record SubmitVocabularyGameRequest(int Level, int Score, int Correct, int Total, int RemainingLives);
