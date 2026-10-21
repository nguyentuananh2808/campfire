import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { VoiceAccess } from './voice-access';
import { WerewolfRoomSnapshot } from './werewolf-room-snapshot';
import { WerewolfRoomSummary } from './werewolf-room-summary';
import { createClientUuid } from '../ids/client-uuid';

export interface WerewolfRoomInput {
  name: string;
  visibility: 'Public' | 'Private';
  minimumPlayers: number;
  maximumPlayers: number;
  deadVoiceEnabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class WerewolfService {
  private readonly http = inject(HttpClient);
  list(): Observable<WerewolfRoomSummary[]> {
    return this.http.get<WerewolfRoomSummary[]>('/api/v1/werewolf/rooms');
  }
  create(input: WerewolfRoomInput): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>('/api/v1/werewolf/rooms', input),
    );
  }
  join(code: string, spectator: boolean): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>('/api/v1/werewolf/rooms/join', { code, spectator }),
    );
  }
  get(roomId: string): Observable<WerewolfRoomSnapshot> {
    return this.http.get<WerewolfRoomSnapshot>(`/api/v1/werewolf/rooms/${roomId}`);
  }
  update(
    roomId: string,
    input: WerewolfRoomInput,
    expectedVersion: string,
  ): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.patch<WerewolfRoomSnapshot>(`/api/v1/werewolf/rooms/${roomId}`, {
        ...input,
        expectedVersion,
      }),
    );
  }
  ready(roomId: string, ready: boolean): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.put<WerewolfRoomSnapshot>(`/api/v1/werewolf/rooms/${roomId}/ready`, { ready }),
    );
  }
  start(roomId: string, expectedVersion: string): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>(`/api/v1/werewolf/rooms/${roomId}/start`, {
        expectedVersion,
      }),
    );
  }
  action(
    gameId: string,
    kind: string,
    targetUserId: string | null,
  ): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>(`/api/v1/werewolf/games/${gameId}/actions`, {
        clientActionId: createClientUuid(),
        kind,
        targetUserId,
      }),
    );
  }
  vote(gameId: string, targetUserId: string | null): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>(`/api/v1/werewolf/games/${gameId}/votes`, {
        clientActionId: createClientUuid(),
        targetUserId,
      }),
    );
  }
  voice(roomId: string): Observable<VoiceAccess> {
    return this.mutation(() =>
      this.http.post<VoiceAccess>(`/api/v1/werewolf/rooms/${roomId}/voice-token`, {}),
    );
  }
  moderate(
    roomId: string,
    userId: string,
    action: 'mute' | 'unmute' | 'kick',
  ): Observable<WerewolfRoomSnapshot> {
    return this.mutation(() =>
      this.http.post<WerewolfRoomSnapshot>(
        `/api/v1/werewolf/rooms/${roomId}/players/${userId}/moderation`,
        { action },
      ),
    );
  }
  leave(roomId: string): Observable<boolean> {
    return this.mutation(() =>
      this.http.delete<boolean>(`/api/v1/werewolf/rooms/${roomId}/players/me`),
    );
  }
  private mutation<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
}
