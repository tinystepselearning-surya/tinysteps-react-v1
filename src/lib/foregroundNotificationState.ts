import {
  OPEN_MESSAGES_FROM_PUSH_EVENT,
  queuePendingPushDestination,
  type PushDestination,
} from './pushNavigationState';

export type ForegroundNotification = {
  id: string;
  kind: 'message' | 'class_reminder';
  title: string;
  body: string;
  receivedAtMs: number;
  destination: PushDestination;
};

type Listener = (notification: ForegroundNotification | null) => void;

const listeners = new Set<Listener>();
const recentlyPresentedIds = new Map<string, number>();
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
let currentNotification: ForegroundNotification | null = null;
let activeMessageThreadId: string | null = null;

export const sanitizeForegroundNotificationText = (
  value: string,
  fallback: string,
): string => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return fallback;
  if (/\+\s*\d/.test(normalized) || /\d{5,}/.test(normalized)) return fallback;
  return normalized;
};

const prunePresentedIds = (now: number) => {
  recentlyPresentedIds.forEach((presentedAt, id) => {
    if (now - presentedAt > DEDUPE_WINDOW_MS) recentlyPresentedIds.delete(id);
  });
};

const emit = () => {
  listeners.forEach((listener) => listener(currentNotification));
};

export const setActiveMessageThread = (threadId: string | null) => {
  activeMessageThreadId = threadId?.trim() || null;
};

export const getActiveMessageThread = (): string | null => activeMessageThreadId;

export const presentForegroundNotification = (
  notification: ForegroundNotification,
): boolean => {
  const now = Date.now();
  prunePresentedIds(now);
  if (recentlyPresentedIds.has(notification.id)) return false;
  if (
    notification.kind === 'message' &&
    notification.destination.type === 'message' &&
    notification.destination.threadId &&
    notification.destination.threadId === activeMessageThreadId
  ) {
    recentlyPresentedIds.set(notification.id, now);
    return false;
  }

  recentlyPresentedIds.set(notification.id, now);
  currentNotification = notification;
  emit();
  return true;
};

export const dismissForegroundNotification = (id?: string) => {
  if (id && currentNotification?.id !== id) return;
  currentNotification = null;
  emit();
};

export const subscribeForegroundNotifications = (listener: Listener) => {
  listeners.add(listener);
  listener(currentNotification);
  return () => {
    listeners.delete(listener);
  };
};

export const openForegroundNotification = (notification: ForegroundNotification) => {
  queuePendingPushDestination(notification.destination);
  dismissForegroundNotification(notification.id);
  window.dispatchEvent(
    new CustomEvent(OPEN_MESSAGES_FROM_PUSH_EVENT, {
      detail: {
        route: notification.destination.route,
        actionId: notification.id,
      },
    }),
  );
};

export const resetForegroundNotificationStateForTests = () => {
  currentNotification = null;
  activeMessageThreadId = null;
  recentlyPresentedIds.clear();
  listeners.clear();
};
