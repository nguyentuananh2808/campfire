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

  startListening(): void {
    const Constructor = this.recognitionConstructor();
    if (!Constructor || this.listening()) return;
    this.error.set('');
    this.transcript.set('');
    const recognition = new Constructor();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => this.transcript.set(event.results[0]?.[0]?.transcript ?? '');
    recognition.onerror = (event) =>
      this.error.set(
        event.error === 'not-allowed'
          ? 'Bạn chưa cấp quyền microphone.'
          : 'Không thể nhận giọng nói.',
      );
    recognition.onend = () => this.listening.set(false);
    this.listening.set(true);
    recognition.start();
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
