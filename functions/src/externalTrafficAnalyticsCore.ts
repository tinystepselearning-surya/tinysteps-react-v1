export const EXTERNAL_TRAFFIC_TIME_ZONE = 'Asia/Kolkata';
export const EXTERNAL_TRAFFIC_SCHEMA_VERSION = 1;

export type ExternalTrafficPageRow = {
  path: string;
  sessions?: number;
  engagedSessions?: number;
  clicks?: number;
  impressions?: number;
  weightedPositionSum?: number;
};

export type ExternalTrafficProviderDay = {
  status: 'ok';
  syncedAt: string;
  partial?: boolean;
  truncated?: boolean;
  sessions?: number;
  engagedSessions?: number;
  clicks?: number;
  impressions?: number;
  weightedPositionSum?: number;
  pages: ExternalTrafficPageRow[];
};

export type ExternalTrafficDailyDoc = {
  schemaVersion?: number;
  dateKey: string;
  timeZone?: string;
  ga4?: ExternalTrafficProviderDay | null;
  gsc?: ExternalTrafficProviderDay | null;
};

export type ExternalTrafficAggregate = {
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

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DATE_KEY_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const addDaysToDateKey = (dateKey: string, days: number): string => {
  if (!isDateKey(dateKey)) throw new Error('Invalid date key.');
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const dateKeysInclusive = (startDateKey: string, endDateKey: string): string[] => {
  if (!isDateKey(startDateKey) || !isDateKey(endDateKey) || startDateKey > endDateKey) {
    throw new Error('Invalid date range.');
  }
  const keys: string[] = [];
  let cursor = startDateKey;
  while (cursor <= endDateKey) {
    keys.push(cursor);
    cursor = addDaysToDateKey(cursor, 1);
  }
  return keys;
};

export const previousEqualLengthRange = (
  startDateKey: string,
  endDateKey: string,
): { startDateKey: string; endDateKey: string } => {
  const days = dateKeysInclusive(startDateKey, endDateKey).length;
  const previousEnd = addDaysToDateKey(startDateKey, -1);
  return {
    startDateKey: addDaysToDateKey(previousEnd, -(days - 1)),
    endDateKey: previousEnd,
  };
};

const normalizeSlashPath = (path: string): string => {
  const withoutHash = path.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
};

export const normalizeExternalAnalyticsPath = (
  value: unknown,
  expectedOrigin = 'https://tinystepslearning.com',
): string | null => {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  if (raw.startsWith('/')) return normalizeSlashPath(raw);

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const expected = new URL(expectedOrigin);
      if (url.hostname.toLowerCase() !== expected.hostname.toLowerCase()) return null;
      return normalizeSlashPath(`${url.pathname}${url.search}`);
    } catch {
      return null;
    }
  }

  return null;
};

const finiteNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const aggregateExternalTrafficDocs = (
  docs: ExternalTrafficDailyDoc[],
  startDateKey: string,
  endDateKey: string,
): ExternalTrafficAggregate => {
  const expectedDays = dateKeysInclusive(startDateKey, endDateKey).length;
  const pageMap = new Map<string, {
    sessions: number;
    engagedSessions: number;
    clicks: number;
    impressions: number;
    weightedPositionSum: number;
  }>();

  const result: ExternalTrafficAggregate = {
    startDateKey,
    endDateKey,
    expectedDays,
    ga4: {
      coverageDays: 0,
      partialDays: 0,
      truncatedDays: 0,
      sessions: 0,
      engagedSessions: 0,
    },
    gsc: {
      coverageDays: 0,
      partialDays: 0,
      truncatedDays: 0,
      clicks: 0,
      impressions: 0,
      weightedPositionSum: 0,
      averagePosition: null,
    },
    pages: [],
  };

  const seenDates = new Set<string>();
  docs.forEach((doc) => {
    if (!isDateKey(doc.dateKey) || doc.dateKey < startDateKey || doc.dateKey > endDateKey) return;
    if (seenDates.has(doc.dateKey)) return;
    seenDates.add(doc.dateKey);

    if (doc.ga4?.status === 'ok') {
      result.ga4.coverageDays += 1;
      if (doc.ga4.partial) result.ga4.partialDays += 1;
      if (doc.ga4.truncated) result.ga4.truncatedDays += 1;
      result.ga4.sessions += finiteNumber(doc.ga4.sessions);
      result.ga4.engagedSessions += finiteNumber(doc.ga4.engagedSessions);
      doc.ga4.pages.forEach((page) => {
        const path = normalizeExternalAnalyticsPath(page.path);
        if (!path) return;
        const bucket = pageMap.get(path) || {
          sessions: 0,
          engagedSessions: 0,
          clicks: 0,
          impressions: 0,
          weightedPositionSum: 0,
        };
        bucket.sessions += finiteNumber(page.sessions);
        bucket.engagedSessions += finiteNumber(page.engagedSessions);
        pageMap.set(path, bucket);
      });
    }

    if (doc.gsc?.status === 'ok') {
      result.gsc.coverageDays += 1;
      if (doc.gsc.partial) result.gsc.partialDays += 1;
      if (doc.gsc.truncated) result.gsc.truncatedDays += 1;
      result.gsc.clicks += finiteNumber(doc.gsc.clicks);
      result.gsc.impressions += finiteNumber(doc.gsc.impressions);
      result.gsc.weightedPositionSum += finiteNumber(doc.gsc.weightedPositionSum);
      doc.gsc.pages.forEach((page) => {
        const path = normalizeExternalAnalyticsPath(page.path);
        if (!path) return;
        const bucket = pageMap.get(path) || {
          sessions: 0,
          engagedSessions: 0,
          clicks: 0,
          impressions: 0,
          weightedPositionSum: 0,
        };
        bucket.clicks += finiteNumber(page.clicks);
        bucket.impressions += finiteNumber(page.impressions);
        bucket.weightedPositionSum += finiteNumber(page.weightedPositionSum);
        pageMap.set(path, bucket);
      });
    }
  });

  result.gsc.averagePosition = result.gsc.impressions > 0
    ? result.gsc.weightedPositionSum / result.gsc.impressions
    : null;

  result.pages = Array.from(pageMap.entries())
    .map(([path, metrics]) => ({
      path,
      sessions: metrics.sessions,
      engagedSessions: metrics.engagedSessions,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      averagePosition: metrics.impressions > 0
        ? metrics.weightedPositionSum / metrics.impressions
        : null,
    }))
    .sort((a, b) =>
      b.sessions - a.sessions ||
      b.clicks - a.clicks ||
      b.impressions - a.impressions ||
      a.path.localeCompare(b.path),
    );

  return result;
};
