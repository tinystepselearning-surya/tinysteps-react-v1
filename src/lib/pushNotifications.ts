import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { callFunction } from './callFunctions';
import {
  presentForegroundNotification,
  sanitizeForegroundNotificationText,
} from './foregroundNotificationState';
import {
  asOptionalString,
  OPEN_MESSAGES_FROM_PUSH_EVENT,
  parsePushDestination,
  queuePendingPushDestination,
} from './pushNavigationState';

const TOKEN_TIMEOUT_MS = 15_000;
const LAST_TOKEN_KEY_PREFIX = 'ts_push_last_token_v1:';
const ANDROID_MESSAGES_CHANNEL_ID = 'messages';
const PUSH_ACTION_DEDUP_WINDOW_MS = 30_000;

type SupportedPlatform = 'ios' | 'android' | 'web';
type SupportedProvider = 'apns' | 'fcm';

type RegisterNotificationTokenPayload = {
  token: string;
  platform: SupportedPlatform;
  provider: SupportedProvider;
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
const handledPushActions = new Map<string, number>();

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

const maskToken = (token: string): string => {
  const normalized = token.trim();
  if (normalized.length <= 10) return `${normalized.slice(0, 3)}***`;
  return `${normalized.slice(0, 6)}...${normalized.slice(-4)}`;
};

const sha256Hex = async (value: string): Promise<string | null> => {
  try {
    if (!globalThis.crypto?.subtle) return null;
    const bytes = new TextEncoder().encode(value);
    const hash = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
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

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  if (typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

const dispatchOpenMessagesEvent = (
  route: string,
  threadId: string | undefined,
  actionId: string,
) => {
  if (typeof window === 'undefined') return;

  const normalizedThreadId = asOptionalString(threadId) || null;
  const detail = {
    route,
    threadId: normalizedThreadId,
    actionId,
  };

  try {
    if (typeof CustomEvent !== 'function') return;

    window.dispatchEvent(
      new CustomEvent(OPEN_MESSAGES_FROM_PUSH_EVENT, {
        detail,
      }),
    );
  } catch (error) {
    console.warn('[push] unable to dispatch open-messages event', error);
  }
};

const rememberPushAction = (actionId: string): boolean => {
  const now = Date.now();
  for (const [id, handledAt] of handledPushActions) {
    if (now - handledAt > PUSH_ACTION_DEDUP_WINDOW_MS) {
      handledPushActions.delete(id);
    }
  }
  if (handledPushActions.has(actionId)) return false;
  handledPushActions.set(actionId, now);
  return true;
};

export const handlePushNotificationReceived = (notification: unknown) => {
  try {
    const notificationRecord = asRecord(notification);
    const data = asRecord(notificationRecord.data);
    logPush('received', {
      type: asOptionalString(data.type) || 'unknown',
      foreground:
        typeof document !== 'undefined'
          ? document.visibilityState === 'visible'
          : undefined,
    });
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    const destination = parsePushDestination(
      data.type,
      data.route,
      data.threadId,
      data.sessionId,
    );
    if (!destination) return;

    const fallbackTitle =
      destination.type === 'message' ? 'New message' : 'Class starts soon';
    const fallbackBody =
      destination.type === 'message'
        ? 'Open Messages to view the latest update.'
        : 'Tap to view your class.';
    const title = sanitizeForegroundNotificationText(
      asOptionalString(notificationRecord.title) || '',
      fallbackTitle,
    );
    const body = sanitizeForegroundNotificationText(
      asOptionalString(notificationRecord.body) || '',
      fallbackBody,
    );
    const id =
      asOptionalString(data.messageId) ||
      asOptionalString(data.notificationId) ||
      asOptionalString(data.sessionId) ||
      asOptionalString(notificationRecord.id) ||
      `${destination.type}:${destination.route}`;

    presentForegroundNotification({
      id,
      kind: destination.type,
      title,
      body,
      receivedAtMs: Date.now(),
      destination,
    });
  } catch (error) {
    console.warn('[push] pushNotificationReceived handler failed', error);
  }
};

export const handlePushNotificationActionPerformed = (event: unknown) => {
  try {
    const eventRecord = asRecord(event);
    const notification = asRecord(eventRecord.notification);
    const data = asRecord(notification.data);
    const destination = parsePushDestination(
      data.type,
      data.route,
      data.threadId,
      data.sessionId,
    );
    if (!destination) return;
    const threadId =
      destination.type === 'message'
        ? destination.threadId || undefined
        : undefined;
    const actionId =
      asOptionalString(data.messageId) ||
      asOptionalString(data.notificationId) ||
      asOptionalString(notification.id) ||
      `${destination.route}:${threadId || destination.type}`;

    logPush('action', {
      type: asOptionalString(data.type) || 'unknown',
      route: destination.route,
      hasThreadId: Boolean(threadId),
    });
    if (!rememberPushAction(actionId)) return;

    queuePendingPushDestination(destination);
    dispatchOpenMessagesEvent(destination.route, threadId, actionId);
  } catch (error) {
    console.warn('[push] pushNotificationActionPerformed handler failed', error);
  }
};

const resolvePlatform = (): SupportedPlatform => {
  const platform = String(Capacitor.getPlatform?.() || '').toLowerCase();
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  return 'ios';
};

const resolveProvider = (platform: SupportedPlatform): SupportedProvider =>
  platform === 'ios' ? 'apns' : 'fcm';

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
      try {
        const value = typeof token?.value === 'string' ? token.value.trim() : '';
        if (!value) {
          if (rejectToken) {
            rejectToken(new Error('Push registration returned an empty token'));
            clearTokenWaiter();
          }
          return;
        }

        logPush('token:received', {
          platform: resolvePlatform(),
          tokenPreview: maskToken(value),
        });
        if (resolveToken) {
          resolveToken(value);
          clearTokenWaiter();
        }
      } catch (error) {
        console.warn('[push] registration listener failed', error);
      }
    });

    await PushNotifications.addListener('registrationError', (error) => {
      try {
        const errorMessage =
          typeof (error as any)?.error === 'string' ? (error as any).error : undefined;
        logPush('token:error', {
          code: typeof (error as any)?.code === 'string' ? (error as any).code : undefined,
          message: errorMessage,
        });

        if (rejectToken) {
          const message =
            typeof (error as any)?.error === 'string' && (error as any).error.trim()
              ? (error as any).error.trim()
              : 'Push registration failed';
          rejectToken(new Error(message));
          clearTokenWaiter();
        }
      } catch (nextError) {
        console.warn('[push] registrationError listener failed', nextError);
      }
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handlePushNotificationReceived(notification);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      handlePushNotificationActionPerformed(event);
    });

    listenersInitialized = true;
  })();

  try {
    await listenersInitPromise;
  } finally {
    listenersInitPromise = null;
  }
};

