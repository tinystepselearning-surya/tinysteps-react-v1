import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export type ExternalTrafficProviderStatus = {
  status?: 'ok' | 'not_configured' | 'credential_error' | 'error';
  lastAttemptAt?: string;
  lastSuccessfulAt?: string | null;
  error?: string;
};

export type ExternalTrafficPeriod = {
  startDateKey: string;
  endDateKey: string;
  expectedDays: number;
  ga4: {
    coverageDays: number;
    partialDays: number;
    truncatedDays: number;
    sessions: number;
    engagedSessions: number;
  };
  gsc: {
    coverageDays: number;
    partialDays: number;
    truncatedDays: number;
    clicks: number;
    impressions: number;
    weightedPositionSum: number;
    averagePosition: number | null;
  };
  pages: Array<{
    path: string;
    sessions: number;
    engagedSessions: number;
    clicks: number;
    impressions: number;
    averagePosition: number | null;
  }>;
};

export type ExternalTrafficAnalyticsResponse = {
  schemaVersion: number;
  timeZone: string;
  configuration: {
    ga4Configured: boolean;
    gscConfigured: boolean;
    siteOrigin: string;
  };
  sync?: {
    providers?: {
      ga4?: ExternalTrafficProviderStatus;
      gsc?: ExternalTrafficProviderStatus;
    };
    lastAttempt?: {
      startDateKey?: string;
      endDateKey?: string;
      reason?: string;
      at?: string;
    };
  };
  current: ExternalTrafficPeriod;
  previous: ExternalTrafficPeriod;
};

export type ExternalTrafficSyncResponse = {
  ok: boolean;
  startDateKey: string;
  endDateKey: string;
  providers: {
    ga4: ExternalTrafficProviderStatus;
    gsc: ExternalTrafficProviderStatus;
  };
};

const getAnalytics = httpsCallable<
  { startDateKey: string; endDateKey: string },
  ExternalTrafficAnalyticsResponse
>(functions, 'getAdminExternalTrafficAnalytics');

const syncAnalytics = httpsCallable<
  { startDateKey: string; endDateKey: string },
  ExternalTrafficSyncResponse
>(functions, 'adminSyncExternalTrafficAnalytics');

type LoadCacheEntry = {
  expiresAt: number;
  promise: Promise<ExternalTrafficAnalyticsResponse>;
};

const LOAD_CACHE_TTL_MS = 60 * 1000;
const loadCache = new Map<string, LoadCacheEntry>();

export function clearExternalTrafficAnalyticsCache(): void {
  loadCache.clear();
}

export async function loadExternalTrafficAnalytics(
  startDateKey: string,
  endDateKey: string,
  options: { force?: boolean } = {},
): Promise<ExternalTrafficAnalyticsResponse> {
  const key = `${startDateKey}:${endDateKey}`;
  const now = Date.now();
  const existing = loadCache.get(key);
  if (!options.force && existing && existing.expiresAt > now) return existing.promise;

  const promise = getAnalytics({ startDateKey, endDateKey })
    .then((response) => response.data)
    .catch((error) => {
      const current = loadCache.get(key);
      if (current?.promise === promise) loadCache.delete(key);
      throw error;
    });
  loadCache.set(key, { expiresAt: now + LOAD_CACHE_TTL_MS, promise });
  return promise;
}

export async function syncExternalTrafficAnalytics(
  startDateKey: string,
  endDateKey: string,
): Promise<ExternalTrafficSyncResponse> {
  const response = await syncAnalytics({ startDateKey, endDateKey });
  clearExternalTrafficAnalyticsCache();
  return response.data;
}
