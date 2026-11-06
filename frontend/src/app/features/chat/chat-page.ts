import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import { ChatConnectionState, ChatRealtimeService } from '../../core/chat/chat-realtime.service';
import { ChatInboxItem } from '../../core/chat/chat-inbox-item';
import { ChatMessage } from '../../core/chat/chat-message';
import { ChatMessageKind } from '../../core/chat/chat-message-kind';
import { ChatReaction } from '../../core/chat/chat-reaction-summary';
import { ChatService } from '../../core/chat/chat.service';
import { ChatSticker } from '../../core/chat/chat-sticker';
import { CHAT_STICKERS } from '../../core/chat/chat-stickers';
import { ChatViewMessage } from '../../core/chat/chat-view-message';
import { optimizeChatImage } from '../../core/chat/chat-image-processor';
import { GroupSummary } from '../../core/groups/group-summary';
import { GroupsService } from '../../core/groups/groups.service';
import { createClientUuid } from '../../core/ids/client-uuid';
import { GroupMessageNotificationService } from '../../core/notifications/group-message-notification.service';
import { LongPressDirective } from '../../shared/long-press/long-press.directive';
import { MessageActions } from '../../shared/message-actions/message-actions';
import { ChatGroupConversation } from './chat-group-conversation';
import { ChatGroupList } from './chat-group-list';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ChatGroupList,
    DatePipe,
    LongPressDirective,
    MessageActions,
    ReactiveFormsModule,
    RouterLink,
  ],
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
  private readonly groupNotifications = inject(GroupMessageNotificationService);
  readonly auth = inject(AuthStore);
  readonly groups = signal<GroupSummary[]>([]);
  readonly inboxByGroup = signal<Record<string, ChatInboxItem>>({});
  readonly conversations = computed<ChatGroupConversation[]>(() =>
    this.groups()
      .map((group) => ({ group, inbox: this.inboxFor(group.id) }))
      .sort((left, right) => {
        const byActivity = (right.inbox.lastMessageAtUtc ?? '').localeCompare(
          left.inbox.lastMessageAtUtc ?? '',
        );
        return byActivity || left.group.name.localeCompare(right.group.name, 'vi');
      }),
  );
  readonly totalUnread = computed(() =>
    this.conversations().reduce((total, conversation) => total + conversation.inbox.unreadCount, 0),
  );
  readonly selectedGroup = signal<GroupSummary | null>(null);
  readonly messages = signal<ChatViewMessage[]>([]);
  readonly loading = signal(true);
  readonly loadingOlder = signal(false);
  readonly error = signal<string | null>(null);
  readonly connectionState = signal<ChatConnectionState>('disconnected');
  readonly olderCursor = signal<string | null>(null);
  readonly openPicker = signal<'emoji' | 'sticker' | null>(null);
  readonly replyingTo = signal<ChatViewMessage | null>(null);
  readonly editingMessage = signal<ChatViewMessage | null>(null);
  readonly openActionsFor = signal<string | null>(null);
  readonly showLatestButton = signal(false);
  readonly unseenCount = signal(0);
  readonly groupListOpen = signal(false);
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
  private readonly pendingImages = new Map<string, File>();
  private readonly lastMarkedMessageIds = new Map<string, string>();
  readonly form = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.maxLength(2000), Validators.pattern(/\S/)]],
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.groupNotifications.setActiveGroup(undefined);
      void this.realtime.stop();
    });
    this.groupNotifications.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => this.updateInboxFromRealtime(message));
    this.loadGroups();
  }

  @HostListener('document:keydown.escape')
  closeGroupList(): void {
    this.groupListOpen.set(false);
  }

  toggleGroupList(): void {
    this.groupListOpen.update((open) => !open);
  }

  selectGroup(groupId: string): void {
    const group = this.groups().find((candidate) => candidate.id === groupId);
    this.groupListOpen.set(false);
    if (!group || group.id === this.selectedGroup()?.id) return;
    this.selectedGroup.set(group);
    this.groupNotifications.setActiveGroup(group.id);
    this.messages.set([]);
    this.olderCursor.set(null);
    this.latestCursor.set(null);
    this.replyingTo.set(null);
    this.editingMessage.set(null);
    this.showLatestButton.set(false);
    this.unseenCount.set(0);
    this.loadInitial(group.id);
  }

  send(): void {
    this.form.markAllAsTouched();
    const group = this.selectedGroup();
    if (!group || this.form.invalid) return;
    const content = this.form.controls.content.value;
    const editing = this.editingMessage();
    if (editing) {
      this.saveEdit(group.id, editing, content);
      return;
    }
    this.queueMessage('Text', content);
    this.form.reset();
    this.openPicker.set(null);
  }

  sendSticker(code: string): void {
    if (this.editingMessage()) return;
    if (!this.stickers.some((sticker) => sticker.code === code)) return;
    this.queueMessage('Sticker', code);
    this.openPicker.set(null);
  }

  async chooseImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.editingMessage()) return;
    try {
      const image = await optimizeChatImage(file);
      this.queueImage(image);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Không thể xử lý ảnh.');
    }
  }

  private queueImage(image: File): void {
    const group = this.selectedGroup();
    if (!group) return;
    const replyTarget = this.replyingTo();
    const clientMessageId = createClientUuid();
    const previewUrl = URL.createObjectURL(image);
    const optimistic: ChatViewMessage = {
      id: clientMessageId,
      groupId: group.id,
      senderUserId: this.auth.user()?.id ?? '',
      senderDisplayName: this.auth.user()?.displayName ?? 'Bạn',
      clientMessageId,
      kind: 'Image',
      content: previewUrl,
      sentAtUtc: new Date().toISOString(),
      editedAtUtc: null,
      version: createClientUuid(),
      replyTo: replyTarget
        ? {
            messageId: replyTarget.id,
            senderDisplayName: replyTarget.senderDisplayName,
            kind: replyTarget.kind,
            content: replyTarget.kind === 'Image' ? 'Ảnh' : replyTarget.content.slice(0, 160),
          }
        : null,
      reactions: [],
      myReaction: null,
      deliveryState: 'pending',
    };
    this.pendingImages.set(clientMessageId, image);
    this.upsert(optimistic, true);
    this.deliver(optimistic);
    this.replyingTo.set(null);
  }

  reply(message: ChatViewMessage): void {
    if (message.deliveryState !== 'sent') return;
    this.openActionsFor.set(null);
    if (this.editingMessage()) this.cancelEdit();
    this.replyingTo.set(message);
    queueMicrotask(() => this.messageInput?.nativeElement.focus());
  }

  cancelReply(): void {
    this.replyingTo.set(null);
  }

  edit(message: ChatViewMessage): void {
    if (
      message.deliveryState !== 'sent' ||
      message.kind !== 'Text' ||
      message.senderUserId !== this.auth.user()?.id
    )
      return;
    this.openActionsFor.set(null);
    this.replyingTo.set(null);
    this.editingMessage.set(message);
    this.form.controls.content.setValue(message.content);
    queueMicrotask(() => {
      const input = this.messageInput?.nativeElement;
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  cancelEdit(): void {
    if (!this.editingMessage()) return;
    this.editingMessage.set(null);
    this.form.reset();
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
      editedAtUtc: null,
      version: createClientUuid(),
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
    const viewport = this.messageViewport?.nativeElement;
    const previousHeight = viewport?.scrollHeight ?? 0;
    const previousTop = viewport?.scrollTop ?? 0;
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
          requestAnimationFrame(() => {
            const current = this.messageViewport?.nativeElement;
            if (current) current.scrollTop = previousTop + current.scrollHeight - previousHeight;
          });
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  private loadGroups(): void {
    forkJoin({
      groups: this.groupsService.getMine(),
      inbox: this.chatService.getInbox().pipe(catchError(() => of([] as ChatInboxItem[]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ groups, inbox }) => {
          this.groups.set(groups);
          this.inboxByGroup.set(Object.fromEntries(inbox.map((item) => [item.groupId, item])));
          this.groupNotifications.syncGroups(groups.map((group) => group.id));
          const first = this.conversations()[0]?.group;
          if (first) {
            this.selectedGroup.set(first);
            this.groupNotifications.setActiveGroup(first.id);
            this.loadInitial(first.id);
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
    if (message.kind === 'Image') {
      const image = this.pendingImages.get(message.clientMessageId);
      if (!image) return;
      this.chatService
        .sendImage(
          message.groupId,
          message.clientMessageId,
          image,
          message.replyTo?.messageId ?? null,
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (saved) => {
            if (message.content.startsWith('blob:')) URL.revokeObjectURL(message.content);
            this.pendingImages.delete(message.clientMessageId);
            this.upsert({ ...saved, deliveryState: 'sent' });
          },
          error: () => this.upsert({ ...message, deliveryState: 'failed' }),
        });
      return;
    }
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

  private saveEdit(groupId: string, message: ChatViewMessage, content: string): void {
    this.chatService
      .edit(groupId, message.id, content, message.version)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.upsert({ ...saved, deliveryState: 'sent' }, false);
          this.editingMessage.set(null);
          this.form.reset();
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
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
    const shouldFollow =
      scroll && (message.senderUserId === this.auth.user()?.id || this.isNearBottom());
    this.messages.update((current) => {
      const unique = current.filter(
        (item) => item.id !== message.id && item.clientMessageId !== message.clientMessageId,
      );
      return [...unique, message].sort(
        (left, right) =>
          left.sentAtUtc.localeCompare(right.sentAtUtc) || left.id.localeCompare(right.id),
      );
    });
    if (shouldFollow) {
      this.scrollToLatest();
      if (message.deliveryState === 'sent') this.markRead(message.groupId, message.id);
    } else if (scroll) {
      this.unseenCount.update((count) => count + 1);
      this.showLatestButton.set(true);
    }
  }

  onViewportScroll(): void {
    this.openActionsFor.set(null);
    if (this.isNearBottom()) {
      this.showLatestButton.set(false);
      this.unseenCount.set(0);
      const groupId = this.selectedGroup()?.id;
      if (groupId) this.markVisibleLatest(groupId);
    }
  }

  jumpToLatest(): void {
    this.scrollToLatest();
  }

  private isNearBottom(): boolean {
    const viewport = this.messageViewport?.nativeElement;
    if (!viewport) return true;
    return viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 96;
  }

  private scrollToLatest(): void {
    this.showLatestButton.set(false);
    this.unseenCount.set(0);
    const groupId = this.selectedGroup()?.id;
    if (groupId) this.markVisibleLatest(groupId);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const viewport = this.messageViewport?.nativeElement;
        if (viewport) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }),
    );
  }

  private inboxFor(groupId: string): ChatInboxItem {
    return (
      this.inboxByGroup()[groupId] ?? {
        groupId,
        lastMessageId: null,
        lastMessageSenderDisplayName: null,
        lastMessageKind: null,
        lastMessagePreview: null,
        lastMessageAtUtc: null,
        unreadCount: 0,
      }
    );
  }

  private updateInboxFromRealtime(message: ChatMessage): void {
    const current = this.inboxFor(message.groupId);
    const isNewer =
      !current.lastMessageAtUtc ||
      message.sentAtUtc > current.lastMessageAtUtc ||
      (message.sentAtUtc === current.lastMessageAtUtc &&
        message.id > (current.lastMessageId ?? ''));
    if (!isNewer) return;

    const isReading = this.selectedGroup()?.id === message.groupId && this.isNearBottom();
    const unreadCount =
      message.senderUserId === this.auth.user()?.id || isReading
        ? current.unreadCount
        : current.unreadCount + 1;
    const lastMessagePreview =
      message.kind === 'Image'
        ? 'Đã gửi một ảnh'
        : message.kind === 'Sticker'
          ? 'Đã gửi một sticker'
          : message.content.length <= 80
            ? message.content
            : `${message.content.slice(0, 77)}...`;
    this.inboxByGroup.update((items) => ({
      ...items,
      [message.groupId]: {
        groupId: message.groupId,
        lastMessageId: message.id,
        lastMessageSenderDisplayName: message.senderDisplayName,
        lastMessageKind: message.kind,
        lastMessagePreview,
        lastMessageAtUtc: message.sentAtUtc,
        unreadCount,
      },
    }));
  }

  private markVisibleLatest(groupId: string): void {
    this.groupNotifications.markRead(groupId);
    const latest = [...this.messages()]
      .reverse()
      .find((message) => message.groupId === groupId && message.deliveryState === 'sent');
    if (latest) this.markRead(groupId, latest.id);
  }

  private markRead(groupId: string, messageId: string): void {
    if (this.lastMarkedMessageIds.get(groupId) === messageId) return;
    const previousUnreadCount = this.inboxFor(groupId).unreadCount;
    this.lastMarkedMessageIds.set(groupId, messageId);
    this.inboxByGroup.update((items) => {
      const current = items[groupId];
      return current ? { ...items, [groupId]: { ...current, unreadCount: 0 } } : items;
    });
    this.chatService
      .markRead(groupId, messageId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          if (this.lastMarkedMessageIds.get(groupId) !== messageId) return;
          this.lastMarkedMessageIds.delete(groupId);
          this.inboxByGroup.update((items) => {
            const current = items[groupId];
            return current
              ? {
                  ...items,
                  [groupId]: {
                    ...current,
                    unreadCount: current.unreadCount + previousUnreadCount,
                  },
                }
              : items;
          });
        },
      });
  }
}