const ensureAndroidMessageChannel = async () => {
  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) return;
  if (typeof (PushNotifications as any).createChannel !== 'function') return;

  try {
    logPush('channel:create:start', { channelId: ANDROID_MESSAGES_CHANNEL_ID });
    await (PushNotifications as any).createChannel({
      id: ANDROID_MESSAGES_CHANNEL_ID,
      name: 'Messages',
      description: 'Tiny Steps message alerts',
      importance: 5,
      visibility: 1,
      sound: 'default',
    });
    logPush('channel:create:success', { channelId: ANDROID_MESSAGES_CHANNEL_ID });
  } catch (error) {
    logPush('channel:create:error', {
      channelId: ANDROID_MESSAGES_CHANNEL_ID,
      message: error instanceof Error ? error.message : String(error),
    });
    console.warn('[push] unable to ensure android messages channel', error);
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

const ensurePushPermission = async (): Promise<boolean> => {
  const permission = await PushNotifications.checkPermissions();
  const receive = permission.receive as PushPermissionReceiveState;
  logPush('permission:check', { receive });

  if (receive === 'granted') return true;

  if (receive === 'denied') {
    logPush('permission:denied');
    return false;
  }

  const requested = await PushNotifications.requestPermissions();
  const granted = requested.receive === 'granted';

  logPush('permission:request-result', { receive: requested.receive });
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
    const hasPermission = await ensurePushPermission();
    if (!hasPermission) return;

    await ensurePushListeners();

    const isAndroidNative =
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    if (
      isAndroidNative &&
      typeof Capacitor.isPluginAvailable === 'function' &&
      !Capacitor.isPluginAvailable('PushNotifications')
    ) {
      console.warn('[push] android native push plugin unavailable; skipping registration');
      return;
    }

    await ensureAndroidMessageChannel();

    logPush('registration:start');
    logPush('registration:register-called', { platform: resolvePlatform() });
    try {
      await PushNotifications.register();
    } catch (error) {
      logPush('registration:register-error', {
        message: error instanceof Error ? error.message : String(error),
      });
      console.warn('[push] PushNotifications.register() failed; skipping registration', error);
      return;
    }
    const token = await waitForToken();

    const lastTokenKey = `${LAST_TOKEN_KEY_PREFIX}${normalizedUid}`;
    const previousToken = readLocal(lastTokenKey);
    const platform = resolvePlatform();
    const provider = resolveProvider(platform);
    const appVersion = await resolveAppVersion();

    const payload: RegisterNotificationTokenPayload = {
      token,
      platform,
      provider,
      appVersion,
    };

    logPush('registration:save-request', {
      platform,
      provider,
      tokenPreview: maskToken(token),
      tokenCollection: 'notificationTokens',
    });

    // Keep backend lastSeenAt fresh even when token did not rotate.
    await callFunction<{ ok: boolean }, RegisterNotificationTokenPayload>(
      'registerNotificationToken',
      payload,
    );

    const tokenDocId = await sha256Hex(token);
    const tokenDocPath = tokenDocId ? `notificationTokens/${tokenDocId}` : 'notificationTokens/<sha256(token)>';

    if (previousToken !== token) {
      writeLocal(lastTokenKey, token);
    }

    logPush('registration:stored', {
      platform,
      provider,
      tokenDocPath,
    });
  } catch (error) {
    logPush('registration:failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    inFlightUsers.delete(normalizedUid);
  }
}

export default registerNativePushNotifications;
