import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth.store';

describe('App', () => {
  it('renders the four primary mobile navigation destinations', async () => {
    const user = signal({ id: '1', email: 'friend@example.com', displayName: 'Tuan Anh' });
    const status = signal<'authenticated'>('authenticated');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        {
          provide: AuthStore,
          useValue: { user, status, ensureInitialized: () => of(user()) },
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
      'Ma Sói',
      'Nhóm',
    ]);
  });
});
