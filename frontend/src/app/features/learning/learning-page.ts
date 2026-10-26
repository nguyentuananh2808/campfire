import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import {
  ActivityContent,
  ExerciseQuestion,
  LearningActivity,
  LearningCapabilities,
  LearningDayDetail,
  LearningPath,
  VocabularyMindMap,
} from '../../core/learning/learning.models';
import { LearningService } from '../../core/learning/learning.service';

@Component({
  selector: 'app-learning-page',
  imports: [FormsModule],
  templateUrl: './learning-page.html',
  styleUrl: './learning-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPage implements OnInit {
  private readonly api = inject(LearningService);
  readonly mode = signal<'path' | 'mindmap'>('path');
  readonly loading = signal(true);
  readonly pending = signal<string | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly path = signal<LearningPath | null>(null);
  readonly day = signal<LearningDayDetail | null>(null);
  readonly capabilities = signal<LearningCapabilities | null>(null);
  readonly mindMap = signal<VocabularyMindMap | null>(null);
  readonly selectedNode = signal<string | null>(null);
  readonly answers = signal<Record<string, string>>({});
  word = '学生';

  ngOnInit(): void {
    this.load();
  }
  setMode(mode: 'path' | 'mindmap'): void {
    this.mode.set(mode);
    this.error.set('');
  }
  openDay(id: string): void {
    this.pending.set(id);
    this.error.set('');
    this.api
      .day(id)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: (day) => {
          this.day.set(day);
          this.answers.set({});
        },
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  content(activity: LearningActivity): ActivityContent {
    try {
      return JSON.parse(activity.contentJson) as ActivityContent;
    } catch {
      return {};
    }
  }
  setAnswer(question: ExerciseQuestion, value: string): void {
    this.answers.update((current) => ({ ...current, [question.id]: value }));
  }
  complete(activity: LearningActivity): void {
    this.pending.set(activity.id);
    this.notice.set('');
    this.error.set('');
    this.api
      .complete(activity.id)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: (result) => this.applyCompletion(result.day, result.xpAwarded),
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  submit(activity: LearningActivity): void {
    const questions = this.content(activity).questions ?? [];
    const payload = questions
      .filter((q) => this.answers()[q.id])
      .map((q) => ({ questionId: q.id, value: this.answers()[q.id] }));
    this.pending.set(activity.id);
    this.error.set('');
    this.api
      .submit(activity.id, payload)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: (result) => {
          this.notice.set(
            `Bạn đạt ${result.score}/100 · đúng ${result.correct}/${result.total} câu.`,
          );
          this.applyCompletion(result.completion.day, result.completion.xpAwarded);
        },
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  createMindMap(): void {
    const word = this.word.trim();
    if (!word) return;
    this.pending.set('mindmap');
    this.error.set('');
    this.mindMap.set(null);
    this.api
      .mindMap(word)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: (map) => {
          this.mindMap.set(map);
          this.selectedNode.set(map.root.id);
        },
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  selectNode(id: string): void {
    this.selectedNode.set(id);
  }
  selectedMindMapNode() {
    const map = this.mindMap();
    return map
      ? ([map.root, ...map.children].find((node) => node.id === this.selectedNode()) ?? map.root)
      : null;
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      path: this.api.path(),
      today: this.api.today(),
      capabilities: this.api.capabilities(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ path, today, capabilities }) => {
          this.path.set(path);
          this.day.set(today.currentDay);
          this.capabilities.set(capabilities);
        },
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  private applyCompletion(day: LearningDayDetail, xp: number): void {
    this.day.set(day);
    this.notice.set(
      xp > 0 ? `Hoàn thành ngày học! +${xp} XP và đã mở bài tiếp theo.` : 'Tiến độ đã được lưu.',
    );
    this.api.path().subscribe((path) => this.path.set(path));
  }
}
