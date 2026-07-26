import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tinystepslearning.app',
  appName: 'Tiny Steps',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#fff7ed',
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'debug',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DEFAULT',
      hidden: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound'],
    },
  },
};

export default config;
