import { Injectable, signal } from '@angular/core';

export interface MandarinVoice {
  name: string;
  lang: string;
  localService: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReadingVoiceService {
  readonly voices = signal<MandarinVoice[]>([]);
  readonly speaking = signal(false);
  readonly paused = signal(false);
  readonly error = signal('');
  readonly activeVoice = signal('');
  private queue: string[] = [];
  private voiceName = '';
  private rate = 0.9;

  constructor() {
    if (!this.supported) return;
    this.refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => this.refreshVoices());
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, voiceName: string, rate: number): void {
    this.stop();
    this.error.set('');
    if (!this.supported) {
      this.error.set(
        'Trình duyệt này không hỗ trợ đọc văn bản. Hãy dùng Chrome, Edge hoặc Safari mới.',
      );
      return;
    }
    this.voiceName = voiceName;
    this.rate = Math.min(1.3, Math.max(0.6, rate));
    this.queue = this.split(text);
    if (!this.queue.length) {
      this.error.set('Hãy nhập văn bản tiếng Trung trước khi phát.');
      return;
    }
    this.speaking.set(true);
    this.speakNext();
  }

  togglePause(): void {
    if (!this.supported || !this.speaking()) return;
    if (this.paused()) {
      window.speechSynthesis.resume();
      this.paused.set(false);
    } else {
      window.speechSynthesis.pause();
      this.paused.set(true);
    }
  }

  stop(): void {
    if (this.supported) window.speechSynthesis.cancel();
    this.queue = [];
    this.speaking.set(false);
    this.paused.set(false);
  }

  private speakNext(): void {
    const text = this.queue.shift();
    if (!text) {
      this.speaking.set(false);
      this.paused.set(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const selected = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.name === this.voiceName);
    if (selected) utterance.voice = selected;
    utterance.lang = selected?.lang ?? 'zh-CN';
    utterance.rate = this.rate;
    this.activeVoice.set(selected?.name ?? 'Giọng mặc định của trình duyệt (zh-CN)');
    utterance.onend = () => this.speakNext();
    utterance.onerror = () => {
      this.queue = [];
      this.speaking.set(false);
      this.paused.set(false);
      this.error.set('Không thể phát giọng đọc trên thiết bị này.');
    };
    window.speechSynthesis.speak(utterance);
  }

  private refreshVoices(): void {
    const voices = window.speechSynthesis
      .getVoices()
      .filter((voice) => /^zh([_-]|$)/i.test(voice.lang))
      .map((voice) => ({ name: voice.name, lang: voice.lang, localService: voice.localService }));
    this.voices.set(voices);
  }

  private split(text: string): string[] {
    const segments = text.trim().split(/(?<=[。！？!?；;\n])/u);
    const chunks: string[] = [];
    for (const segment of segments) {
      const value = segment.trim();
      for (let index = 0; index < value.length; index += 180) {
        const chunk = value.slice(index, index + 180).trim();
        if (chunk) chunks.push(chunk);
      }
    }
    return chunks;
  }
}
