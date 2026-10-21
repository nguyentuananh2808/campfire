import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import { GroupSummary } from '../../core/groups/group-summary';
import { GroupsService } from '../../core/groups/groups.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-groups-page',
  templateUrl: './groups-page.html',
  styleUrl: './groups-page.scss',
})
export class GroupsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupsService = inject(GroupsService);

  readonly groups = signal<GroupSummary[]>([]);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly showCreate = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.groupsService
      .getMine()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (groups) => this.groups.set(groups),
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }

  create(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.pending()) return;

    this.pending.set(true);
    this.error.set(null);
    this.groupsService
      .create(this.form.controls.name.value)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (group) => {
          this.groups.update((groups) => [group, ...groups]);
          this.form.reset();
          this.showCreate.set(false);
        },
        error: (error: unknown) => this.error.set(getApiErrorMessage(error)),
      });
  }
}
