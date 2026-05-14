import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tinystepslearning.app',
  appName: 'Tiny Steps',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    scrollEnabled: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
