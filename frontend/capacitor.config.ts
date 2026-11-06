import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cloud.tamsuvoinhau.campfire',
  appName: 'Campfire',
  webDir: 'dist/campfire-web/browser',
  server: {
    url: 'https://tamsuvoinhau.cloud',
    cleartext: false,
    errorPath: 'android-offline.html',
  },
  android: {
    backgroundColor: '#28110b',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_campfire',
      iconColor: '#ff9f43',
    },
  },
};

export default config;
