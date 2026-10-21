import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
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
    service = TestBed.inject(EventsService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=events-test-token; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('sends versioned status transitions through an antiforgery-protected request', () => {
    service.changeStatus('group-1', 'event-1', 'Confirmed', 'version-1').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/groups/group-1/events/event-1/status');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ status: 'Confirmed', expectedVersion: 'version-1' });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('events-test-token');
    request.flush({});
  });

  it('keeps Going and NotGoing as explicit RSVP values', () => {
    service.setRsvp('group-1', 'event-1', 'NotGoing').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/groups/group-1/events/event-1/rsvp');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ response: 'NotGoing' });
    request.flush({});
  });
});
