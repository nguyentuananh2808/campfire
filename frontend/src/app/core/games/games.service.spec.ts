import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GamesService } from './games.service';

describe('GamesService', () => {
  let service: GamesService;
  let http: HttpTestingController;

  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=games-test-token; path=/';
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
        ),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(GamesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('protects a move with antiforgery and concurrency version', () => {
    service.play('game-1', 4, 'version-1').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);

    const request = http.expectOne('/api/v1/games/game-1/moves');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('games-test-token');
    expect(request.request.body).toEqual({ cell: 4, expectedVersion: 'version-1' });
    request.flush({});
  });
});
