import { Injectable, signal } from '@angular/core';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly speaking = signal(false);
  readonly listening = signal(false);
  readonly transcript = signal('');
  readonly error = signal('');
  readonly target = signal('');
  readonly score = signal<number | null>(null);
  private recognition: SpeechRecognitionLike | null = null;

  get canSpeak(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  get canListen(): boolean {
    return typeof window !== 'undefined' && this.recognitionConstructor() !== null;
  }

  speak(text: string, lang = 'zh-CN'): void {
    if (!this.canSpeak || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = 0.82;
    utterance.onstart = () => this.speaking.set(true);
    utterance.onend = () => this.speaking.set(false);
    utterance.onerror = () => this.speaking.set(false);
    window.speechSynthesis.speak(utterance);
  }

  startListening(target = ''): void {
    const Constructor = this.recognitionConstructor();
    if (this.listening()) return;
    this.error.set('');
    this.transcript.set('');
    this.target.set(target);
    this.score.set(null);
    if (!Constructor) {
      this.error.set('Trình duyệt này chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.');
      return;
    }
    const recognition = new Constructor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      this.transcript.set(transcript);
      this.score.set(this.similarity(target, transcript));
    };
    recognition.onerror = (event) =>
      this.error.set(
        event.error === 'not-allowed'
          ? 'Bạn chưa cấp quyền microphone.'
          : 'Không thể nhận giọng nói.',
      );
    recognition.onend = () => this.listening.set(false);
    this.recognition = recognition;
    this.listening.set(true);
    recognition.start();
  }

  stopListening(): void {
    this.recognition?.stop();
    this.listening.set(false);
  }

  clear(): void {
    this.stopListening();
    this.transcript.set('');
    this.target.set('');
    this.score.set(null);
    this.error.set('');
  }

  private similarity(expected: string, actual: string): number {
    const left = [...expected.trim().toLowerCase()];
    const right = [...actual.trim().toLowerCase()];
    if (!left.length || !right.length) return 0;
    const distance = Array.from({ length: left.length + 1 }, (_, row) =>
      Array.from({ length: right.length + 1 }, (_, column) =>
        row === 0 ? column : column === 0 ? row : 0,
      ),
    );
    for (let row = 1; row <= left.length; row++) {
      for (let column = 1; column <= right.length; column++) {
        distance[row][column] = Math.min(
          distance[row - 1][column] + 1,
          distance[row][column - 1] + 1,
          distance[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1),
        );
      }
    }
    return Math.max(
      0,
      Math.round(
        (1 - distance[left.length][right.length] / Math.max(left.length, right.length)) * 100,
      ),
    );
  }

  private recognitionConstructor(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const candidate = (
      window as Window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).SpeechRecognition;
    return (
      candidate ??
      (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .webkitSpeechRecognition ??
      null
    );
  }
}
