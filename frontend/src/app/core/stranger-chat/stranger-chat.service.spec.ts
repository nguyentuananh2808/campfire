import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StrangerChatService } from './stranger-chat.service';

describe('StrangerChatService', () => {
  let service: StrangerChatService;
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
    service = TestBed.inject(StrangerChatService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=stranger-chat-test-token; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('creates a protected guest session with gender matching preferences', () => {
    service.createSession('Đốm Lửa', 'Female', 'Male').subscribe();

    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/stranger/session');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nickname: 'Đốm Lửa',
      gender: 'Female',
      genderPreference: 'Male',
      confirmsAdult: true,
    });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('stranger-chat-test-token');
    request.flush({});
  });

  it('sends a reply with kind and idempotency key', () => {
    service.send('conversation-1', 'client-1', 'Sticker', 'campfire', 'message-0').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/stranger/conversations/conversation-1/messages');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      clientMessageId: 'client-1',
      kind: 'Sticker',
      content: 'campfire',
      replyToMessageId: 'message-0',
    });
    request.flush({});
  });

  it('sets a reaction through the protected participant endpoint', () => {
    service.setReaction('conversation-1', 'message-1', 'Like').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne(
      '/api/v1/stranger/conversations/conversation-1/messages/message-1/reaction',
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ reaction: 'Like' });
    request.flush({});
  });
});
