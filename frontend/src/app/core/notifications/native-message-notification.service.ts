import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { LocalNotifications, type ActionPerformed } from '@capacitor/local-notifications';

const MESSAGE_GROUP_ID = 'campfire_messages';
const MAX_TRACKED_NOTIFICATIONS = 20;
const ALLOWED_ROUTES = new Set(['/chat', '/stranger']);

@Injectable({ providedIn: 'root' })
export class NativeMessageNotificationService {
  private readonly router = inject(Router);
  private readonly deliveredIds = new Map<string, number[]>();
  private initialization?: Promise<void>;
  private actionListener?: PluginListenerHandle;
  private permissionGranted = false;
  private nextNotificationId = Math.floor(Date.now() / 1000) % 2_000_000_000;

  async enable(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await this.initialize();

      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') {
        this.permissionGranted = true;
        return;
      }
      if (current.display === 'denied') return;

      const requested = await LocalNotifications.requestPermissions();
      this.permissionGranted = requested.display === 'granted';
    } catch {
      this.permissionGranted = false;
    }
  }

  async notifyMessage(
    scope: string,
    route: '/chat' | '/stranger',
    unreadCount: number,
  ): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await this.enable();
    if (!this.permissionGranted) return;

    const id = this.allocateId();
    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Campfire',
          body: unreadCount > 1 ? `Bạn có ${unreadCount} tin nhắn mới.` : 'Bạn có tin nhắn mới.',
          group: MESSAGE_GROUP_ID,
          badge: Math.min(Math.max(unreadCount, 1), 99),
          smallIcon: 'ic_stat_campfire',
          iconColor: '#ff9f43',
          autoCancel: true,
          foreground: true,
          extra: { route },
        },
      ],
    });

    const ids = [...(this.deliveredIds.get(scope) ?? []), id].slice(-MAX_TRACKED_NOTIFICATIONS);
    this.deliveredIds.set(scope, ids);
  }

  async clear(scope: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const ids = this.deliveredIds.get(scope);
    if (!ids?.length) return;
    this.deliveredIds.delete(scope);
    try {
      await LocalNotifications.removeDeliveredNotificationsById({ ids });
    } catch {
      /* The operating system may already have removed an auto-cancelled notification. */
    }
  }

  async clearAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    this.deliveredIds.clear();
    try {
      await LocalNotifications.removeAllDeliveredNotifications();
    } catch {
      /* Clearing a missing native notification tray is safe to ignore. */
    }
  }

  private initialize(): Promise<void> {
    this.initialization ??= this.initializePlugin();
    return this.initialization;
  }

  private async initializePlugin(): Promise<void> {
    this.actionListener = await LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => this.openNotification(action),
    );
  }

  private openNotification(action: ActionPerformed): void {
    const route = action.notification.extra?.['route'];
    if (typeof route !== 'string' || !ALLOWED_ROUTES.has(route)) return;
    void this.router.navigateByUrl(route);
  }

  private allocateId(): number {
    this.nextNotificationId = (this.nextNotificationId + 1) % 2_000_000_000;
    return this.nextNotificationId;
  }
}
