import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

type AudioContextConstructor = new () => AudioContext;
type AudioWindow = Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor };

@Injectable({ providedIn: 'root' })
export class TabNotificationService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly counts = signal<Record<string, number>>({});
  private readonly baseTitle = 'Campfire';
  private audioContext?: AudioContext;
  private audioUnlocked = false;

  readonly unreadCount = computed(() =>
    Object.values(this.counts()).reduce((total, count) => total + count, 0),
  );
  readonly groupUnreadCount = computed(() =>
    Object.entries(this.counts())
      .filter(([scope]) => scope.startsWith('group:'))
      .reduce((total, [, count]) => total + count, 0),
  );

  constructor() {
    if (!this.isBrowser) return;
    const unlock = () => this.unlockAudio();
    this.document.addEventListener('pointerdown', unlock, { once: true, passive: true });
    this.document.addEventListener('keydown', unlock, { once: true });
  }

  announce(scope: string, count = 1, markUnread = true): void {
    if (count <= 0) return;
    if (markUnread) {
      this.counts.update((current) => ({ ...current, [scope]: (current[scope] ?? 0) + count }));
      this.updateTitle();
    }
    this.playMessageTone();
  }

  clear(scope?: string): void {
    if (!scope) this.counts.set({});
    else {
      this.counts.update((current) => {
        if (!(scope in current)) return current;
        const next = { ...current };
        delete next[scope];
        return next;
      });
    }
    this.updateTitle();
  }

  clearGroups(): void {
    this.counts.update((current) =>
      Object.fromEntries(Object.entries(current).filter(([scope]) => !scope.startsWith('group:'))),
    );
    this.updateTitle();
  }

  isPageVisible(): boolean {
    return !this.isBrowser || this.document.visibilityState === 'visible';
  }

  private updateTitle(): void {
    if (!this.isBrowser) return;
    const count = this.unreadCount();
    this.document.title =
      count > 0 ? `(${count > 99 ? '99+' : count}) ${this.baseTitle}` : this.baseTitle;
  }

  private unlockAudio(): void {
    if (!this.isBrowser || this.audioUnlocked) return;
    const audioWindow = window as AudioWindow;
    const AudioContextType = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
    if (!AudioContextType) return;
    this.audioContext ??= new AudioContextType();
    void this.audioContext
      .resume()
      .then(() => (this.audioUnlocked = true))
      .catch(() => {
        this.audioUnlocked = false;
      });
  }

  private playMessageTone(): void {
    if (!this.isBrowser) return;
    this.unlockAudio();
    const context = this.audioContext;
    if (!context || context.state !== 'running') return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.075, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.17);
  }
}
