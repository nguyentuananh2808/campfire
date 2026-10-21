import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { EventDetail } from './event-detail';
import { EventStatus } from './event-status';
import { EventSummary } from './event-summary';
import { RsvpResponse } from './rsvp-response';

export interface EventDetailsInput {
  title: string;
  description: string;
  startsAtUtc: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  list(groupId: string, limit = 50): Observable<EventSummary[]> {
    return this.http.get<EventSummary[]>(`/api/v1/groups/${groupId}/events`, {
      params: new HttpParams().set('limit', limit),
    });
  }
  get(groupId: string, eventId: string): Observable<EventDetail> {
    return this.http.get<EventDetail>(`/api/v1/groups/${groupId}/events/${eventId}`);
  }
  create(groupId: string, input: EventDetailsInput): Observable<EventDetail> {
    return this.mutation(() =>
      this.http.post<EventDetail>(`/api/v1/groups/${groupId}/events`, input),
    );
  }
  update(
    groupId: string,
    eventId: string,
    input: EventDetailsInput,
    expectedVersion: string,
  ): Observable<EventDetail> {
    return this.mutation(() =>
      this.http.patch<EventDetail>(`/api/v1/groups/${groupId}/events/${eventId}`, {
        ...input,
        expectedVersion,
      }),
    );
  }
  changeStatus(
    groupId: string,
    eventId: string,
    status: Exclude<EventStatus, 'Open'>,
    expectedVersion: string,
  ): Observable<EventDetail> {
    return this.mutation(() =>
      this.http.post<EventDetail>(`/api/v1/groups/${groupId}/events/${eventId}/status`, {
        status,
        expectedVersion,
      }),
    );
  }
  setRsvp(groupId: string, eventId: string, response: RsvpResponse): Observable<EventDetail> {
    return this.mutation(() =>
      this.http.put<EventDetail>(`/api/v1/groups/${groupId}/events/${eventId}/rsvp`, { response }),
    );
  }
  private mutation<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
}
