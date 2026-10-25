import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ChatMessage } from './chat-message';
import { ChatMessageKind } from './chat-message-kind';
import { ChatMessagePage } from './chat-message-page';
import { ChatReaction } from './chat-reaction-summary';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  getMessages(
    groupId: string,
    options: { before?: string; after?: string; limit?: number } = {},
  ): Observable<ChatMessagePage> {
    let params = new HttpParams().set('limit', options.limit ?? 50);
    if (options.before) params = params.set('before', options.before);
    if (options.after) params = params.set('after', options.after);
    return this.http.get<ChatMessagePage>(`/api/v1/groups/${groupId}/messages`, { params });
  }
  send(
    groupId: string,
    clientMessageId: string,
    kind: ChatMessageKind,
    content: string,
    replyToMessageId: string | null,
  ): Observable<ChatMessage> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(
      switchMap(() =>
        this.http.post<ChatMessage>(`/api/v1/groups/${groupId}/messages`, {
          clientMessageId,
          kind,
          content,
          replyToMessageId,
        }),
      ),
    );
  }

  setReaction(
    groupId: string,
    messageId: string,
    reaction: ChatReaction | null,
  ): Observable<ChatMessage> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(
      switchMap(() =>
        this.http.put<ChatMessage>(`/api/v1/groups/${groupId}/messages/${messageId}/reaction`, {
          reaction,
        }),
      ),
    );
  }
}
