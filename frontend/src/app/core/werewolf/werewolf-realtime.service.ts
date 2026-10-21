import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

export type WerewolfRealtimeState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class WerewolfRealtimeService {
  private connection?: HubConnection;
  private roomId?: string;
  async connect(
    roomId: string,
    changed: () => void,
    voiceChanged: () => void,
    state: (value: WerewolfRealtimeState) => void,
  ): Promise<void> {
    await this.stop();
    this.roomId = roomId;
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/werewolf')
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();
    this.connection = connection;
    connection.on('RoomChanged', changed);
    connection.on('VoicePermissionsChanged', voiceChanged);
    connection.onreconnecting(() => state('reconnecting'));
    connection.onreconnected(async () => {
      if (this.roomId) await connection.invoke('Subscribe', this.roomId);
      state('connected');
      changed();
    });
    connection.onclose(() => state('disconnected'));
    state('connecting');
    await connection.start();
    if (this.connection === connection && this.roomId) {
      await connection.invoke('Subscribe', this.roomId);
      state('connected');
    }
  }
  async stop(): Promise<void> {
    const connection = this.connection;
    this.connection = undefined;
    this.roomId = undefined;
    if (connection) await connection.stop();
  }
}
