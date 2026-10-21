import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap } from 'rxjs';
import { StrangerChatService } from '../../core/stranger-chat/stranger-chat.service';
import { StrangerChatRealtimeService } from '../../core/stranger-chat/stranger-chat-realtime.service';
import { createClientUuid } from '../../core/ids/client-uuid';
import {
  GuestSession,
  GuestGender,
  GenderPreference,
  StrangerConversation,
  StrangerMessage,
} from '../../core/stranger-chat/stranger-chat.models';

@Component({
  selector: 'app-stranger-chat-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './stranger-chat-page.html',
  styleUrl: './stranger-chat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrangerChatPage {
  private readonly api = inject(StrangerChatService);
  private readonly realtime = inject(StrangerChatRealtimeService);
  private readonly destroyRef = inject(DestroyRef);
  readonly session = signal<GuestSession | null>(null);
  readonly conversation = signal<StrangerConversation | null>(null);
  readonly messages = signal<StrangerMessage[]>([]);
  readonly waiting = signal(false);
  readonly busy = signal(false);
  readonly initialized = signal(false);
  readonly safetyOpen = signal(false);
  readonly realtimeConnected = signal(false);
  readonly error = signal('');
  nickname = '';
  gender: GuestGender | '' = '';
  genderPreference: GenderPreference = 'Any';
  message = '';
  adult = false;
  constructor() {
    this.api.session().subscribe({
      next: (s) => {
        this.session.set(s);
        this.initialized.set(true);
        this.resume();
      },
      error: () => this.initialized.set(true),
    });
    interval(2500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }
  enter() {
    if (!this.adult || this.nickname.trim().length < 2 || !this.gender) return;
    this.busy.set(true);
    this.error.set('');
    this.api.createSession(this.nickname.trim(), this.gender, this.genderPreference).subscribe({
      next: (s) => {
        this.session.set(s);
        this.busy.set(false);
      },
      error: (e) => this.fail(e),
    });
  }
  preferenceLabel(preference: GenderPreference): string {
    return { Any: 'mọi giới tính', Male: 'nam', Female: 'nữ', Other: 'giới tính khác' }[preference];
  }
  find() {
    this.busy.set(true);
    this.api.queue().subscribe({
      next: (r) => {
        this.busy.set(false);
        this.waiting.set(r.status === 'waiting');
        if (r.conversation) {
          this.conversation.set(r.conversation);
          this.load();
          this.connectRealtime();
        }
      },
      error: (e) => this.fail(e),
    });
  }
  cancel() {
    this.busy.set(true);
    this.api.cancelQueue().subscribe({
      next: () => {
        this.waiting.set(false);
        this.busy.set(false);
      },
      error: (error) => this.fail(error),
    });
  }
  send() {
    const text = this.message.trim(),
      c = this.conversation();
    if (!text || !c) return;
    const clientMessageId = createClientUuid();
    const pending: StrangerMessage = {
      id: clientMessageId,
      conversationId: c.id,
      clientMessageId,
      content: text,
      sentAtUtc: new Date().toISOString(),
      isMine: true,
      state: 'pending',
    };
    this.messages.update((x) => [...x, pending]);
    this.message = '';
    this.api.send(c.id, clientMessageId, text).subscribe({
      next: (m) =>
        this.messages.update((x) =>
          x.map((y) => (y.clientMessageId === clientMessageId ? { ...m, state: 'sent' } : y)),
        ),
      error: () =>
        this.messages.update((x) =>
          x.map((y) => (y.clientMessageId === clientMessageId ? { ...y, state: 'failed' } : y)),
        ),
    });
  }
  retry(m: StrangerMessage) {
    const c = this.conversation();
    if (!c) return;
    m.state = 'pending';
    this.messages.update((x) => [...x]);
    this.api.send(c.id, m.clientMessageId, m.content).subscribe({
      next: (s) =>
        this.messages.update((x) =>
          x.map((y) => (y.clientMessageId === m.clientMessageId ? { ...s, state: 'sent' } : y)),
        ),
      error: () => {
        m.state = 'failed';
        this.messages.update((x) => [...x]);
      },
    });
  }
  end(block = false) {
    const c = this.conversation();
    if (!c) return;
    this.api.end(c.id, block).subscribe(() => {
      this.conversation.set(null);
      this.safetyOpen.set(false);
      this.realtimeConnected.set(false);
      void this.realtime.stop();
      this.messages.set([]);
      this.waiting.set(false);
    });
  }
  report() {
    const c = this.conversation();
    if (!c) return;
    this.api.report(c.id, 'other').subscribe(() => this.end(true));
  }
  leave() {
    this.api.deleteSession().subscribe(() => {
      void this.realtime.stop();
      this.session.set(null);
      this.conversation.set(null);
      this.messages.set([]);
    });
  }
  private resume() {
    this.api.conversation().subscribe({
      next: (c) => {
        this.conversation.set(c);
        this.waiting.set(false);
        this.load();
        this.connectRealtime();
      },
      error: () => {},
    });
  }
  private refresh() {
    if (this.waiting()) {
      this.api.queue().subscribe({
        next: (r) => {
          if (r.conversation) {
            this.waiting.set(false);
            this.conversation.set(r.conversation);
            this.load();
            this.connectRealtime();
          }
        },
        error: () => {},
      });
    } else if (this.conversation()) this.load();
  }
  private load() {
    const c = this.conversation();
    if (!c) return;
    this.api.messages(c.id).subscribe({
      next: (p) => {
        const pending = this.messages().filter(
          (x) => x.state === 'pending' || x.state === 'failed',
        );
        const ids = new Set(p.items.map((x) => x.clientMessageId));
        this.messages.set([
          ...p.items.map((x) => ({ ...x, state: 'sent' as const })),
          ...pending.filter((x) => !ids.has(x.clientMessageId)),
        ]);
      },
      error: () => {},
    });
  }

  private connectRealtime(): void {
    this.realtimeConnected.set(false);
    void this.realtime
      .connect(
        () => {
          this.realtimeConnected.set(true);
          this.load();
        },
        () => {
          this.realtimeConnected.set(false);
          this.conversation.set(null);
          this.messages.set([]);
        },
      )
      .then(() => this.realtimeConnected.set(true))
      .catch(() => this.realtimeConnected.set(false));
  }
  private fail(e: unknown) {
    this.busy.set(false);
    this.error.set(
      e instanceof HttpErrorResponse
        ? (e.error?.detail ?? 'Không thể kết nối máy chủ.')
        : 'Đã có lỗi xảy ra.',
    );
  }
}
