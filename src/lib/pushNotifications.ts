import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { callFunction } from './callFunctions';

const TOKEN_TIMEOUT_MS = 15_000;
const PERMISSION_PROMPT_KEY_PREFIX = 'ts_push_permission_prompted_v1:';
const LAST_TOKEN_KEY_PREFIX = 'ts_push_last_token_v1:';

type SupportedPlatform = 'ios' | 'android' | 'web';

type RegisterNotificationTokenPayload = {
  token: string;
  platform: SupportedPlatform;
  deviceId?: string;
  appVersion?: string;
};

type PushPermissionReceiveState = 'granted' | 'denied' | 'prompt' | string;

let listenersInitialized = false;
let listenersInitPromise: Promise<void> | null = null;
let tokenPromise: Promise<string> | null = null;
let resolveToken: ((value: string) => void) | null = null;
let rejectToken: ((reason?: unknown) => void) | null = null;
let tokenTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
const inFlightUsers = new Set<string>();

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  if (typeof Capacitor?.isNativePlatform === 'function') {
    try {
      return Boolean(Capacitor.isNativePlatform());
    } catch {
      // Ignore bridge errors and fall through to protocol checks.
    }
  }

  const protocol = window.location?.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

const shouldLogPushDebug = () => import.meta.env.DEV || isNativeCapacitorRuntime();

const logPush = (event: string, data?: Record<string, unknown>) => {
  if (!shouldLogPushDebug()) return;
  if (data) {
    console.info(`[push] ${event}`, data);
    return;
  }
  console.info(`[push] ${event}`);
};

const readLocal = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeLocal = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures.
  }
};

const resolvePlatform = (): SupportedPlatform => {
  const platform = String(Capacitor.getPlatform?.() || '').toLowerCase();
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  return 'ios';
};

const clearTokenWaiter = () => {
  if (tokenTimeoutHandle) {
    clearTimeout(tokenTimeoutHandle);
    tokenTimeoutHandle = null;
  }
  resolveToken = null;
  rejectToken = null;
};

const ensurePushListeners = async () => {
  if (listenersInitialized) return;
  if (listenersInitPromise) return listenersInitPromise;

  listenersInitPromise = (async () => {
    await PushNotifications.addListener('registration', (token) => {
      const value = typeof token?.value === 'string' ? token.value.trim() : '';
      if (!value) {
        if (rejectToken) {
          rejectToken(new Error('Push registration returned an empty token'));
          clearTokenWaiter();
        }
        return;
      }

      logPush('token:received', { platform: resolvePlatform() });
      if (resolveToken) {
        resolveToken(value);
        clearTokenWaiter();
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      logPush('token:error', {
        code: typeof (error as any)?.code === 'string' ? (error as any).code : undefined,
      });

      if (rejectToken) {
        const message =
          typeof (error as any)?.error === 'string' && (error as any).error.trim()
            ? (error as any).error.trim()
            : 'Push registration failed';
        rejectToken(new Error(message));
        clearTokenWaiter();
      }
    });

    listenersInitialized = true;
  })();

  try {
    await listenersInitPromise;
  } finally {
    listenersInitPromise = null;
  }
};

const waitForToken = async (): Promise<string> => {
  if (tokenPromise) return tokenPromise;

  tokenPromise = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;

    tokenTimeoutHandle = setTimeout(() => {
      if (rejectToken) {
        rejectToken(new Error('Push registration timed out'));
      }
      clearTokenWaiter();
    }, TOKEN_TIMEOUT_MS);
  }).finally(() => {
    tokenPromise = null;
  });

  return tokenPromise;
};

const ensurePushPermission = async (uid: string): Promise<boolean> => {
  const promptKey = `${PERMISSION_PROMPT_KEY_PREFIX}${uid}`;
  const permission = await PushNotifications.checkPermissions();
  const receive = permission.receive as PushPermissionReceiveState;

  if (receive === 'granted') return true;

  if (receive === 'denied') {
    logPush('permission:denied');
    return false;
  }

  const alreadyPrompted = readLocal(promptKey) === '1';
  if (alreadyPrompted) {
    logPush('permission:prompt-skipped');
    return false;
  }

  writeLocal(promptKey, '1');
  const requested = await PushNotifications.requestPermissions();
  const granted = requested.receive === 'granted';

  logPush(granted ? 'permission:granted' : 'permission:not-granted');
  return granted;
};

const resolveAppVersion = async (): Promise<string | undefined> => {
  try {
    const info = await CapacitorApp.getInfo();
    const version = typeof info.version === 'string' ? info.version.trim() : '';
    return version || undefined;
  } catch {
    return undefined;
  }
};

export async function registerNativePushNotifications(uid: string): Promise<void> {
  const normalizedUid = uid.trim();
  if (!normalizedUid || !isNativeCapacitorRuntime()) return;
  if (inFlightUsers.has(normalizedUid)) return;

  inFlightUsers.add(normalizedUid);
  try {
    const hasPermission = await ensurePushPermission(normalizedUid);
    if (!hasPermission) return;

    await ensurePushListeners();

    logPush('registration:start');
    await PushNotifications.register();
    const token = await waitForToken();

    const lastTokenKey = `${LAST_TOKEN_KEY_PREFIX}${normalizedUid}`;
    const previousToken = readLocal(lastTokenKey);
    const platform = resolvePlatform();
    const appVersion = await resolveAppVersion();

    const payload: RegisterNotificationTokenPayload = {
      token,
      platform,
      appVersion,
    };

    // Keep backend lastSeenAt fresh even when token did not rotate.
    await callFunction<{ ok: boolean }, RegisterNotificationTokenPayload>(
      'registerNotificationToken',
      payload,
    );

    if (previousToken !== token) {
      writeLocal(lastTokenKey, token);
    }

    logPush('registration:stored', { platform });
  } catch (error) {
    logPush('registration:failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    inFlightUsers.delete(normalizedUid);
  }
}

export default registerNativePushNotifications;
