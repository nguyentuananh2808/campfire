import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval, switchMap } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { CaroGame } from '../../core/games/caro-game';
import { GamesService } from '../../core/games/games.service';
import { GroupMember } from '../../core/groups/group-member';
import { GroupSummary } from '../../core/groups/group-summary';
import { GroupsService } from '../../core/groups/groups.service';

@Component({
  selector: 'app-games-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './games-page.html',
  styleUrl: './games-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesPage {
  private readonly gamesApi = inject(GamesService);
  private readonly groupsApi = inject(GroupsService);
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly games = signal<CaroGame[]>([]);
  readonly groups = signal<GroupSummary[]>([]);
  readonly members = signal<GroupMember[]>([]);
  readonly activeGame = signal<CaroGame | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  selectedGroupId = '';
  selectedOpponentId = '';

  constructor() {
    this.loadInitial();
    interval(2500)
      .pipe(
        switchMap(() => this.gamesApi.list()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: (games) => this.reconcile(games), error: () => undefined });
  }

  selectGroup(): void {
    this.selectedOpponentId = '';
    this.members.set([]);
    if (!this.selectedGroupId) return;
    this.groupsApi.getMembers(this.selectedGroupId).subscribe({
      next: (members) =>
        this.members.set(members.filter((member) => member.userId !== this.auth.user()?.id)),
      error: (error) => this.fail(error),
    });
  }

  createGame(): void {
    if (!this.selectedGroupId || !this.selectedOpponentId || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.gamesApi.create(this.selectedGroupId, this.selectedOpponentId).subscribe({
      next: (game) => {
        this.busy.set(false);
        this.activeGame.set(game);
        this.games.update((items) => [game, ...items]);
      },
      error: (error) => this.fail(error),
    });
  }

  open(game: CaroGame): void {
    this.activeGame.set(game);
    this.error.set('');
  }

  play(cell: number): void {
    const game = this.activeGame();
    if (!game || !this.canPlay(game, cell) || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.gamesApi.play(game.id, cell, game.version).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.activeGame.set(updated);
        this.replace(updated);
      },
      error: (error) => {
        this.fail(error);
        if (error instanceof HttpErrorResponse && error.status === 409) this.refreshActive();
      },
    });
  }

  canPlay(game: CaroGame, cell: number): boolean {
    return (
      game.status === 'Active' &&
      game.currentPlayerUserId === this.auth.user()?.id &&
      game.board[cell] === '-'
    );
  }

  mark(game: CaroGame, cell: number): string {
    return game.board[cell] === '-' ? '' : game.board[cell];
  }

  status(game: CaroGame): string {
    const userId = this.auth.user()?.id;
    if (game.status === 'Draw') return 'Hòa — một ván rất cân sức.';
    if (game.status === 'Won')
      return game.winnerUserId === userId ? 'Bạn đã thắng!' : 'Đối thủ đã thắng.';
    return game.currentPlayerUserId === userId ? 'Đến lượt bạn' : 'Đang chờ đối thủ';
  }

  opponent(game: CaroGame): string {
    return game.xPlayerUserId === this.auth.user()?.id
      ? game.oPlayerDisplayName
      : game.xPlayerDisplayName;
  }

  private loadInitial(): void {
    this.groupsApi.getMine().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.selectedGroupId = groups[0]?.id ?? '';
        if (this.selectedGroupId) this.selectGroup();
      },
      error: (error) => this.fail(error),
    });
    this.gamesApi.list().subscribe({
      next: (games) => {
        this.loading.set(false);
        this.games.set(games);
        this.activeGame.set(games.find((game) => game.status === 'Active') ?? games[0] ?? null);
      },
      error: (error) => this.fail(error),
    });
  }

  private refreshActive(): void {
    const gameId = this.activeGame()?.id;
    if (!gameId) return;
    this.gamesApi.get(gameId).subscribe({
      next: (game) => {
        this.activeGame.set(game);
        this.replace(game);
      },
      error: () => undefined,
    });
  }

  private reconcile(games: CaroGame[]): void {
    this.games.set(games);
    const activeId = this.activeGame()?.id;
    if (activeId) {
      const updated = games.find((game) => game.id === activeId);
      if (updated) this.activeGame.set(updated);
    }
  }

  private replace(game: CaroGame): void {
    this.games.update((items) => items.map((item) => (item.id === game.id ? game : item)));
  }

  private fail(error: unknown): void {
    this.loading.set(false);
    this.busy.set(false);
    this.error.set(
      error instanceof HttpErrorResponse
        ? (error.error?.detail ?? error.error?.title ?? 'Không thể tải trò chơi.')
        : 'Không thể tải trò chơi.',
    );
  }
}
