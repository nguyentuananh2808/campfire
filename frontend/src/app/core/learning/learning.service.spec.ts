import { provideHttpClient, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LearningService } from './learning.service';

describe('LearningService', () => {
  let service: LearningService;
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
    service = TestBed.inject(LearningService);
    http = TestBed.inject(HttpTestingController);
    document.cookie = 'XSRF-TOKEN=learning-test-token; path=/';
  });

  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
    http.verify();
  });

  it('submits exercise answers only after fetching antiforgery', () => {
    service.submit('activity-1', [{ questionId: 'q1', value: 'Xin chào' }]).subscribe();
    http.expectOne('/api/v1/auth/antiforgery').flush(null);
    const request = http.expectOne('/api/v1/learning/activities/activity-1/submit');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('learning-test-token');
    expect(request.request.body).toEqual({
      answers: [{ questionId: 'q1', value: 'Xin chào' }],
    });
    request.flush({});
  });

  it('bounds the mind map query through fixed client parameters', () => {
    service.mindMap('学生').subscribe();
    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/learning/vocabulary/mindmap' &&
        candidate.params.get('hskLevel') === '1' &&
        candidate.params.get('maxChildren') === '8',
    );
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
