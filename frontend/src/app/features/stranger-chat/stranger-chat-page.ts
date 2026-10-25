import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
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
  StrangerReaction,
} from '../../core/stranger-chat/stranger-chat.models';
import { ChatSticker } from '../../core/chat/chat-sticker';
import { CHAT_STICKERS } from '../../core/chat/chat-stickers';
import { LongPressDirective } from '../../shared/long-press/long-press.directive';
import { MessageActions } from '../../shared/message-actions/message-actions';

@Component({
  selector: 'app-stranger-chat-page',
  imports: [DatePipe, FormsModule, LongPressDirective, MessageActions, RouterLink],
  templateUrl: './stranger-chat-page.html',
  styleUrl: './stranger-chat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrangerChatPage {
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageViewport') private messageViewport?: ElementRef<HTMLElement>;
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
  readonly openPicker = signal<'emoji' | 'sticker' | null>(null);
  readonly replyingTo = signal<StrangerMessage | null>(null);
  readonly openActionsFor = signal<string | null>(null);
  readonly stickers = CHAT_STICKERS;
  readonly emojis = ['😀', '😂', '🥰', '😎', '🥳', '😭', '😡', '👍', '❤️', '🔥', '🎉', '✨'];
  readonly reactions: ReadonlyArray<{ code: StrangerReaction; emoji: string; label: string }> = [
    { code: 'Like', emoji: '👍', label: 'Thích' },
    { code: 'Love', emoji: '❤️', label: 'Yêu thích' },
    { code: 'Laugh', emoji: '😂', label: 'Haha' },
    { code: 'Wow', emoji: '😮', label: 'Bất ngờ' },
    { code: 'Sad', emoji: '😢', label: 'Buồn' },
  ];
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
    this.queueMessage('Text', text);
    this.message = '';
    this.openPicker.set(null);
  }
  sendSticker(code: string) {
    if (!this.stickers.some((sticker) => sticker.code === code)) return;
    this.queueMessage('Sticker', code);
    this.openPicker.set(null);
  }
  private queueMessage(kind: 'Text' | 'Sticker', content: string) {
    const c = this.conversation();
    if (!c) return;
    const clientMessageId = createClientUuid();
    const replyTarget = this.replyingTo();
    const pending: StrangerMessage = {
      id: clientMessageId,
      conversationId: c.id,
      clientMessageId,
      kind,
      content,
      sentAtUtc: new Date().toISOString(),
      isMine: true,
      replyTo: replyTarget
        ? {
            messageId: replyTarget.id,
            isMine: replyTarget.isMine,
            kind: replyTarget.kind,
            content: replyTarget.content.slice(0, 160),
          }
        : null,
      reactions: [],
      myReaction: null,
      state: 'pending',
    };
    this.messages.update((x) => [...x, pending]);
    this.replyingTo.set(null);
    this.scrollToLatest();
    this.api
      .send(c.id, clientMessageId, kind, content, pending.replyTo?.messageId ?? null)
      .subscribe({
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
    this.api
      .send(c.id, m.clientMessageId, m.kind, m.content, m.replyTo?.messageId ?? null)
      .subscribe({
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
  reply(message: StrangerMessage) {
    if (message.state !== 'sent') return;
    this.openActionsFor.set(null);
    this.replyingTo.set(message);
    queueMicrotask(() => this.messageInput?.nativeElement.focus());
  }
  cancelReply() {
    this.replyingTo.set(null);
  }
  togglePicker(picker: 'emoji' | 'sticker') {
    this.openPicker.update((current) => (current === picker ? null : picker));
  }
  insertEmoji(emoji: string) {
    const input = this.messageInput?.nativeElement;
    const start = input?.selectionStart ?? this.message.length;
    const end = input?.selectionEnd ?? this.message.length;
    const next = `${this.message.slice(0, start)}${emoji}${this.message.slice(end)}`;
    if (next.length > 1000) return;
    this.message = next;
    queueMicrotask(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }
  stickerFor(code: string): ChatSticker | undefined {
    return this.stickers.find((sticker) => sticker.code === code);
  }
  react(message: StrangerMessage, reaction: StrangerReaction) {
    const conversation = this.conversation();
    if (!conversation || message.state !== 'sent') return;
    const next = message.myReaction === reaction ? null : reaction;
    this.api.setReaction(conversation.id, message.id, next).subscribe({
      next: (saved) => this.replaceMessage({ ...saved, state: 'sent' }),
      error: (error) => this.fail(error),
    });
  }
  reactionEmoji(reaction: StrangerReaction): string {
    return this.reactions.find((item) => item.code === reaction)?.emoji ?? '•';
  }
  setMessageActions(messageId: string, open: boolean) {
    this.openActionsFor.set(open ? messageId : null);
  }
  onComposerEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey || keyboardEvent.isComposing) return;
    keyboardEvent.preventDefault();
    this.send();
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
        const previousLastId = this.messages()
          .filter((item) => item.state === 'sent')
          .at(-1)?.id;
        const pending = this.messages().filter(
          (x) => x.state === 'pending' || x.state === 'failed',
        );
        const ids = new Set(p.items.map((x) => x.clientMessageId));
        this.messages.set([
          ...p.items.map((x) => ({ ...x, state: 'sent' as const })),
          ...pending.filter((x) => !ids.has(x.clientMessageId)),
        ]);
        const latestId = p.items.at(-1)?.id;
        if (latestId && latestId !== previousLastId) this.scrollToLatest();
      },
      error: () => {},
    });
  }

  private replaceMessage(message: StrangerMessage): void {
    this.messages.update((items) =>
      items.map((item) =>
        item.id === message.id || item.clientMessageId === message.clientMessageId ? message : item,
      ),
    );
  }

  private scrollToLatest(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const viewport = this.messageViewport?.nativeElement;
        if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }),
    );
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
