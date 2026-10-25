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
    const browserWindow = this.document.defaultView;
    if (!isPlatformBrowser(this.platformId) || !browserWindow) {
      return;
    }

    const stored = this.readStoredTheme();
    const preferred: ThemePreference = stored
      ? stored
      : browserWindow.matchMedia?.('(prefers-color-scheme: dark)').matches
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
    this.document.documentElement.setAttribute('data-theme', theme);
    this.activeTheme.set(theme);

    if (persist) {
      this.persistTheme(theme);
    }
  }

  private readStoredTheme(): ThemePreference | null {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(this.storageKey);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }

  private persistTheme(theme: ThemePreference): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // Storage may be blocked in privacy-restricted browser contexts.
      // Theme switching must still work for the current session.
    }
  }
}
