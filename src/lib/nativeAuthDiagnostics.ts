import { Preferences } from '@capacitor/preferences';

const LOCAL_PROBE_KEY = 'ts_native_storage_probe_v1';
const PREFERENCES_PROBE_KEY = 'ts_native_preferences_probe_v1';
const FIREBASE_AUTH_KEY_PREFIX = 'firebase:authUser:';

export type AuthDiagnosticCheckpoint =
  | 'after-auth-initialization'
  | 'after-login'
  | 'two-seconds-after-login'
  | 'before-auth-state-ready'
  | 'after-auth-state-ready';

export const isNativeCapacitorRuntime = (): boolean => {
  if (typeof window === 'undefined') return false;
  const capacitor = (window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  if (typeof capacitor?.isNativePlatform === 'function') {
    try {
      return Boolean(capacitor.isNativePlatform());
    } catch {
      // Fall through to the WebView scheme check.
    }
  }
  return window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:';
};

const createDiagnosticProbe = () => ({
  diagnosticId:
    typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  updatedAt: new Date().toISOString(),
});

const canAccessLocalStorage = (): boolean => {
  try {
    void window.localStorage.length;
    return true;
  } catch {
    return false;
  }
};

export const logFirebaseAuthKeyPresence = (
  checkpoint: AuthDiagnosticCheckpoint,
): void => {
  if (!isNativeCapacitorRuntime()) return;
  let count = 0;
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(FIREBASE_AUTH_KEY_PREFIX)) count += 1;
    }
  } catch {
    count = 0;
  }
  console.info('[auth-diagnostics] firebase-auth-checkpoint', { checkpoint });
  console.info('[auth-diagnostics] firebase-auth-key', {
    present: count > 0,
    count,
  });
};

export const runNativeAuthStartupDiagnostics = async (): Promise<void> => {
  if (!isNativeCapacitorRuntime()) return;

  const localStorageAccessible = canAccessLocalStorage();
  console.info('[auth-diagnostics] webview', {
    origin: window.location.origin,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    localStorageAccessible,
  });

  let localProbePresent = false;
  if (localStorageAccessible) {
    try {
      localProbePresent = window.localStorage.getItem(LOCAL_PROBE_KEY) !== null;
    } catch {
      localProbePresent = false;
    }
  }
  console.info('[auth-diagnostics] local-probe', { present: localProbePresent });

  if (localStorageAccessible) {
    try {
      window.localStorage.setItem(LOCAL_PROBE_KEY, JSON.stringify(createDiagnosticProbe()));
    } catch {
      // The accessibility result and next launch will expose the failure.
    }
  }

  try {
    const existingPreference = await Preferences.get({ key: PREFERENCES_PROBE_KEY });
    console.info('[auth-diagnostics] preferences-probe', {
      present: existingPreference.value !== null,
    });
    await Preferences.set({
      key: PREFERENCES_PROBE_KEY,
      value: JSON.stringify(createDiagnosticProbe()),
    });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : undefined;
    console.warn('[auth-diagnostics] preferences-probe-error', { code });
  }
};

export const schedulePostLoginAuthDiagnostics = (): void => {
  if (!isNativeCapacitorRuntime()) return;
  logFirebaseAuthKeyPresence('after-login');
  window.setTimeout(() => {
    logFirebaseAuthKeyPresence('two-seconds-after-login');
  }, 2_000);
};

