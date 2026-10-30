import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth.store';
import { GroupMessageNotificationService } from './core/notifications/group-message-notification.service';
import { TabNotificationService } from './core/notifications/tab-notification.service';

describe('App', () => {
  it('renders the primary mobile navigation destinations', async () => {
    const user = signal({ id: '1', email: 'friend@example.com', displayName: 'Tuan Anh' });
    const status = signal<'authenticated'>('authenticated');
    const groupUnreadCount = signal(0);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: AuthStore,
          useValue: { user, status, ensureInitialized: () => of(user()) },
        },
        {
          provide: GroupMessageNotificationService,
          useValue: { start: () => Promise.resolve(), stop: () => Promise.resolve() },
        },
        {
          provide: TabNotificationService,
          useValue: { groupUnreadCount },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Trò chuyện',
      'Kèo',
      'Học quanh lửa',
      'Ma Sói',
      'Nhóm',
    ]);
  });

  it('shows the unread group message count on the chat destination', async () => {
    const user = signal({ id: '1', email: 'friend@example.com', displayName: 'Tuan Anh' });
    const status = signal<'authenticated'>('authenticated');
    const groupUnreadCount = signal(7);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        { provide: AuthStore, useValue: { user, status, ensureInitialized: () => of(user()) } },
        {
          provide: GroupMessageNotificationService,
          useValue: { start: () => Promise.resolve(), stop: () => Promise.resolve() },
        },
        { provide: TabNotificationService, useValue: { groupUnreadCount } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const chatLink = fixture.nativeElement.querySelector('nav a') as HTMLAnchorElement;
    expect(chatLink.getAttribute('aria-label')).toContain('7 tin nhắn chưa đọc');
    expect(chatLink.querySelector('.nav-badge')?.textContent?.trim()).toBe('7');
  });
});
