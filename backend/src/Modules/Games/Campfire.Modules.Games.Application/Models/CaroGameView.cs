namespace Campfire.Modules.Games.Application.Models;

public sealed record CaroGameView(
    Guid Id,
    Guid GroupId,
    Guid XPlayerUserId,
    string XPlayerDisplayName,
    Guid OPlayerUserId,
    string OPlayerDisplayName,
    Guid CurrentPlayerUserId,
    Guid? WinnerUserId,
    int BoardSize,
    int WinLength,
    string Board,
    string Status,
    Guid Version,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset UpdatedAtUtc);
