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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import { ChatConnectionState, ChatRealtimeService } from '../../core/chat/chat-realtime.service';
import { ChatMessage } from '../../core/chat/chat-message';
import { ChatMessageKind } from '../../core/chat/chat-message-kind';
import { ChatReaction } from '../../core/chat/chat-reaction-summary';
import { ChatService } from '../../core/chat/chat.service';
import { ChatSticker } from '../../core/chat/chat-sticker';
import { CHAT_STICKERS } from '../../core/chat/chat-stickers';
import { ChatViewMessage } from '../../core/chat/chat-view-message';
import { GroupSummary } from '../../core/groups/group-summary';
import { GroupsService } from '../../core/groups/groups.service';
import { createClientUuid } from '../../core/ids/client-uuid';
import { LongPressDirective } from '../../shared/long-press/long-press.directive';
import { MessageActions } from '../../shared/message-actions/message-actions';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LongPressDirective, MessageActions, ReactiveFormsModule, RouterLink],
  selector: 'app-chat-page',
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.scss',
})
export class ChatPage {
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageViewport') private messageViewport?: ElementRef<HTMLElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupsService = inject(GroupsService);
  private readonly chatService = inject(ChatService);
  private readonly realtime = inject(ChatRealtimeService);
  readonly auth = inject(AuthStore);
  readonly groups = signal<GroupSummary[]>([]);
  readonly selectedGroup = signal<GroupSummary | null>(null);
  readonly messages = signal<ChatViewMessage[]>([]);
  readonly loading = signal(true);
  readonly loadingOlder = signal(false);
  readonly error = signal<string | null>(null);
  readonly connectionState = signal<ChatConnectionState>('disconnected');
  readonly olderCursor = signal<string | null>(null);
  readonly openPicker = signal<'emoji' | 'sticker' | null>(null);
  readonly replyingTo = signal<ChatViewMessage | null>(null);
  readonly openActionsFor = signal<string | null>(null);
  readonly emojis = ['😀', '😂', '🥰', '😎', '🥳', '😭', '😡', '👍', '❤️', '🔥', '🎉', '✨'];
  readonly stickers = CHAT_STICKERS;
  readonly reactions: ReadonlyArray<{ code: ChatReaction; emoji: string; label: string }> = [
    { code: 'Like', emoji: '👍', label: 'Thích' },
    { code: 'Love', emoji: '❤️', label: 'Yêu thích' },
    { code: 'Laugh', emoji: '😂', label: 'Haha' },
    { code: 'Wow', emoji: '😮', label: 'Bất ngờ' },
    { code: 'Sad', emoji: '😢', label: 'Buồn' },
  ];
  private readonly latestCursor = signal<string | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)]],
  });

  constructor() {
    this.destroyRef.onDestroy(() => void this.realtime.stop());
    this.loadGroups();
  }

  selectGroup(groupId: string): void {
    const group = this.groups().find((candidate) => candidate.id === groupId);
    if (!group || group.id === this.selectedGroup()?.id) return;
    this.selectedGroup.set(group);
    this.messages.set([]);
    this.olderCursor.set(null);
    this.latestCursor.set(null);
    this.replyingTo.set(null);
    this.loadInitial(group.id);
  }

  send(): void {
    this.form.markAllAsTouched();
    const group = this.selectedGroup();
    if (!group || this.form.invalid) return;
    const content = this.form.controls.content.value;
    this.queueMessage('Text', content);
    this.form.reset();
    this.openPicker.set(null);
  }

  sendSticker(code: string): void {
    if (!this.stickers.some((sticker) => sticker.code === code)) return;
    this.queueMessage('Sticker', code);
    this.openPicker.set(null);
  }

  reply(message: ChatViewMessage): void {
    if (message.deliveryState !== 'sent') return;
    this.openActionsFor.set(null);
    this.replyingTo.set(message);
    queueMicrotask(() => this.messageInput?.nativeElement.focus());
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  react(message: ChatViewMessage, reaction: ChatReaction): void {
    const group = this.selectedGroup();
    if (!group || message.deliveryState !== 'sent') return;
    const next = message.myReaction === reaction ? null : reaction;
    this.chatService
      .setReaction(group.id, message.id, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => this.upsert({ ...saved, deliveryState: 'sent' }),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  setMessageActions(messageId: string, open: boolean): void {
    this.openActionsFor.set(open ? messageId : null);
  }

  reactionEmoji(reaction: ChatReaction): string {
    return this.reactions.find((item) => item.code === reaction)?.emoji ?? '•';
  }

  onComposerEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey || keyboardEvent.isComposing) return;
    keyboardEvent.preventDefault();
    this.send();
  }

  togglePicker(picker: 'emoji' | 'sticker'): void {
    this.openPicker.update((current) => (current === picker ? null : picker));
  }

  insertEmoji(emoji: string): void {
    const input = this.messageInput?.nativeElement;
    const current = this.form.controls.content.value;
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${emoji}${current.slice(end)}`;
    if (next.length > 2000) return;
    this.form.controls.content.setValue(next);
    this.form.controls.content.markAsTouched();
    queueMicrotask(() => {
      input?.focus();
      input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  stickerFor(code: string): ChatSticker | undefined {
    return this.stickers.find((sticker) => sticker.code === code);
  }

  private queueMessage(kind: ChatMessageKind, content: string): void {
    const group = this.selectedGroup();
    if (!group) return;
    const replyTarget = this.replyingTo();
    const clientMessageId = createClientUuid();
    const optimistic: ChatViewMessage = {
      id: clientMessageId,
      groupId: group.id,
      senderUserId: this.auth.user()?.id ?? '',
      senderDisplayName: this.auth.user()?.displayName ?? 'Bạn',
      clientMessageId,
      kind,
      content,
      sentAtUtc: new Date().toISOString(),
      replyTo: replyTarget
        ? {
            messageId: replyTarget.id,
            senderDisplayName: replyTarget.senderDisplayName,
            kind: replyTarget.kind,
            content: replyTarget.content.slice(0, 160),
          }
        : null,
      reactions: [],
      myReaction: null,
      deliveryState: 'pending',
    };
    this.replyingTo.set(null);
    this.upsert(optimistic, true);
    this.deliver(optimistic);
  }

  retry(message: ChatViewMessage): void {
    this.upsert({ ...message, deliveryState: 'pending' });
    this.deliver(message);
  }

  loadOlder(): void {
    const group = this.selectedGroup();
    const before = this.olderCursor();
    if (!group || !before || this.loadingOlder()) return;
    this.loadingOlder.set(true);
    this.chatService
      .getMessages(group.id, { before, limit: 50 })
      .pipe(
        finalize(() => this.loadingOlder.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.merge(page.items);
          this.olderCursor.set(page.olderCursor);
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private loadGroups(): void {
    this.groupsService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          if (groups[0]) {
            this.selectedGroup.set(groups[0]);
            this.loadInitial(groups[0].id);
          } else this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(getApiErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  private loadInitial(groupId: string): void {
    this.loading.set(true);
    this.error.set(null);
    void this.realtime.stop();
    this.chatService
      .getMessages(groupId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          if (this.selectedGroup()?.id !== groupId) return;
          this.merge(page.items, true);
          this.olderCursor.set(page.olderCursor);
          this.latestCursor.set(page.latestCursor);
          this.scrollToLatest();
          void this.startRealtime(groupId);
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private async startRealtime(groupId: string): Promise<void> {
    try {
      await this.realtime.connect(
        groupId,
        (message) => this.upsert({ ...message, deliveryState: 'sent' }),
        (state) => this.connectionState.set(state),
        () => this.reconcile(),
        () => this.refreshLatest(),
      );
    } catch {
      if (this.selectedGroup()?.id === groupId) this.connectionState.set('disconnected');
    }
  }

  private reconcile(): void {
    const groupId = this.selectedGroup()?.id;
    const after = this.latestCursor();
    if (!groupId) return;
    this.chatService
      .getMessages(groupId, after ? { after, limit: 100 } : { limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.merge(page.items, true);
          this.latestCursor.set(page.latestCursor);
          if (page.hasMore) this.reconcile();
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private deliver(message: ChatViewMessage): void {
    this.chatService
      .send(
        message.groupId,
        message.clientMessageId,
        message.kind,
        message.content,
        message.replyTo?.messageId ?? null,
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => this.upsert({ ...saved, deliveryState: 'sent' }),
        error: () => this.upsert({ ...message, deliveryState: 'failed' }),
      });
  }

  private refreshLatest(): void {
    const groupId = this.selectedGroup()?.id;
    if (!groupId) return;
    this.chatService
      .getMessages(groupId, { limit: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.merge(page.items);
          this.latestCursor.set(page.latestCursor);
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private merge(messages: ChatMessage[], scroll = false): void {
    messages.forEach((message) => this.upsert({ ...message, deliveryState: 'sent' }, false));
    if (scroll) this.scrollToLatest();
  }

  private upsert(message: ChatViewMessage, scroll = true): void {
    this.messages.update((current) => {
      const unique = current.filter(
        (item) => item.id !== message.id && item.clientMessageId !== message.clientMessageId,
      );
      return [...unique, message].sort(
        (left, right) =>
          left.sentAtUtc.localeCompare(right.sentAtUtc) || left.id.localeCompare(right.id),
      );
    });
    if (scroll) this.scrollToLatest();
  }

  private scrollToLatest(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const viewport = this.messageViewport?.nativeElement;
        if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }),
    );
  }
}
