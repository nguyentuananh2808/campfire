import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadingVoiceService } from './reading-voice.service';

class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(readonly text: string) {}
}

describe('ReadingVoiceService', () => {
  const speak = vi.fn();
  const resume = vi.fn();
  const cancel = vi.fn();
  const addEventListener = vi.fn();
  const getVoices = vi.fn(() => []);

  beforeEach(() => {
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { speak, resume, cancel, addEventListener, getVoices },
    });
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    speak.mockReset();
    resume.mockReset();
    cancel.mockReset();
    addEventListener.mockReset();
    getVoices.mockReset();
    getVoices.mockReturnValue([]);
  });

  it('starts Mandarin playback directly from the user action without resuming an idle queue', () => {
    const service = TestBed.inject(ReadingVoiceService);

    service.speak('你好。', '', 0.9);

    expect(speak).toHaveBeenCalledOnce();
    expect(resume).not.toHaveBeenCalled();
    const utterance = speak.mock.calls[0][0] as FakeUtterance;
    expect(utterance.text).toBe('你好。');
    expect(utterance.lang).toBe('zh-CN');
    expect(utterance.volume).toBe(1);
  });

  it('shows an actionable message when the device has no Mandarin voice', () => {
    const service = TestBed.inject(ReadingVoiceService);
    service.speak('你好。', '', 0.9);
    const utterance = speak.mock.calls[0][0] as FakeUtterance;

    utterance.onerror?.({ error: 'voice-unavailable' });

    expect(service.error()).toContain('chưa cài giọng tiếng Trung');
    expect(service.speaking()).toBe(false);
  });
});
