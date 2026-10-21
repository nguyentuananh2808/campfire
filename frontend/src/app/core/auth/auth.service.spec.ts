import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
        ),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('primes antiforgery before login and sends the XSRF header', () => {
    document.cookie = 'XSRF-TOKEN=test-request-token; path=/';
    service.login({ email: 'friend@example.com', password: 'StrongPassword!1' }).subscribe();

    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const login = http.expectOne('/api/v1/auth/login');
    expect(login.request.headers.get('X-XSRF-TOKEN')).toBe('test-request-token');
    login.flush({ id: '1', email: 'friend@example.com', displayName: 'Friend' });
  });
});
