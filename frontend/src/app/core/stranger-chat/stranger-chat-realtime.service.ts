import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

@Injectable({ providedIn: 'root' })
export class StrangerChatRealtimeService {
  private connection: HubConnection | null = null;

  async connect(onChanged: () => void, onEnded: () => void): Promise<void> {
    await this.stop();
    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/stranger', { withCredentials: true })
      .withAutomaticReconnect()
      .build();
    this.connection.on('MessageCreated', onChanged);
    this.connection.on('MessageChanged', onChanged);
    this.connection.on('ConversationEnded', onEnded);
    this.connection.onreconnected(onChanged);
    await this.connection.start();
  }

  async stop(): Promise<void> {
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
    this.connection = null;
  }
}
