export const OPEN_MESSAGES_FROM_PUSH_EVENT = 'tinysteps:open-messages-from-push';

const PENDING_PUSH_OPEN_KEY = 'ts_pending_push_open_v1';

export type PendingPushOpenPayload = {
  route: string;
  threadId: string | null;
  createdAtMs: number;
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  return value as Record<string, unknown>;
};

export const asOptionalString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const normalizePushRoute = (value: unknown): string => {
  const route = asOptionalString(value);
  if (!route || !route.startsWith('/')) return '/messages';
  return route;
};

export const queuePendingPushOpenRoute = (route: string, threadId?: string) => {
  const payload: PendingPushOpenPayload = {
    route: normalizePushRoute(route),
    threadId: asOptionalString(threadId) || null,
    createdAtMs: Date.now(),
  };

  try {
    localStorage.setItem(PENDING_PUSH_OPEN_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
};

export const consumePendingPushOpenRoute = (): PendingPushOpenPayload | null => {
  try {
    const raw = localStorage.getItem(PENDING_PUSH_OPEN_KEY);
    if (!raw) return null;

    localStorage.removeItem(PENDING_PUSH_OPEN_KEY);
    const data = asRecord(JSON.parse(raw));
    const route = normalizePushRoute(data.route);
    const threadId = asOptionalString(data.threadId) || null;
    const createdAtMs = Number(data.createdAtMs);

    return {
      route,
      threadId,
      createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : Date.now(),
    };
  } catch {
    return null;
  }
};
