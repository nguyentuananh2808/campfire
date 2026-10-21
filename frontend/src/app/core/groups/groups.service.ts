import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { GroupInvitation } from './group-invitation';
import { GroupMember } from './group-member';
import { GroupSummary } from './group-summary';
import { InvitationCreated } from './invitation-created';
import { InvitationPreview } from './invitation-preview';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/groups';

  getMine(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(this.baseUrl);
  }

  create(name: string): Observable<GroupSummary> {
    return this.mutation(() => this.http.post<GroupSummary>(this.baseUrl, { name }));
  }

  rename(groupId: string, name: string): Observable<GroupSummary> {
    return this.mutation(() =>
      this.http.patch<GroupSummary>(`${this.baseUrl}/${groupId}`, { name }),
    );
  }

  getMembers(groupId: string): Observable<GroupMember[]> {
    return this.http.get<GroupMember[]>(`${this.baseUrl}/${groupId}/members`);
  }

  removeMember(groupId: string, userId: string): Observable<void> {
    return this.mutation(() =>
      this.http.delete<void>(`${this.baseUrl}/${groupId}/members/${userId}`),
    );
  }

  leave(groupId: string): Observable<void> {
    return this.mutation(() => this.http.delete<void>(`${this.baseUrl}/${groupId}/members/me`));
  }

  transferOwnership(
    groupId: string,
    newOwnerUserId: string,
    expectedVersion: string,
  ): Observable<GroupSummary> {
    return this.mutation(() =>
      this.http.post<GroupSummary>(`${this.baseUrl}/${groupId}/owner`, {
        newOwnerUserId,
        expectedVersion,
      }),
    );
  }

  getInvitations(groupId: string): Observable<GroupInvitation[]> {
    return this.http.get<GroupInvitation[]>(`${this.baseUrl}/${groupId}/invitations`);
  }

  createInvitation(groupId: string, expiresInHours: number): Observable<InvitationCreated> {
    return this.mutation(() =>
      this.http.post<InvitationCreated>(`${this.baseUrl}/${groupId}/invitations`, {
        expiresInHours,
      }),
    );
  }

  revokeInvitation(groupId: string, invitationId: string): Observable<void> {
    return this.mutation(() =>
      this.http.delete<void>(`${this.baseUrl}/${groupId}/invitations/${invitationId}`),
    );
  }

  previewInvitation(token: string): Observable<InvitationPreview> {
    return this.mutation(() =>
      this.http.post<InvitationPreview>('/api/v1/group-invitations/preview', { token }),
    );
  }

  join(token: string): Observable<GroupSummary> {
    return this.mutation(() =>
      this.http.post<GroupSummary>('/api/v1/group-invitations/join', { token }),
    );
  }

  private mutation<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
}
