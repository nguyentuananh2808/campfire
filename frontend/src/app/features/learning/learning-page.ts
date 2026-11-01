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
import { SpeechService } from '../../core/learning/speech.service';
import { ReadingVoiceService } from '../../core/learning/reading-voice.service';

@Component({
  selector: 'app-learning-page',
  imports: [FormsModule],
  templateUrl: './learning-page.html',
  styleUrl: './learning-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningPage implements OnInit {
  private readonly api = inject(LearningService);
  readonly speech = inject(SpeechService);
  readonly reader = inject(ReadingVoiceService);
  readonly mode = signal<'path' | 'mindmap' | 'reader'>('path');
  readonly loading = signal(true);
  readonly pending = signal<string | null>(null);
  readonly error = signal('');
  readonly loadError = signal('');
  readonly notice = signal('');
  readonly path = signal<LearningPath | null>(null);
  readonly day = signal<LearningDayDetail | null>(null);
  readonly capabilities = signal<LearningCapabilities | null>(null);
  readonly mindMap = signal<VocabularyMindMap | null>(null);
  readonly selectedNode = signal<string | null>(null);
  readonly answers = signal<Record<string, string>>({});
  word = '学生';
  readingText = '';
  selectedVoice = '';
  readingRate = 0.9;
  readonly preparedCharacterCount = signal(0);
  readonly preparedChineseCount = signal(0);
  readonly preparedReadingText = signal('');

  ngOnInit(): void {
    this.load();
  }
  setMode(mode: 'path' | 'mindmap' | 'reader'): void {
    this.mode.set(mode);
    this.error.set('');
  }
  prepareReading(): void {
    const text = this.readingText.trim();
    if (!text) {
      this.error.set('Hãy nhập hoặc tải lên văn bản tiếng Trung.');
      return;
    }
    this.pending.set('reader');
    this.error.set('');
    this.api
      .prepareReadingText(text)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: (prepared) => {
          this.readingText = prepared.text;
          this.preparedReadingText.set(prepared.text);
          this.preparedCharacterCount.set(prepared.characterCount);
          this.preparedChineseCount.set(prepared.chineseCharacterCount);
          this.notice.set('Văn bản đã sẵn sàng. Bấm “Phát giọng đọc” để nghe.');
        },
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
  }
  playPreparedReading(): void {
    const text = this.preparedReadingText();
    if (!text) {
      this.error.set('Hãy chuẩn bị văn bản trước khi phát.');
      return;
    }
    this.reader.speak(text, this.selectedVoice, this.readingRate);
  }
  readingTextChanged(value: string): void {
    this.readingText = value;
    this.preparedReadingText.set('');
    this.preparedCharacterCount.set(0);
    this.preparedChineseCount.set(0);
    this.reader.stop();
  }
  async selectTextFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      this.error.set('Chỉ hỗ trợ file văn bản .txt.');
      return;
    }
    if (file.size > 100 * 1024) {
      this.error.set('File .txt tối đa 100 KiB.');
      return;
    }
    try {
      const text = await file.text();
      if (text.includes('\uFFFD')) {
        this.error.set('File có ký tự không đọc được. Hãy lưu lại ở định dạng UTF-8.');
        return;
      }
      this.readingText = text.slice(0, 10_000);
      this.preparedReadingText.set('');
      this.preparedCharacterCount.set(0);
      this.preparedChineseCount.set(0);
      this.reader.stop();
      this.error.set(text.length > 10_000 ? 'Đã lấy 10.000 ký tự đầu tiên của file.' : '');
    } catch {
      this.error.set('Không thể đọc file này. Hãy lưu file ở định dạng UTF-8.');
    }
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
    this.loadError.set('');
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
        error: (e) => this.loadError.set(getApiErrorMessage(e)),
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
