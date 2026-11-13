import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, type ActionPerformed } from '@capacitor/local-notifications';
import { DeviceUnlock } from './device-unlock-plugin';
import { ActivityContent, LearningDayDetail, VocabularyItem } from './learning.models';
import { LockScreenVocabularyState } from './lock-screen-vocabulary-state';

const STORAGE_KEY = 'campfire:learning:lock-screen-vocabulary:v1';
const ENABLED_KEY = 'campfire:learning:lock-screen-vocabulary:enabled';
const CHANNEL_ID = 'learning-vocabulary';
const NOTIFICATION_ID = 61001;
const MAX_WORDS = 100;
const ROTATION_DEBOUNCE_MS = 5_000;

@Injectable({ providedIn: 'root' })
export class LockScreenVocabularyService {
  private readonly router = inject(Router);
  private readonly state = signal<LockScreenVocabularyState>(this.readState());
  private initialized = false;
  private lastRotationAt = 0;

  readonly supported = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  readonly enabled = signal(this.supported && localStorage.getItem(ENABLED_KEY) === 'true');
  readonly permissionDenied = signal(false);
  readonly wordCount = computed(() => this.state().words.length);

  async initialize(): Promise<void> {
    if (!this.supported || this.initialized) return;
    this.initialized = true;
    await DeviceUnlock.addListener('deviceUnlocked', () => this.rotate());
    await App.addListener('resume', () => this.rotate());
    await LocalNotifications.addListener('localNotificationActionPerformed', (action) =>
      this.openLearning(action),
    );
    if (this.enabled()) {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'granted') {
        await this.ensureChannel();
        await this.showCurrent();
      } else {
        this.enabled.set(false);
        localStorage.removeItem(ENABLED_KEY);
      }
    }
  }

  rememberDay(day: LearningDayDetail): void {
    const incoming = day.activities
      .filter((activity) => activity.type === 'VOCABULARY')
      .flatMap((activity) => this.parseVocabulary(activity.contentJson));
    if (!incoming.length) return;

    const unique = new Map<string, VocabularyItem>();
    for (const word of [...this.state().words, ...incoming]) {
      unique.set(word.chinese.trim(), {
        chinese: word.chinese.trim(),
        pinyin: word.pinyin.trim(),
        meaningVi: word.meaningVi.trim(),
      });
    }
    const words = [...unique.values()].slice(-MAX_WORDS);
    this.saveState({ words, nextIndex: Math.min(this.state().nextIndex, words.length - 1) });
    if (this.enabled()) void this.showCurrent();
  }

  async enable(): Promise<boolean> {
    if (!this.supported || !this.wordCount()) return false;
    const current = await LocalNotifications.checkPermissions();
    const permission =
      current.display === 'granted'
        ? current
        : current.display === 'denied'
          ? current
          : await LocalNotifications.requestPermissions();
    if (permission.display !== 'granted') {
      this.permissionDenied.set(true);
      return false;
    }

    this.permissionDenied.set(false);
    await this.ensureChannel();
    localStorage.setItem(ENABLED_KEY, 'true');
    this.enabled.set(true);
    await this.showCurrent();
    return true;
  }

  async disable(): Promise<void> {
    localStorage.removeItem(ENABLED_KEY);
    this.enabled.set(false);
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });
    await LocalNotifications.removeDeliveredNotificationsById({ ids: [NOTIFICATION_ID] });
  }

  private async ensureChannel(): Promise<void> {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'Ôn từ trên màn hình khóa',
      description: 'Hiển thị từ tiếng Trung đã học để ôn nhanh.',
      importance: 2,
      visibility: 1,
      vibration: false,
      lights: false,
    });
  }

  private async rotate(): Promise<void> {
    if (!this.enabled() || !this.wordCount()) return;
    const now = Date.now();
    if (now - this.lastRotationAt < ROTATION_DEBOUNCE_MS) return;
    this.lastRotationAt = now;
    const current = this.state();
    this.saveState({
      words: current.words,
      nextIndex: (current.nextIndex + 1) % current.words.length,
    });
    await this.showCurrent();
  }

  private async showCurrent(): Promise<void> {
    const current = this.state();
    if (!current.words.length) return;
    const word = current.words[current.nextIndex % current.words.length];
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID,
          title: `${word.chinese} · ${word.pinyin}`,
          body: `${word.meaningVi} — Chạm để mở Học quanh lửa`,
          channelId: CHANNEL_ID,
          smallIcon: 'ic_stat_campfire',
          iconColor: '#ff9f43',
          ongoing: true,
          autoCancel: false,
          foreground: false,
          extra: { route: '/learning', vocabularyReview: true },
        },
      ],
    });
  }

  private openLearning(action: ActionPerformed): void {
    if (action.notification.extra?.['vocabularyReview'] !== true) return;
    void this.router.navigateByUrl('/learning');
  }

  private parseVocabulary(contentJson: string): VocabularyItem[] {
    try {
      const content = JSON.parse(contentJson) as ActivityContent;
      return (content.items ?? []).filter(
        (item): item is VocabularyItem =>
          'meaningVi' in item &&
          typeof item.chinese === 'string' &&
          typeof item.pinyin === 'string' &&
          typeof item.meaningVi === 'string' &&
          item.chinese.trim().length > 0,
      );
    } catch {
      return [];
    }
  }

  private readState(): LockScreenVocabularyState {
    try {
      const parsed = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '',
      ) as LockScreenVocabularyState;
      if (!Array.isArray(parsed.words)) throw new Error('Invalid vocabulary state');
      return {
        words: parsed.words.slice(-MAX_WORDS),
        nextIndex: Number.isInteger(parsed.nextIndex) ? parsed.nextIndex : 0,
      };
    } catch {
      return { words: [], nextIndex: 0 };
    }
  }

  private saveState(state: LockScreenVocabularyState): void {
    this.state.set(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
