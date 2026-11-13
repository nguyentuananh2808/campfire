namespace Campfire.Modules.Learning.Domain.Games;

public sealed class VocabularyGameWord
{
    private VocabularyGameWord() { }

    public VocabularyGameWord(Guid id, int level, int orderIndex, string chinese, string pinyin, string meaningVi)
    {
        if (id == Guid.Empty) throw new ArgumentException("Word ID is required.", nameof(id));
        if (level is < 1 or > 10) throw new ArgumentOutOfRangeException(nameof(level));
        if (orderIndex is < 1 or > 20) throw new ArgumentOutOfRangeException(nameof(orderIndex));
        if (string.IsNullOrWhiteSpace(chinese) || chinese.Trim().Length > 20) throw new ArgumentException("Chinese text is required and limited to 20 characters.", nameof(chinese));
        if (string.IsNullOrWhiteSpace(pinyin) || pinyin.Trim().Length > 60) throw new ArgumentException("Pinyin is required and limited to 60 characters.", nameof(pinyin));
        if (string.IsNullOrWhiteSpace(meaningVi) || meaningVi.Trim().Length > 120) throw new ArgumentException("Vietnamese meaning is required and limited to 120 characters.", nameof(meaningVi));

        Id = id;
        Level = level;
        OrderIndex = orderIndex;
        Chinese = chinese.Trim();
        Pinyin = pinyin.Trim();
        MeaningVi = meaningVi.Trim();
    }

    public Guid Id { get; private set; }
    public int Level { get; private set; }
    public int OrderIndex { get; private set; }
    public string Chinese { get; private set; } = string.Empty;
    public string Pinyin { get; private set; } = string.Empty;
    public string MeaningVi { get; private set; } = string.Empty;
}
