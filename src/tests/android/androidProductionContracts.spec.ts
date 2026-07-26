import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Android v1.2 production contracts', () => {
  it('preserves package identity and uses the next repository version code', () => {
    const gradle = read('android/app/build.gradle');
    expect(gradle).toContain('applicationId "com.tinystepslearning.app"');
    expect(gradle).toContain('versionName "1.2"');
    expect(gradle).toContain('versionCode 2');
    expect(read('capacitor.config.ts')).toContain(
      "appId: 'com.tinystepslearning.app'",
    );
  });

  it('keeps Firebase Android configuration on the production project/package', () => {
    const config = JSON.parse(read('android/app/google-services.json'));
    expect(config.project_info.project_id).toBe('tinysteps-react-v1');
    expect(
      config.client.map(
        (client: any) => client.client_info.android_client_info.package_name,
      ),
    ).toContain('com.tinystepslearning.app');
  });

  it('enforces HTTPS, non-exported file sharing, and no app-data backup', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:networkSecurityConfig="@xml/network_security_config"');
    expect(manifest).toMatch(
      /android:name="androidx\.core\.content\.FileProvider"[\s\S]*?android:exported="false"/,
    );
    expect(read('android/app/src/main/res/xml/network_security_config.xml'))
      .toContain('cleartextTrafficPermitted="false"');
  });

  it('uses Capacitor system insets and Android resize without iOS keyboard padding', () => {
    const config = read('capacitor.config.ts');
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    const css = read('src/index.css');
    expect(config).toContain("insetsHandling: 'css'");
    expect(config).toContain("style: 'DEFAULT'");
    expect(manifest).toContain('android:windowSoftInputMode="adjustResize"');
    expect(css).toContain("html[data-native-platform='android'] .ts-chat-focus-viewport");
    expect(css).toContain('padding-bottom: 0');
  });

  it('creates stable message/reminder channels and no local reminder scheduler', () => {
    const push = read('src/lib/pushNotifications.ts');
    expect(push).toContain("ANDROID_MESSAGES_CHANNEL_ID = 'messages'");
    expect(push).toContain(
      "ANDROID_CLASS_REMINDERS_CHANNEL_ID = 'class_reminders'",
    );
    expect(push).toContain("name: 'Class reminders'");
    expect(push).not.toMatch(/AlarmManager|WorkManager|setExactAndAllowWhileIdle/);
    expect(read('functions/src/notifications/classReminders.ts')).toContain(
      'export const sendClassReminders15Min = onSchedule',
    );
  });

  it('keeps release secrets local and release WebView debugging disabled', () => {
    const gradle = read('android/app/build.gradle');
    const activity = read(
      'android/app/src/main/java/com/tinystepslearning/app/MainActivity.java',
    );
    const ignore = read('android/.gitignore');
    expect(gradle).toContain('rootProject.file("key.properties")');
    expect(gradle).toContain('if (keystorePropertiesFile.exists())');
    expect(ignore).toContain('*.jks');
    expect(ignore).toContain('key.properties');
    expect(activity).toContain('ApplicationInfo.FLAG_DEBUGGABLE');
    expect(activity).toContain('if (!debuggable)');
    expect(activity).toContain('WebView.setWebContentsDebuggingEnabled(false)');
  });

  it('ships adaptive, round, monochrome, notification and splash assets', () => {
    [
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
      'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
      'android/app/src/main/res/mipmap-anydpi-v33/ic_launcher.xml',
      'android/app/src/main/res/drawable/ic_launcher_monochrome.xml',
      'android/app/src/main/res/drawable/ic_stat_tiny_steps.xml',
      'android/app/src/main/res/drawable-xxxhdpi/splash_logo.png',
    ].forEach((path) => expect(existsSync(resolve(process.cwd(), path))).toBe(true));
  });

  it('keeps Android links narrow and routes them through authenticated state', () => {
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    const app = read('src/app.tsx');
    expect(manifest).toContain('android:host="tinystepslearning.com"');
    expect(manifest).toContain('android:pathPrefix="/parent"');
    expect(manifest).toContain('android:pathPrefix="/messages"');
    expect(app).toContain("CapacitorApp.addListener('appUrlOpen'");
    expect(app).toContain("authStatus !== 'authenticated'");
    expect(app).toContain('queuePendingNativeDeepLink(route)');
  });
});
