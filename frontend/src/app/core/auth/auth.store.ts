import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap, throwError } from 'rxjs';
import { getApiErrorMessage } from './api-error';
import { AuthService } from './auth.service';
import { AuthStatus } from './auth-status';
import { ChangePasswordRequest } from './change-password-request';
import { LoginRequest } from './login-request';
import { RegisterRequest } from './register-request';
import { UserAccount } from './user-account';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthService);
  private readonly account = signal<UserAccount | null>(null);
  private readonly authStatus = signal<AuthStatus>('idle');
  private readonly authError = signal<string | null>(null);
  private initialization?: Observable<UserAccount | null>;

  readonly user = this.account.asReadonly();
  readonly status = this.authStatus.asReadonly();
  readonly error = this.authError.asReadonly();

  ensureInitialized(): Observable<UserAccount | null> {
    if (this.initialization) {
      return this.initialization;
    }

    this.authStatus.set('loading');
    this.initialization = this.api.me().pipe(
      tap((user) => {
        this.account.set(user);
        this.authStatus.set('authenticated');
        this.authError.set(null);
      }),
      catchError((error: unknown) => {
        this.account.set(null);
        this.authStatus.set('anonymous');
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          this.authError.set(getApiErrorMessage(error));
        }
        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.initialization;
  }

  login(request: LoginRequest): Observable<UserAccount> {
    return this.api.login(request).pipe(tap((user) => this.setAuthenticated(user)));
  }

  register(request: RegisterRequest): Observable<UserAccount> {
    return this.api.register(request).pipe(tap((user) => this.setAuthenticated(user)));
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.api.changePassword(request);
  }

  logout(): Observable<void> {
    return this.api.logout().pipe(
      tap(() => {
        this.account.set(null);
        this.authStatus.set('anonymous');
        this.authError.set(null);
        this.initialization = of(null);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.account.set(null);
          this.authStatus.set('anonymous');
          return of(undefined);
        }
        return throwError(() => error);
      }),
    );
  }

  private setAuthenticated(user: UserAccount): void {
    this.account.set(user);
    this.authStatus.set('authenticated');
    this.authError.set(null);
    this.initialization = of(user);
  }
}
