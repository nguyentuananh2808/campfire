import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;
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
    service = TestBed.inject(GroupsService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=groups-test-token; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('previews without joining and uses a separate protected POST to join', () => {
    service.previewInvitation('raw-token').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const preview = http.expectOne('/api/v1/group-invitations/preview');
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body).toEqual({ token: 'raw-token' });
    preview.flush({ groupId: 'group-1', groupName: 'Bạn thân', alreadyMember: false });

    service.join('raw-token').subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const join = http.expectOne('/api/v1/group-invitations/join');
    expect(join.request.method).toBe('POST');
    expect(join.request.headers.get('X-XSRF-TOKEN')).toBe('groups-test-token');
    join.flush({ id: 'group-1', name: 'Bạn thân', role: 'Member', memberCount: 2, version: 'v1' });
  });
});
