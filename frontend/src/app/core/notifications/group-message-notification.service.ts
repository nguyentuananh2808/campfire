import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../chat/chat-message';
import { GroupsService } from '../groups/groups.service';
import { TabNotificationService } from './tab-notification.service';

@Injectable({ providedIn: 'root' })
export class GroupMessageNotificationService {
  private readonly groupsService = inject(GroupsService);
  private readonly notifications = inject(TabNotificationService);
  private readonly document = inject(DOCUMENT);
  private connection?: HubConnection;
  private groupIds: string[] = [];
  private currentUserId?: string;
  private activeGroupId?: string;
  private generation = 0;

  constructor() {
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.visibilityState === 'visible' && this.activeGroupId) {
        this.markRead(this.activeGroupId);
      }
    });
  }

  async start(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.connection) return;
    await this.stop(false);
    const generation = ++this.generation;
    this.currentUserId = userId;
    try {
      this.groupIds = (await firstValueFrom(this.groupsService.getMine())).map((group) => group.id);
      if (generation !== this.generation || this.groupIds.length === 0) return;
      const { HubConnectionBuilder } = await import('@microsoft/signalr');
      const connection = new HubConnectionBuilder()
        .withUrl('/hubs/chat')
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .build();
      this.connection = connection;
      connection.on('MessageCreated', (message: ChatMessage) => this.onMessage(message));
      connection.onreconnected(() => this.subscribeAll(connection));
      await connection.start();
      if (generation !== this.generation || this.connection !== connection) {
        await connection.stop();
        return;
      }
      await this.subscribeAll(connection);
    } catch {
      if (generation === this.generation) this.connection = undefined;
    }
  }

  async stop(clearUnread = true): Promise<void> {
    this.generation += 1;
    const connection = this.connection;
    this.connection = undefined;
    this.currentUserId = undefined;
    this.groupIds = [];
    this.activeGroupId = undefined;
    if (connection) {
      try {
        await connection.stop();
      } catch {
        /* connection already stopped */
      }
    }
    if (clearUnread) this.notifications.clearGroups();
  }

  setActiveGroup(groupId?: string): void {
    this.activeGroupId = groupId;
    if (groupId && this.document.visibilityState === 'visible') {
      this.notifications.clear(`group:${groupId}`);
    }
  }

  syncGroups(groupIds: string[]): void {
    const additions = groupIds.filter((groupId) => !this.groupIds.includes(groupId));
    this.groupIds = [...new Set([...this.groupIds, ...groupIds])];
    const connection = this.connection;
    if (!connection || additions.length === 0) return;
    void Promise.all(additions.map((groupId) => connection.invoke('Subscribe', groupId))).catch(
      () => {
        /* reconnect will reconcile all current subscriptions */
      },
    );
  }

  markRead(groupId: string): void {
    this.notifications.clear(`group:${groupId}`);
  }

  private async subscribeAll(connection: HubConnection): Promise<void> {
    await Promise.all(this.groupIds.map((groupId) => connection.invoke('Subscribe', groupId)));
  }

  private onMessage(message: ChatMessage): void {
    if (message.senderUserId === this.currentUserId) return;
    const isReadingActiveGroup =
      message.groupId === this.activeGroupId && this.document.visibilityState === 'visible';
    this.notifications.announce(`group:${message.groupId}`, 1, !isReadingActiveGroup);
  }
}
