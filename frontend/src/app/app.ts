import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/auth.store';
import { ThemeToggle } from './shared/theme-toggle/theme-toggle';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeToggle],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthStore);

  constructor() {
    this.auth.ensureInitialized().subscribe();
  }

  initials(): string {
    const displayName = this.auth.user()?.displayName.trim();
    return displayName
      ? displayName
          .split(/\s+/)
          .slice(-2)
          .map((part) => part[0])
          .join('')
          .toUpperCase()
      : 'CF';
  }
}
