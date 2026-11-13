import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/api-error';
import {
  VocabularyGameLevel,
  VocabularyGameOverview,
} from '../../../core/learning/learning.models';
import { LearningService } from '../../../core/learning/learning.service';
import { FallingVocabulary } from './falling-vocabulary';

@Component({
  selector: 'app-vocabulary-game-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './vocabulary-game-page.html',
  styleUrl: './vocabulary-game-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VocabularyGamePage implements OnInit, OnDestroy {
  private readonly api = inject(LearningService);
  private animationFrame = 0;
  private spawnTimer = 0;
  private lastFrameAt = 0;
  private nextInstanceId = 1;
  private nextWordIndex = 0;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  @ViewChild('answerInput') private answerInput?: ElementRef<HTMLInputElement>;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly overview = signal<VocabularyGameOverview | null>(null);
  readonly selectedLevel = signal<VocabularyGameLevel | null>(null);
  readonly status = signal<'idle' | 'playing' | 'paused' | 'won' | 'lost'>('idle');
  readonly falling = signal<FallingVocabulary[]>([]);
  readonly score = signal(0);
  readonly correct = signal(0);
  readonly attempts = signal(0);
  readonly lives = signal(3);
  readonly combo = signal(0);
  readonly wrongAnswer = signal(false);
  readonly progress = computed(() => {
    const target = this.selectedLevel()?.requiredHits ?? 1;
    return Math.min(100, Math.round((this.correct() / target) * 100));
  });
  answer = '';

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }

  @HostListener('window:blur')
  pauseWhenAppLosesFocus(): void {
    if (this.status() === 'playing') this.togglePause();
  }

  selectLevel(level: VocabularyGameLevel): void {
    if (!level.isUnlocked || this.status() === 'playing') return;
    this.stopTimers();
    this.selectedLevel.set(level);
    this.resetRound();
  }

  start(): void {
    const level = this.selectedLevel();
    if (!level?.isUnlocked || !level.words.length) return;
    this.resetRound();
    this.status.set('playing');
    this.spawnWord();
    this.lastFrameAt = performance.now();
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
    this.spawnTimer = window.setInterval(() => this.spawnWord(), level.spawnIntervalMs);
    window.setTimeout(() => this.answerInput?.nativeElement.focus());
  }

  togglePause(): void {
    if (this.status() === 'playing') {
      this.status.set('paused');
      this.stopTimers();
      return;
    }
    if (this.status() !== 'paused') return;
    const level = this.selectedLevel();
    if (!level) return;
    this.status.set('playing');
    this.lastFrameAt = performance.now();
    this.animationFrame = requestAnimationFrame((time) => this.tick(time));
    this.spawnTimer = window.setInterval(() => this.spawnWord(), level.spawnIntervalMs);
    this.answerInput?.nativeElement.focus();
  }

  submitAnswer(): void {
    if (this.status() !== 'playing') return;
    const answer = this.normalize(this.answer);
    if (!answer) return;
    const candidates = [...this.falling()].sort((a, b) => b.top - a.top);
    const target = candidates.find((item) => this.normalize(item.word.pinyin) === answer);
    this.attempts.update((value) => value + 1);
    this.answer = '';
    if (!target) {
      this.combo.set(0);
      this.wrongAnswer.set(true);
      window.setTimeout(() => this.wrongAnswer.set(false), 240);
      return;
    }

    this.falling.update((items) => items.filter((item) => item.instanceId !== target.instanceId));
    this.correct.update((value) => value + 1);
    this.combo.update((value) => value + 1);
    const level = this.selectedLevel()!;
    const gained = level.level * 100 + Math.round((100 - target.top) * 2) + this.combo() * 10;
    this.score.update((value) => value + gained);
    if (this.correct() >= level.requiredHits) this.finish(true);
  }

  retrySave(): void {
    if (this.status() === 'won' || this.status() === 'lost') this.saveResult();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .vocabularyGame()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (overview) => {
          const currentLevel = this.selectedLevel()?.level;
          this.overview.set(overview);
          this.selectedLevel.set(
            overview.levels.find((level) => level.level === currentLevel) ??
              overview.levels.find((level) => level.level === overview.highestUnlockedLevel) ??
              overview.levels[0] ??
              null,
          );
        },
        error: (error) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private tick(time: number): void {
    if (this.status() !== 'playing') return;
    const level = this.selectedLevel();
    if (!level) return;
    const delta = Math.min(64, time - this.lastFrameAt);
    this.lastFrameAt = time;
    const duration = level.fallDurationMs * (this.reducedMotion ? 1.35 : 1);
    const movement = (delta / duration) * 100;
    const moved = this.falling().map((item) => ({ ...item, top: item.top + movement }));
    const missed = moved.filter((item) => item.top >= 88).length;
    this.falling.set(moved.filter((item) => item.top < 88));
    if (missed) {
      this.lives.update((value) => Math.max(0, value - missed));
      this.attempts.update((value) => value + missed);
      this.combo.set(0);
      if (this.lives() === 0) {
        this.finish(false);
        return;
      }
    }
    this.animationFrame = requestAnimationFrame((next) => this.tick(next));
  }

  private spawnWord(): void {
    const level = this.selectedLevel();
    if (this.status() !== 'playing' || !level || this.falling().length >= level.maxActiveWords)
      return;
    const word = level.words[this.nextWordIndex % level.words.length];
    this.nextWordIndex++;
    this.falling.update((items) => [
      ...items,
      {
        instanceId: this.nextInstanceId++,
        word,
        top: 4,
        left: 10 + ((this.nextInstanceId * 29 + level.level * 13) % 75),
      },
    ]);
  }

  private finish(won: boolean): void {
    this.stopTimers();
    this.status.set(won ? 'won' : 'lost');
    this.saveResult();
  }

  private saveResult(): void {
    const level = this.selectedLevel();
    if (!level || this.saving() || this.attempts() === 0) return;
    this.saving.set(true);
    this.error.set('');
    this.api
      .submitVocabularyGameResult(
        level.level,
        this.score(),
        this.correct(),
        this.attempts(),
        this.lives(),
      )
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (result) => {
          this.notice.set(
            result.newlyCompleted
              ? `Hoàn thành cấp ${result.level}. Cấp tiếp theo đã được mở!`
              : 'Kết quả tốt nhất đã được cập nhật.',
          );
          this.load();
        },
        error: (error) => this.error.set(`${getApiErrorMessage(error)} Bạn có thể bấm “Lưu lại”.`),
      });
  }

  private resetRound(): void {
    this.status.set('idle');
    this.falling.set([]);
    this.score.set(0);
    this.correct.set(0);
    this.attempts.set(0);
    this.lives.set(3);
    this.combo.set(0);
    this.wrongAnswer.set(false);
    this.notice.set('');
    this.answer = '';
    this.nextWordIndex = 0;
  }

  private stopTimers(): void {
    cancelAnimationFrame(this.animationFrame);
    window.clearInterval(this.spawnTimer);
    this.animationFrame = 0;
    this.spawnTimer = 0;
  }

  private normalize(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ü/g, 'u')
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, ' ');
  }
}
