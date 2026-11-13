using FluentValidation;

namespace Campfire.Modules.Learning.Application.SubmitVocabularyGame;

public sealed class SubmitVocabularyGameCommandValidator : AbstractValidator<SubmitVocabularyGameCommand>
{
    public SubmitVocabularyGameCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Level).InclusiveBetween(1, 10);
        RuleFor(x => x.Score).InclusiveBetween(0, 1_000_000);
        RuleFor(x => x.Total).InclusiveBetween(1, 100);
        RuleFor(x => x.Correct).GreaterThanOrEqualTo(0).LessThanOrEqualTo(x => x.Total);
        RuleFor(x => x.RemainingLives).InclusiveBetween(0, 3);
    }
}
