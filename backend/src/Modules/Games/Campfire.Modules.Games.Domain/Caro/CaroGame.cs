namespace Campfire.Modules.Games.Domain.Caro;

public sealed class CaroGame
{
    public const int DefaultBoardSize = 15;
    public const int DefaultWinLength = 5;
    public const int MaximumBoardSize = 15;

    private CaroGame() { }

    public Guid Id { get; private set; }
    public Guid GroupId { get; private set; }
    public Guid XPlayerUserId { get; private set; }
    public Guid OPlayerUserId { get; private set; }
    public Guid CurrentPlayerUserId { get; private set; }
    public Guid? WinnerUserId { get; private set; }
    public int BoardSize { get; private set; }
    public int WinLength { get; private set; }
    public string Board { get; private set; } = string.Empty;
    public CaroGameStatus Status { get; private set; }
    public Guid Version { get; private set; }
    public DateTimeOffset CreatedAtUtc { get; private set; }
    public DateTimeOffset UpdatedAtUtc { get; private set; }

    public static CaroGame Create(
        Guid groupId,
        Guid creatorUserId,
        Guid opponentUserId,
        DateTimeOffset now,
        int boardSize = DefaultBoardSize,
        int winLength = DefaultWinLength)
    {
        if (groupId == Guid.Empty || creatorUserId == Guid.Empty || opponentUserId == Guid.Empty)
            throw new ArgumentException("Game identifiers are required.");
        if (creatorUserId == opponentUserId)
            throw new ArgumentException("A game requires two different players.");
        if (!IsSupportedBoard(boardSize, winLength))
            throw new ArgumentException("The requested Caro board is not supported.");

        return new CaroGame
        {
            Id = Guid.NewGuid(),
            GroupId = groupId,
            XPlayerUserId = creatorUserId,
            OPlayerUserId = opponentUserId,
            CurrentPlayerUserId = creatorUserId,
            BoardSize = boardSize,
            WinLength = winLength,
            Board = new string('-', boardSize * boardSize),
            Status = CaroGameStatus.Active,
            Version = Guid.NewGuid(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
    }

    public void Play(Guid playerUserId, int cell, DateTimeOffset now)
    {
        if (Status != CaroGameStatus.Active) throw new InvalidOperationException("Game is finished.");
        if (playerUserId != CurrentPlayerUserId) throw new InvalidOperationException("It is not this player's turn.");
        if (cell < 0 || cell >= Board.Length) throw new ArgumentOutOfRangeException(nameof(cell));
        if (Board[cell] != '-') throw new InvalidOperationException("Cell is occupied.");

        var mark = playerUserId == XPlayerUserId ? 'X' : 'O';
        var cells = Board.ToCharArray();
        cells[cell] = mark;
        Board = new string(cells);
        UpdatedAtUtc = now;
        Version = Guid.NewGuid();

        if (HasWinningLine(cell, mark))
        {
            Status = CaroGameStatus.Won;
            WinnerUserId = playerUserId;
            return;
        }

        if (!Board.Contains('-'))
        {
            Status = CaroGameStatus.Draw;
            return;
        }

        CurrentPlayerUserId = playerUserId == XPlayerUserId ? OPlayerUserId : XPlayerUserId;
    }

    private static bool IsSupportedBoard(int boardSize, int winLength) =>
        (boardSize == 3 && winLength == 3) ||
        (boardSize == DefaultBoardSize && winLength == DefaultWinLength);

    private bool HasWinningLine(int cell, char mark)
    {
        var row = cell / BoardSize;
        var column = cell % BoardSize;
        return CountLine(row, column, 0, 1, mark) >= WinLength ||
               CountLine(row, column, 1, 0, mark) >= WinLength ||
               CountLine(row, column, 1, 1, mark) >= WinLength ||
               CountLine(row, column, 1, -1, mark) >= WinLength;
    }

    private int CountLine(int row, int column, int rowStep, int columnStep, char mark) =>
        1 + CountDirection(row, column, rowStep, columnStep, mark) +
        CountDirection(row, column, -rowStep, -columnStep, mark);

    private int CountDirection(int row, int column, int rowStep, int columnStep, char mark)
    {
        var count = 0;
        for (var distance = 1; distance < WinLength; distance++)
        {
            var candidateRow = row + rowStep * distance;
            var candidateColumn = column + columnStep * distance;
            if (candidateRow < 0 || candidateRow >= BoardSize || candidateColumn < 0 ||
                candidateColumn >= BoardSize || Board[candidateRow * BoardSize + candidateColumn] != mark)
                break;
            count++;
        }
        return count;
    }
}
