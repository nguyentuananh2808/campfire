import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/api-error';
import { GroupsService } from '../../../core/groups/groups.service';
import { InvitationPreview } from '../../../core/groups/invitation-preview';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: 'app-invitation-accept-page',
  templateUrl: './invitation-accept-page.html',
  styleUrl: './invitation-accept-page.scss',
})
export class InvitationAcceptPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly groupsService = inject(GroupsService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token');

  readonly preview = signal<InvitationPreview | null>(null);
  readonly loading = signal(true);
  readonly joining = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.location.replaceState('/invites/accept');
    if (!this.token) {
      this.loading.set(false);
      this.error.set('Link mời không hợp lệ hoặc đã thiếu token.');
      return;
    }

    this.groupsService
      .previewInvitation(this.token)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (preview) => this.preview.set(preview),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  join(): void {
    if (!this.token || this.joining()) return;
    const preview = this.preview();
    if (preview?.alreadyMember) {
      void this.router.navigate(['/groups', preview.groupId]);
      return;
    }

    this.joining.set(true);
    this.error.set(null);
    this.groupsService
      .join(this.token)
      .pipe(
        finalize(() => this.joining.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (group) => void this.router.navigate(['/groups', group.id]),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }
}
