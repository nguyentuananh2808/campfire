import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { ThemePreference } from './theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'campfire-theme';
  private readonly activeTheme = signal<ThemePreference>('light');

  readonly theme = this.activeTheme.asReadonly();

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const stored = localStorage.getItem(this.storageKey);
    const preferred: ThemePreference =
      stored === 'light' || stored === 'dark'
        ? stored
        : window.matchMedia?.('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
    this.apply(preferred, false);
  }

  toggle(): void {
    this.apply(this.activeTheme() === 'dark' ? 'light' : 'dark', true);
  }

  setTheme(theme: ThemePreference): void {
    this.apply(theme, true);
  }

  private apply(theme: ThemePreference, persist: boolean): void {
    this.activeTheme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    if (persist && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, theme);
    }
  }
}
