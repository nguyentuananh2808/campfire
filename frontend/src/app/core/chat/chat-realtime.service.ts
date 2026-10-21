import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { ChatMessage } from './chat-message';

export type ChatConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private connection?: HubConnection;
  private groupId?: string;

  async connect(
    groupId: string,
    onMessage: (message: ChatMessage) => void,
    onState: (state: ChatConnectionState) => void,
    onReconcile: () => void,
  ): Promise<void> {
    await this.stop();
    this.groupId = groupId;
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/chat')
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();
    this.connection = connection;
    connection.on('MessageCreated', onMessage);
    connection.onreconnecting(() => onState('reconnecting'));
    connection.onreconnected(async () => {
      if (!this.groupId) return;
      await connection.invoke('Subscribe', this.groupId);
      onState('connected');
      onReconcile();
    });
    connection.onclose(() => onState('disconnected'));
    onState('connecting');
    await connection.start();
    if (this.connection !== connection || !this.groupId) return;
    await connection.invoke('Subscribe', this.groupId);
    onState('connected');
  }

  async stop(): Promise<void> {
    const connection = this.connection;
    const groupId = this.groupId;
    this.connection = undefined;
    this.groupId = undefined;
    if (!connection) return;
    if (groupId && connection.state === HubConnectionState.Connected) {
      try {
        await connection.invoke('Unsubscribe', groupId);
      } catch {
        /* already closing */
      }
    }
    await connection.stop();
  }
}
