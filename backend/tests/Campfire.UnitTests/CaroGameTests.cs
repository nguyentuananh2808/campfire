using Campfire.Modules.Games.Domain.Caro;

namespace Campfire.UnitTests;

public sealed class CaroGameTests
{
    [Fact]
    public void Play_enforces_turns_and_occupied_cells()
    {
        var x = Guid.NewGuid();
        var o = Guid.NewGuid();
        var game = CaroGame.Create(Guid.NewGuid(), x, o, DateTimeOffset.UtcNow);

        Assert.Equal(15, game.BoardSize);
        Assert.Equal(5, game.WinLength);
        Assert.Equal(225, game.Board.Length);

        Assert.Throws<InvalidOperationException>(() => game.Play(o, 0, DateTimeOffset.UtcNow));
        game.Play(x, 0, DateTimeOffset.UtcNow);
        Assert.Throws<InvalidOperationException>(() => game.Play(o, 0, DateTimeOffset.UtcNow));
        Assert.Equal(o, game.CurrentPlayerUserId);
    }

    [Fact]
    public void Play_detects_a_winner_and_rotates_version()
    {
        var x = Guid.NewGuid();
        var o = Guid.NewGuid();
        var game = CaroGame.Create(Guid.NewGuid(), x, o, DateTimeOffset.UtcNow);
        var initialVersion = game.Version;

        game.Play(x, 0, DateTimeOffset.UtcNow);
        game.Play(o, 15, DateTimeOffset.UtcNow);
        game.Play(x, 1, DateTimeOffset.UtcNow);
        game.Play(o, 16, DateTimeOffset.UtcNow);
        game.Play(x, 2, DateTimeOffset.UtcNow);
        game.Play(o, 17, DateTimeOffset.UtcNow);
        game.Play(x, 3, DateTimeOffset.UtcNow);
        game.Play(o, 18, DateTimeOffset.UtcNow);
        game.Play(x, 4, DateTimeOffset.UtcNow);

        Assert.Equal(CaroGameStatus.Won, game.Status);
        Assert.Equal(x, game.WinnerUserId);
        Assert.NotEqual(initialVersion, game.Version);
        Assert.Throws<InvalidOperationException>(() => game.Play(o, 19, DateTimeOffset.UtcNow));
    }

    [Fact]
    public void Play_detects_a_draw()
    {
        var x = Guid.NewGuid();
        var o = Guid.NewGuid();
        var game = CaroGame.Create(Guid.NewGuid(), x, o, DateTimeOffset.UtcNow, 3, 3);
        var moves = new[] { (x, 0), (o, 1), (x, 2), (o, 4), (x, 3), (o, 5), (x, 7), (o, 6), (x, 8) };

        foreach (var (player, cell) in moves) game.Play(player, cell, DateTimeOffset.UtcNow);

        Assert.Equal(CaroGameStatus.Draw, game.Status);
        Assert.Null(game.WinnerUserId);
    }

    [Fact]
    public void Play_detects_a_five_mark_diagonal_from_the_last_move()
    {
        var x = Guid.NewGuid();
        var o = Guid.NewGuid();
        var game = CaroGame.Create(Guid.NewGuid(), x, o, DateTimeOffset.UtcNow);
        var moves = new[]
        {
            (x, 0), (o, 1), (x, 16), (o, 2), (x, 32), (o, 3), (x, 48), (o, 5), (x, 64)
        };

        foreach (var (player, cell) in moves) game.Play(player, cell, DateTimeOffset.UtcNow);

        Assert.Equal(CaroGameStatus.Won, game.Status);
        Assert.Equal(x, game.WinnerUserId);
    }
}
