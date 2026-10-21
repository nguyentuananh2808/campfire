import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  GuestSession,
  GuestGender,
  GenderPreference,
  MatchmakingResult,
  StrangerConversation,
  StrangerMessage,
  StrangerMessagePage,
} from './stranger-chat.models';

@Injectable({ providedIn: 'root' })
export class StrangerChatService {
  private readonly http = inject(HttpClient);
  private mutate<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
  session(): Observable<GuestSession> {
    return this.http.get<GuestSession>('/api/v1/stranger/session');
  }
  createSession(
    nickname: string,
    gender: GuestGender,
    genderPreference: GenderPreference,
  ): Observable<GuestSession> {
    return this.mutate(() =>
      this.http.post<GuestSession>('/api/v1/stranger/session', {
        nickname,
        gender,
        genderPreference,
        confirmsAdult: true,
      }),
    );
  }
  deleteSession(): Observable<void> {
    return this.mutate(() => this.http.delete<void>('/api/v1/stranger/session'));
  }
  queue(): Observable<MatchmakingResult> {
    return this.mutate(() => this.http.post<MatchmakingResult>('/api/v1/stranger/matchmaking', {}));
  }
  cancelQueue(): Observable<void> {
    return this.mutate(() => this.http.delete<void>('/api/v1/stranger/matchmaking'));
  }
  conversation(): Observable<StrangerConversation> {
    return this.http.get<StrangerConversation>('/api/v1/stranger/conversation');
  }
  messages(id: string): Observable<StrangerMessagePage> {
    return this.http.get<StrangerMessagePage>(`/api/v1/stranger/conversations/${id}/messages`, {
      params: new HttpParams().set('limit', 100),
    });
  }
  send(id: string, clientMessageId: string, content: string): Observable<StrangerMessage> {
    return this.mutate(() =>
      this.http.post<StrangerMessage>(`/api/v1/stranger/conversations/${id}/messages`, {
        clientMessageId,
        content,
      }),
    );
  }
  end(id: string, block = false): Observable<boolean> {
    return this.mutate(() =>
      this.http.post<boolean>(`/api/v1/stranger/conversations/${id}/end`, { block }),
    );
  }
  report(id: string, reason: string): Observable<boolean> {
    return this.mutate(() =>
      this.http.post<boolean>(`/api/v1/stranger/conversations/${id}/reports`, { reason }),
    );
  }
}
