import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface DeviceUnlockPlugin {
  addListener(eventName: 'deviceUnlocked', listener: () => void): Promise<PluginListenerHandle>;
}

export const DeviceUnlock = registerPlugin<DeviceUnlockPlugin>('DeviceUnlock');
