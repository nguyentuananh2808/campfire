import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/api-error';
import { AuthStore } from '../../../core/auth/auth.store';
import { GroupInvitation } from '../../../core/groups/group-invitation';
import { GroupMember } from '../../../core/groups/group-member';
import { GroupSummary } from '../../../core/groups/group-summary';
import { GroupsService } from '../../../core/groups/groups.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-group-detail-page',
  templateUrl: './group-detail-page.html',
  styleUrl: './group-detail-page.scss',
})
export class GroupDetailPage {
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupsService = inject(GroupsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly groupId = this.route.snapshot.paramMap.get('groupId') ?? '';

  readonly group = signal<GroupSummary | null>(null);
  readonly members = signal<GroupMember[]>([]);
  readonly invitations = signal<GroupInvitation[]>([]);
  readonly loading = signal(true);
  readonly pendingAction = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly invitationLink = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly renameForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });
  readonly inviteForm = this.formBuilder.nonNullable.group({
    expiresInHours: [24, [Validators.required, Validators.min(1), Validators.max(168)]],
  });

  constructor() {
    this.load();
  }

  isOwner(): boolean {
    return this.group()?.role === 'Owner';
  }

  isMe(member: GroupMember): boolean {
    return member.userId === this.auth.user()?.id;
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.groupsService
      .getMine()
      .pipe(
        switchMap((groups) => {
          const group = groups.find((candidate) => candidate.id === this.groupId) ?? null;
          this.group.set(group);
          if (!group) throw new Error('group-not-found');
          this.renameForm.controls.name.setValue(group.name);
          return forkJoin({
            members: this.groupsService.getMembers(group.id),
            invitations:
              group.role === 'Owner' ? this.groupsService.getInvitations(group.id) : of([]),
          });
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ members, invitations }) => {
          this.members.set(members);
          this.invitations.set(invitations);
        },
        error: (error: unknown) =>
          this.error.set(
            error instanceof Error && error.message === 'group-not-found'
              ? 'Bạn không còn quyền truy cập nhóm này.'
              : getApiErrorMessage(error),
          ),
      });
  }

  rename(): void {
    if (this.renameForm.invalid) return;
    this.run(
      'rename',
      this.groupsService.rename(this.groupId, this.renameForm.controls.name.value),
      {
        next: (group) => {
          this.group.set(group);
          this.notice.set('Đã đổi tên nhóm.');
        },
      },
    );
  }

  createInvitation(): void {
    if (this.inviteForm.invalid) return;
    this.run(
      'invite',
      this.groupsService.createInvitation(
        this.groupId,
        this.inviteForm.controls.expiresInHours.value,
      ),
      {
        next: (invitation) => {
          this.invitationLink.set(
            `${window.location.origin}/invites/accept#token=${encodeURIComponent(invitation.token)}`,
          );
          this.notice.set('Link mới chỉ được hiển thị lần này. Hãy sao chép trước khi rời trang.');
          this.load();
        },
      },
    );
  }

  copyInvitation(): void {
    const link = this.invitationLink();
    if (!link) return;
    void navigator.clipboard.writeText(link).then(() => this.notice.set('Đã sao chép link mời.'));
  }

  revoke(invitationId: string): void {
    this.run(
      `revoke-${invitationId}`,
      this.groupsService.revokeInvitation(this.groupId, invitationId),
      {
        next: () => {
          this.notice.set('Đã thu hồi link mời.');
          this.load();
        },
      },
    );
  }

  remove(member: GroupMember): void {
    if (!window.confirm(`Xóa ${member.displayName} khỏi nhóm?`)) return;
    this.run(
      `remove-${member.userId}`,
      this.groupsService.removeMember(this.groupId, member.userId),
      {
        next: () => {
          this.notice.set('Đã xóa thành viên.');
          this.load();
        },
      },
    );
  }

  transfer(member: GroupMember): void {
    const group = this.group();
    if (!group || !window.confirm(`Chuyển quyền chủ nhóm cho ${member.displayName}?`)) return;
    this.run(
      `transfer-${member.userId}`,
      this.groupsService.transferOwnership(group.id, member.userId, group.version),
      {
        next: (updated) => {
          this.group.set(updated);
          this.notice.set('Đã chuyển quyền chủ nhóm. Bạn hiện là thành viên.');
          this.load();
        },
      },
    );
  }

  leave(): void {
    if (!window.confirm('Rời nhóm này?')) return;
    this.run('leave', this.groupsService.leave(this.groupId), {
      next: () => void this.router.navigateByUrl('/groups'),
    });
  }

  private run<T>(
    action: string,
    request: import('rxjs').Observable<T>,
    observer: { next: (value: T) => void },
  ): void {
    if (this.pendingAction()) return;
    this.pendingAction.set(action);
    this.error.set(null);
    this.notice.set(null);
    request
      .pipe(
        finalize(() => this.pendingAction.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: observer.next,
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }
}
