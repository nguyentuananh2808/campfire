import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WerewolfService } from './werewolf.service';

describe('WerewolfService', () => {
  let service: WerewolfService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
        ),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(WerewolfService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=werewolf-test-token; path=/';
  });
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('sends game actions through REST with a unique id and antiforgery', () => {
    service.action('game-1', 'Investigate', 'player-2').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/werewolf/games/game-1/actions');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.kind).toBe('Investigate');
    expect(request.request.body.targetUserId).toBe('player-2');
    expect(request.request.body.clientActionId).toBeTruthy();
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('werewolf-test-token');
    request.flush({});
  });

  it('requests server-authorized voice access instead of constructing a room token', () => {
    service.voice('room-1').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/werewolf/rooms/room-1/voice-token');
    expect(request.request.method).toBe('POST');
    request.flush({
      serverUrl: 'ws://voice',
      token: 'opaque',
      channel: 'wolves',
      expiresAtUtc: '',
      canPublish: true,
      canSubscribe: true,
    });
  });
});
