const PENDING_NATIVE_DEEP_LINK_KEY = 'ts_pending_native_deep_link_v1';
const MAX_PENDING_AGE_MS = 10 * 60 * 1000;
const HTTPS_ORIGIN = 'https://tinystepslearning.com';
const CUSTOM_SCHEME = 'com.tinystepslearning.app:';
const PARENT_TABS = new Set([
  'dashboard',
  'classes',
  'messages',
  'payments',
  'insights',
  'games-progress',
  'skills',
  'holidays',
  'profile',
]);

type PendingNativeDeepLink = {
  route: string;
  createdAtMs: number;
};

const sanitizeId = (value: string | null) => {
  const normalized = String(value || '').trim();
  return /^[A-Za-z0-9_-]{1,160}$/.test(normalized) ? normalized : null;
};

export const parseNativeDeepLink = (rawUrl: unknown): string | null => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const isProductionHttps = url.origin === HTTPS_ORIGIN;
  const isCustomScheme =
    url.protocol === CUSTOM_SCHEME && url.hostname.toLowerCase() === 'open';
  if (!isProductionHttps && !isCustomScheme) return null;

  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/parent') {
    const tab = String(url.searchParams.get('tab') || 'dashboard').trim();
    if (!PARENT_TABS.has(tab)) return null;
    const params = new URLSearchParams({ tab });
    const kidId = sanitizeId(url.searchParams.get('kidId'));
    if (kidId) params.set('kidId', kidId);
    return `/parent?${params.toString()}`;
  }

  if (pathname === '/messages') return '/messages';
  if (pathname.startsWith('/messages/')) {
    const threadId = sanitizeId(pathname.slice('/messages/'.length));
    return threadId ? `/messages/${encodeURIComponent(threadId)}` : null;
  }
  if (pathname === '/teacher' && url.searchParams.get('tab') === 'today') {
    return '/teacher?tab=today';
  }
  if (pathname === '/learning-partner/dashboard') {
    return '/learning-partner/dashboard';
  }
  if (pathname === '/kids/games/english-excellence') {
    const kidId = sanitizeId(url.searchParams.get('kidId'));
    return kidId
      ? `/kids/games/english-excellence?kidId=${encodeURIComponent(kidId)}`
      : '/kids/games/english-excellence';
  }
  return null;
};

export const queuePendingNativeDeepLink = (route: string) => {
  const payload: PendingNativeDeepLink = { route, createdAtMs: Date.now() };
  try {
    localStorage.setItem(PENDING_NATIVE_DEEP_LINK_KEY, JSON.stringify(payload));
  } catch {
    // A protected route remains inaccessible if persistence is unavailable.
  }
};

export const getPendingNativeDeepLink = (): string | null => {
  try {
    const raw = localStorage.getItem(PENDING_NATIVE_DEEP_LINK_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as Partial<PendingNativeDeepLink>;
    const createdAtMs = Number(payload.createdAtMs);
    const route =
      typeof payload.route === 'string'
        ? parseNativeDeepLink(`${HTTPS_ORIGIN}${payload.route}`)
        : null;
    if (
      !route ||
      !Number.isFinite(createdAtMs) ||
      createdAtMs > Date.now() ||
      Date.now() - createdAtMs > MAX_PENDING_AGE_MS
    ) {
      clearPendingNativeDeepLink();
      return null;
    }
    return route;
  } catch {
    clearPendingNativeDeepLink();
    return null;
  }
};

export const clearPendingNativeDeepLink = () => {
  try {
    localStorage.removeItem(PENDING_NATIVE_DEEP_LINK_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }
};
