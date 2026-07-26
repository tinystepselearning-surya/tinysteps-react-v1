export const OPEN_MESSAGES_FROM_PUSH_EVENT = 'tinysteps:open-messages-from-push';

const PENDING_PUSH_OPEN_KEY = 'ts_pending_push_open_v1';
export const PENDING_PUSH_OPEN_MAX_AGE_MS = 10 * 60 * 1000;

export type PushDestination =
  | {
      type: 'message';
      route: string;
      threadId: string | null;
    }
  | {
      type: 'class_reminder';
      route: string;
      sessionId: string | null;
    };

export type PendingPushOpenPayload = {
  type: PushDestination['type'];
  route: string;
  threadId: string | null;
  sessionId: string | null;
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

const hasUnsafeRouteSyntax = (route: string) =>
  route.startsWith('//') ||
  route.includes('\\') ||
  route.includes('://') ||
  /[\u0000-\u001f]/.test(route);

export const normalizePushRoute = (value: unknown): string => {
  const route = asOptionalString(value);
  if (!route || hasUnsafeRouteSyntax(route)) return '/messages';
  if (route === '/messages' || /^\/messages\/[^/?#]+$/.test(route)) return route;
  if (route === '/parent?tab=classes') return route;
  if (route === '/teacher?tab=today') return route;
  if (route === '/learning-partner/dashboard') return route;
  return '/messages';
};

export const parsePushDestination = (
  typeValue: unknown,
  routeValue: unknown,
  threadIdValue?: unknown,
  sessionIdValue?: unknown,
): PushDestination | null => {
  const type = asOptionalString(typeValue)?.toLowerCase();
  const route = asOptionalString(routeValue);
  if (!route || hasUnsafeRouteSyntax(route)) return null;

  if (type === 'message') {
    if (route !== '/messages' && !/^\/messages\/[^/?#]+$/.test(route)) return null;
    let routeThreadId: string | null = null;
    if (route !== '/messages') {
      try {
        routeThreadId = decodeURIComponent(route.slice('/messages/'.length));
      } catch {
        return null;
      }
    }
    const threadId = asOptionalString(threadIdValue) || routeThreadId;
    return { type: 'message', route, threadId };
  }

  if (type === 'class_reminder') {
    if (
      route !== '/parent?tab=classes' &&
      route !== '/teacher?tab=today' &&
      route !== '/learning-partner/dashboard'
    ) {
      return null;
    }
    return {
      type: 'class_reminder',
      route,
      sessionId: asOptionalString(sessionIdValue),
    };
  }

  return null;
};

export const getPendingPushDestination = (
  payload: PendingPushOpenPayload,
): string => {
  if (payload.threadId) {
    return `/messages/${encodeURIComponent(payload.threadId)}`;
  }
  return normalizePushRoute(payload.route);
};

export const queuePendingPushOpenRoute = (route: string, threadId?: string) => {
  queuePendingPushDestination({
    type: 'message',
    route: normalizePushRoute(route),
    threadId: asOptionalString(threadId),
  });
};

export const queuePendingPushDestination = (destination: PushDestination) => {
  const payload: PendingPushOpenPayload = {
    type: destination.type,
    route: destination.route,
    threadId: destination.type === 'message' ? destination.threadId : null,
    sessionId: destination.type === 'class_reminder' ? destination.sessionId : null,
    createdAtMs: Date.now(),
  };

  try {
    localStorage.setItem(PENDING_PUSH_OPEN_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
};

export const clearPendingPushOpenRoute = () => {
  try {
    localStorage.removeItem(PENDING_PUSH_OPEN_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const getPendingPushOpenRoute = (): PendingPushOpenPayload | null => {
  try {
    const raw = localStorage.getItem(PENDING_PUSH_OPEN_KEY);
    if (!raw) return null;

    const data = asRecord(JSON.parse(raw));
    const destination = parsePushDestination(
      data.type || 'message',
      data.route,
      data.threadId,
      data.sessionId,
    );
    const createdAtMs = Number(data.createdAtMs);
    if (
      !destination ||
      !Number.isFinite(createdAtMs) ||
      createdAtMs > Date.now() ||
      Date.now() - createdAtMs > PENDING_PUSH_OPEN_MAX_AGE_MS
    ) {
      clearPendingPushOpenRoute();
      return null;
    }

    return {
      type: destination.type,
      route: destination.route,
      threadId: destination.type === 'message' ? destination.threadId : null,
      sessionId: destination.type === 'class_reminder' ? destination.sessionId : null,
      createdAtMs,
    };
  } catch {
    clearPendingPushOpenRoute();
    return null;
  }
};
