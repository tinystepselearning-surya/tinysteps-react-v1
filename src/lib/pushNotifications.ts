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
const ANDROID_CLASS_REMINDERS_CHANNEL_ID = 'class_reminders';
const PUSH_ACTION_DEDUP_WINDOW_MS = 30_000;
const ANDROID_PERMISSION_PROMPT_HANDLED_KEY =
  'ts_android_notification_permission_prompt_handled_v1';
export const ANDROID_NOTIFICATION_PERMISSION_EVENT =
  'tinysteps:android-notification-permission';

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
let activeRegistrationUid: string | null = null;

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

const shouldLogPushDebug = () => import.meta.env.DEV;

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

export const hasHandledAndroidNotificationPermissionPrompt = () =>
  readLocal(ANDROID_PERMISSION_PROMPT_HANDLED_KEY) === '1';

export const dismissAndroidNotificationPermissionPrompt = () => {
  writeLocal(ANDROID_PERMISSION_PROMPT_HANDLED_KEY, '1');
};

const announceAndroidNotificationPermission = (state: 'prompt' | 'denied') => {
  if (typeof window === 'undefined' || typeof CustomEvent !== 'function') return;
  window.dispatchEvent(
    new CustomEvent(ANDROID_NOTIFICATION_PERMISSION_EVENT, {
      detail: { state },
    }),
  );
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

        logPush('token:received', { platform: resolvePlatform() });
        if (resolveToken) {
          resolveToken(value);
          clearTokenWaiter();
        } else if (activeRegistrationUid) {
          void persistNotificationToken(activeRegistrationUid, value, true);
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

export const ensureAndroidNotificationChannels = async () => {
  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  if (!isAndroidNative) return;
  if (typeof (PushNotifications as any).createChannel !== 'function') return;

  const channels = [
    {
      id: ANDROID_MESSAGES_CHANNEL_ID,
      name: 'Messages',
      description: 'Tiny Steps message alerts',
      importance: 4,
      visibility: 1,
      sound: 'default',
    },
    {
      id: ANDROID_CLASS_REMINDERS_CHANNEL_ID,
      name: 'Class reminders',
      description: 'Reminders 15 minutes before a Tiny Steps class',
      importance: 5,
      visibility: 1,
      sound: 'default',
    },
  ];

  for (const channel of channels) {
    try {
      logPush('channel:create:start', { channelId: channel.id });
      await (PushNotifications as any).createChannel(channel);
      logPush('channel:create:success', { channelId: channel.id });
    } catch (error) {
      logPush('channel:create:error', {
        channelId: channel.id,
        message: error instanceof Error ? error.message : String(error),
      });
      console.warn(`[push] unable to ensure android ${channel.id} channel`, error);
    }
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

const ensurePushPermission = async (
  allowAndroidSystemPrompt = false,
): Promise<boolean> => {
  const permission = await PushNotifications.checkPermissions();
  const receive = permission.receive as PushPermissionReceiveState;
  logPush('permission:check', { receive });

  if (receive === 'granted') return true;

  if (receive === 'denied') {
    logPush('permission:denied');
    return false;
  }

  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  if (isAndroidNative && !allowAndroidSystemPrompt) {
    if (!hasHandledAndroidNotificationPermissionPrompt()) {
      announceAndroidNotificationPermission('prompt');
    }
    return false;
  }

  const requested = await PushNotifications.requestPermissions();
  const granted = requested.receive === 'granted';

  logPush('permission:request-result', { receive: requested.receive });
  logPush(granted ? 'permission:granted' : 'permission:not-granted');
  if (isAndroidNative && !granted) {
    announceAndroidNotificationPermission('denied');
  }
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

const persistNotificationToken = async (
  uid: string,
  token: string,
  isRefresh = false,
) => {
  const platform = resolvePlatform();
  const provider = resolveProvider(platform);
  const appVersion = await resolveAppVersion();
  const payload: RegisterNotificationTokenPayload = {
    token,
    platform,
    provider,
    appVersion,
  };

  logPush(isRefresh ? 'registration:refresh-save-request' : 'registration:save-request', {
    platform,
    provider,
    tokenCollection: 'notificationTokens',
  });
  await callFunction<{ ok: boolean }, RegisterNotificationTokenPayload>(
    'registerNotificationToken',
    payload,
  );
  writeLocal(`${LAST_TOKEN_KEY_PREFIX}${uid}`, token);
  logPush(isRefresh ? 'registration:refresh-stored' : 'registration:stored', {
    platform,
    provider,
  });
};

export async function requestAndroidNotificationPermissionAndRegister(
  uid: string,
): Promise<'granted' | 'denied'> {
  dismissAndroidNotificationPermissionPrompt();
  const granted = await ensurePushPermission(true);
  if (!granted) return 'denied';
  await registerNativePushNotifications(uid);
  return 'granted';
}

export async function registerNativePushNotifications(uid: string): Promise<void> {
  const normalizedUid = uid.trim();
  if (!normalizedUid || !isNativeCapacitorRuntime()) return;
  if (inFlightUsers.has(normalizedUid)) return;

  inFlightUsers.add(normalizedUid);
  try {
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

    await ensureAndroidNotificationChannels();

    const hasPermission = await ensurePushPermission();
    if (!hasPermission) return;

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

    activeRegistrationUid = normalizedUid;
    await persistNotificationToken(normalizedUid, token);
  } catch (error) {
    logPush('registration:failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    inFlightUsers.delete(normalizedUid);
  }
}

export async function unregisterNativePushNotifications(): Promise<void> {
  activeRegistrationUid = null;
  try {
    await PushNotifications.unregister();
  } catch {
    // Logout must continue even when the native push bridge is unavailable.
  }
}

export default registerNativePushNotifications;
