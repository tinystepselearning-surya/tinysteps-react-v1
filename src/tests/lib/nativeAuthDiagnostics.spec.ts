import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { preferencesGetMock, preferencesSetMock } = vi.hoisted(() => ({
  preferencesGetMock: vi.fn(),
  preferencesSetMock: vi.fn(),
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: preferencesGetMock,
    set: preferencesSetMock,
  },
}));

import {
  logFirebaseAuthKeyPresence,
  runNativeAuthStartupDiagnostics,
} from '../../lib/nativeAuthDiagnostics';

describe('native auth diagnostics safety', () => {
  beforeEach(() => {
    localStorage.clear();
    preferencesGetMock.mockReset();
    preferencesSetMock.mockReset();
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => true },
    });
  });

  it('logs probe presence and Firebase key counts without logging values', async () => {
    const sensitiveFirebaseValue = 'refreshToken=SECRET_REFRESH email=parent@example.com';
    const sensitiveLocalProbe = 'SECRET_LOCAL_PROBE_VALUE';
    const sensitivePreferencesProbe = 'SECRET_PREFERENCES_VALUE';
    localStorage.setItem('firebase:authUser:REDACTED:[DEFAULT]', sensitiveFirebaseValue);
    localStorage.setItem('ts_native_storage_probe_v1', sensitiveLocalProbe);
    preferencesGetMock.mockResolvedValue({ value: sensitivePreferencesProbe });
    preferencesSetMock.mockResolvedValue(undefined);
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await runNativeAuthStartupDiagnostics();
    logFirebaseAuthKeyPresence('after-auth-initialization');

    const serializedLogs = JSON.stringify(infoSpy.mock.calls);
    expect(serializedLogs).not.toContain(sensitiveFirebaseValue);
    expect(serializedLogs).not.toContain(sensitiveLocalProbe);
    expect(serializedLogs).not.toContain(sensitivePreferencesProbe);
    expect(serializedLogs).not.toContain('parent@example.com');
    expect(infoSpy).toHaveBeenCalledWith(
      '[auth-diagnostics] local-probe',
      { present: true },
    );
    expect(infoSpy).toHaveBeenCalledWith(
      '[auth-diagnostics] preferences-probe',
      { present: true },
    );
    expect(infoSpy).toHaveBeenCalledWith(
      '[auth-diagnostics] firebase-auth-key',
      { present: true, count: 1 },
    );
  });

  it('stores only a harmless diagnostic ID and timestamp in Preferences', async () => {
    preferencesGetMock.mockResolvedValue({ value: null });
    preferencesSetMock.mockResolvedValue(undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await runNativeAuthStartupDiagnostics();

    expect(preferencesSetMock).toHaveBeenCalledOnce();
    const write = preferencesSetMock.mock.calls[0][0] as {
      key: string;
      value: string;
    };
    expect(write.key).toBe('ts_native_preferences_probe_v1');
    expect(Object.keys(JSON.parse(write.value)).sort()).toEqual([
      'diagnosticId',
      'updatedAt',
    ]);
    expect(write.value.toLowerCase()).not.toMatch(
      /password|refresh.?token|access.?token|id.?token|firebase.?user|email|uid/,
    );
  });

  it('does nothing on the web', async () => {
    Object.defineProperty(window, 'Capacitor', {
      configurable: true,
      writable: true,
      value: { isNativePlatform: () => false },
    });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    await runNativeAuthStartupDiagnostics();

    expect(preferencesGetMock).not.toHaveBeenCalled();
    expect(preferencesSetMock).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it('wires Firebase key diagnostics to all requested lifecycle checkpoints', () => {
    const firebaseConfigSource = readFileSync(
      join(process.cwd(), 'src/lib/firebaseConfig.ts'),
      'utf8',
    );
    const bootstrapSource = readFileSync(
      join(process.cwd(), 'src/components/common/AuthBootstrap.tsx'),
      'utf8',
    );
    const diagnosticsSource = readFileSync(
      join(process.cwd(), 'src/lib/nativeAuthDiagnostics.ts'),
      'utf8',
    );

    expect(firebaseConfigSource).toContain("'after-auth-initialization'");
    expect(bootstrapSource).toContain("'before-auth-state-ready'");
    expect(bootstrapSource).toContain("'after-auth-state-ready'");
    expect(diagnosticsSource).toContain("'after-login'");
    expect(diagnosticsSource).toContain("'two-seconds-after-login'");
  });
});
