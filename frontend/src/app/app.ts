import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from './core/auth/auth.store';
import { GroupMessageNotificationService } from './core/notifications/group-message-notification.service';
import { TabNotificationService } from './core/notifications/tab-notification.service';
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
  readonly notifications = inject(TabNotificationService);
  private readonly groupNotifications = inject(GroupMessageNotificationService);

  constructor() {
    this.auth.ensureInitialized().subscribe();
    effect(() => {
      const user = this.auth.user();
      if (this.auth.status() === 'authenticated' && user)
        void this.groupNotifications.start(user.id);
      else void this.groupNotifications.stop();
    });
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
