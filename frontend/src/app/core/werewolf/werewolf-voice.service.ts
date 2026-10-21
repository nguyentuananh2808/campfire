import { Injectable, signal } from '@angular/core';
import { ConnectionState, RemoteAudioTrack, Room, RoomEvent, Track } from 'livekit-client';
import { VoiceAccess } from './voice-access';

export type WerewolfVoiceState =
  'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'blocked' | 'error';

@Injectable({ providedIn: 'root' })
export class WerewolfVoiceService {
  readonly state = signal<WerewolfVoiceState>('disconnected');
  readonly muted = signal(true);
  readonly canPublish = signal(false);
  readonly channel = signal<string | null>(null);
  readonly speakingIds = signal<ReadonlySet<string>>(new Set());
  private room?: Room;
  private audio = new Map<string, HTMLAudioElement>();

  async connect(access: VoiceAccess): Promise<void> {
    await this.disconnect();
    this.state.set('connecting');
    const room = new Room({ adaptiveStream: true, dynacast: true });
    this.room = room;
    room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      if (track.kind !== Track.Kind.Audio) return;
      const element = (track as RemoteAudioTrack).attach();
      element.autoplay = true;
      element.dataset['participant'] = participant.identity;
      document.body.appendChild(element);
      this.audio.set(participant.identity, element);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
      track.detach().forEach((element) => element.remove());
      this.audio.delete(participant.identity);
    });
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) =>
      this.speakingIds.set(new Set(speakers.map((speaker) => speaker.identity))),
    );
    room.on(RoomEvent.ConnectionStateChanged, (value) =>
      this.state.set(
        value === ConnectionState.Connected
          ? 'connected'
          : value === ConnectionState.Reconnecting
            ? 'reconnecting'
            : value === ConnectionState.Disconnected
              ? 'disconnected'
              : 'connecting',
      ),
    );
    room.on(RoomEvent.Disconnected, () => {
      if (this.room === room) this.room = undefined;
      this.channel.set(null);
      this.canPublish.set(false);
      this.muted.set(true);
      this.cleanupAudio();
    });
    try {
      await room.connect(access.serverUrl, access.token);
      this.channel.set(access.channel);
      this.canPublish.set(access.canPublish);
      if (access.canPublish) {
        await room.localParticipant.setMicrophoneEnabled(false);
        this.muted.set(true);
      }
      this.state.set('connected');
    } catch {
      this.state.set('error');
      await this.disconnect(false);
      throw new Error('voice_connect_failed');
    }
  }

  async toggleMicrophone(): Promise<void> {
    if (!this.room || this.state() !== 'connected' || !this.canPublish()) return;
    const enable = this.muted();
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enable, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      this.muted.set(!enable);
    } catch {
      this.state.set('blocked');
    }
  }
  async selectMicrophone(deviceId: string): Promise<void> {
    await this.room?.switchActiveDevice('audioinput', deviceId);
  }
  async selectSpeaker(deviceId: string): Promise<void> {
    await this.room?.switchActiveDevice('audiooutput', deviceId);
  }
  setVolume(identity: string, volume: number): void {
    const element = this.audio.get(identity);
    if (element) element.volume = Math.max(0, Math.min(1, volume));
  }
  async disconnect(updateState = true): Promise<void> {
    const room = this.room;
    this.room = undefined;
    if (room) await room.disconnect();
    this.cleanupAudio();
    this.channel.set(null);
    this.canPublish.set(false);
    this.muted.set(true);
    if (updateState) this.state.set('disconnected');
  }
  private cleanupAudio(): void {
    this.audio.forEach((element) => element.remove());
    this.audio.clear();
    this.speakingIds.set(new Set());
  }
}
