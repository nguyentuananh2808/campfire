import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ChangePasswordRequest } from './change-password-request';
import { LoginRequest } from './login-request';
import { RegisterRequest } from './register-request';
import { UserAccount } from './user-account';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/auth';

  register(request: RegisterRequest): Observable<UserAccount> {
    return this.prepareMutation().pipe(
      switchMap(() => this.http.post<UserAccount>(`${this.baseUrl}/register`, request)),
    );
  }

  login(request: LoginRequest): Observable<UserAccount> {
    return this.prepareMutation().pipe(
      switchMap(() => this.http.post<UserAccount>(`${this.baseUrl}/login`, request)),
    );
  }

  me(): Observable<UserAccount> {
    return this.http.get<UserAccount>(`${this.baseUrl}/me`);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.prepareMutation().pipe(
      switchMap(() => this.http.post<void>(`${this.baseUrl}/change-password`, request)),
    );
  }

  logout(): Observable<void> {
    return this.prepareMutation().pipe(
      switchMap(() => this.http.post<void>(`${this.baseUrl}/logout`, {})),
    );
  }

  private prepareMutation(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/antiforgery`);
  }
}
