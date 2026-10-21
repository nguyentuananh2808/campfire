import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../../core/auth/api-error';
import { AuthStore } from '../../../core/auth/auth.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  selector: 'app-profile-page',
  styleUrl: './profile-page.scss',
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  private readonly auth = inject(AuthStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly pending = signal(false);
  readonly logoutPending = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly form = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(128)]],
    newPassword: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
  });

  changePassword(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.pending()) {
      return;
    }

    this.pending.set(true);
    this.message.set(null);
    this.auth
      .changePassword(this.form.getRawValue())
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.isError.set(false);
          this.message.set('Đã đổi mật khẩu và vô hiệu các phiên đăng nhập cũ.');
          this.form.reset();
        },
        error: (error: unknown) => {
          this.isError.set(true);
          this.message.set(getApiErrorMessage(error));
        },
      });
  }

  logout(): void {
    if (this.logoutPending()) {
      return;
    }
    this.logoutPending.set(true);
    this.auth
      .logout()
      .pipe(
        finalize(() => this.logoutPending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: (error: unknown) => {
          this.isError.set(true);
          this.message.set(getApiErrorMessage(error));
        },
      });
  }
}
