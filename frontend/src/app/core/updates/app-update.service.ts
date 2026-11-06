import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { AndroidUpdateManifest } from './android-update-manifest';

@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly http = inject(HttpClient);
  private readonly available = signal<AndroidUpdateManifest | null>(null);
  private checking = false;
  private currentVersionCode = 0;
  readonly update = this.available.asReadonly();

  constructor() {
    if (!this.isAndroid()) return;
    void this.initialize();
  }

  async check(): Promise<void> {
    if (!this.isAndroid() || this.checking) return;
    this.checking = true;
    try {
      const { App } = await import('@capacitor/app');
      const [info, manifest] = await Promise.all([
        App.getInfo(),
        firstValueFrom(
          this.http.get<AndroidUpdateManifest>(`/app-updates/android.json?v=${Date.now()}`),
        ),
      ]);
      const currentVersionCode = Number.parseInt(info.build, 10);
      this.currentVersionCode = currentVersionCode;
      if (
        Number.isSafeInteger(currentVersionCode) &&
        this.isValid(manifest) &&
        currentVersionCode < manifest.latestVersionCode
      ) {
        this.available.set(manifest);
      } else {
        this.available.set(null);
      }
    } catch {
      // A failed update check must never block normal app startup.
    } finally {
      this.checking = false;
    }
  }

  dismiss(): void {
    const update = this.available();
    if (update && !this.isRequired(update)) {
      this.available.set(null);
    }
  }

  async download(): Promise<void> {
    const url = this.available()?.downloadUrl;
    if (!url || !this.isTrustedDownloadUrl(url)) return;
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  }

  isRequired(update: AndroidUpdateManifest): boolean {
    return this.currentVersionCode < update.minimumSupportedVersionCode;
  }

  private isAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  private async initialize(): Promise<void> {
    try {
      const { App } = await import('@capacitor/app');
      await this.check();
      await App.addListener('resume', () => this.check());
    } catch {
      // Native update checks are best-effort and must not affect application startup.
    }
  }

  private isValid(manifest: AndroidUpdateManifest): boolean {
    return (
      Number.isSafeInteger(manifest.latestVersionCode) &&
      manifest.latestVersionCode > 0 &&
      Number.isSafeInteger(manifest.minimumSupportedVersionCode) &&
      manifest.minimumSupportedVersionCode > 0 &&
      manifest.minimumSupportedVersionCode <= manifest.latestVersionCode &&
      typeof manifest.latestVersionName === 'string' &&
      manifest.latestVersionName.length <= 32 &&
      Array.isArray(manifest.releaseNotes) &&
      manifest.releaseNotes.length <= 10 &&
      manifest.releaseNotes.every((note) => typeof note === 'string' && note.length <= 200) &&
      typeof manifest.downloadUrl === 'string' &&
      this.isTrustedDownloadUrl(manifest.downloadUrl)
    );
  }

  private isTrustedDownloadUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'tamsuvoinhau.cloud';
    } catch {
      return false;
    }
  }
}
