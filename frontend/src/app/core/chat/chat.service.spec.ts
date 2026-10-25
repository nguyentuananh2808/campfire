import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
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
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=chat-test-token; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('sends through the protected REST endpoint with the caller idempotency key', () => {
    service.send('group-1', 'client-1', 'Text', 'Xin chào', 'message-0').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/groups/group-1/messages');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      clientMessageId: 'client-1',
      kind: 'Text',
      content: 'Xin chào',
      replyToMessageId: 'message-0',
    });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('chat-test-token');
    request.flush({});
  });

  it('sends an allow-listed sticker kind through the same idempotent endpoint', () => {
    service.send('group-1', 'client-2', 'Sticker', 'campfire', null).subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/groups/group-1/messages');
    expect(request.request.body).toEqual({
      clientMessageId: 'client-2',
      kind: 'Sticker',
      content: 'campfire',
      replyToMessageId: null,
    });
    request.flush({});
  });

  it('sets or removes the caller reaction through the protected endpoint', () => {
    service.setReaction('group-1', 'message-1', 'Love').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/groups/group-1/messages/message-1/reaction');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ reaction: 'Love' });
    request.flush({});
  });

  it('passes stable cursor options to history reads', () => {
    service.getMessages('group-1', { after: 'cursor', limit: 100 }).subscribe();
    const request = http.expectOne('/api/v1/groups/group-1/messages?limit=100&after=cursor');
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], olderCursor: null, latestCursor: 'cursor', hasMore: false });
  });
});
