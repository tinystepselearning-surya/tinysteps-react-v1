import { createSign } from 'node:crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import {
  EXTERNAL_TRAFFIC_SCHEMA_VERSION,
  EXTERNAL_TRAFFIC_TIME_ZONE,
  addDaysToDateKey,
  aggregateExternalTrafficDocs,
  dateKeysInclusive,
  isDateKey,
  normalizeExternalAnalyticsPath,
  previousEqualLengthRange,
  type ExternalTrafficDailyDoc,
  type ExternalTrafficProviderDay,
} from './externalTrafficAnalyticsCore';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DAILY_COLLECTION = 'externalTrafficAnalyticsDaily';
const META_DOC_PATH = 'externalTrafficAnalyticsMeta/current';
const DEFAULT_SITE_ORIGIN = 'https://tinystepslearning.com';
const DEFAULT_SECRET_NAME = 'external-analytics-service-account-json';
const MAX_MANUAL_SYNC_DAYS = 31;
const MAX_READ_DAYS = 93;
const DAILY_REFRESH_LOOKBACK_DAYS = 7;
const GA4_ROW_LIMIT = 100000;
const GSC_ROW_LIMIT = 25000;

const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

interface ServiceAccountSecret {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

type ProviderStatus = 'ok' | 'not_configured' | 'credential_error' | 'error';

type SyncProviderStatus = {
  status: ProviderStatus;
  lastAttemptAt: string;
  lastSuccessfulAt?: string;
  error?: string;
};

type SyncMeta = {
  schemaVersion: number;
  configuration?: {
    ga4Configured?: boolean;
    gscConfigured?: boolean;
    siteOrigin?: string;
  };
  providers?: {
    ga4?: SyncProviderStatus;
    gsc?: SyncProviderStatus;
  };
  lastAttempt?: {
    startDateKey?: string;
    endDateKey?: string;
    reason?: string;
    at?: string;
  };
};

type Ga4RunReportResponse = {
  rowCount?: number;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};

type GscSearchAnalyticsResponse = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    position?: number;
  }>;
  metadata?: {
    first_incomplete_date?: string;
    firstIncompleteDate?: string;
  };
};

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) return cleanText(error.message, 360) || 'Unknown error';
  return cleanText(error, 360) || 'Unknown error';
};

const ga4PropertyId = (): string =>
  cleanText(process.env.GA4_PROPERTY_ID, 80).replace(/^properties\//i, '');

const gscSiteUrl = (): string => cleanText(process.env.GSC_SITE_URL, 240);
const siteOrigin = (): string => cleanText(process.env.PUBLIC_SITE_ORIGIN, 240) || DEFAULT_SITE_ORIGIN;
const credentialSecretName = (): string =>
  cleanText(process.env.EXTERNAL_ANALYTICS_SERVICE_ACCOUNT_SECRET, 160) || DEFAULT_SECRET_NAME;

const todayIstDateKey = (): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EXTERNAL_TRAFFIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return `${year}-${month}-${day}`;
};

const assertRange = (
  startDateKey: unknown,
  endDateKey: unknown,
  maxDays: number,
): { startDateKey: string; endDateKey: string } => {
  if (!isDateKey(startDateKey) || !isDateKey(endDateKey) || startDateKey > endDateKey) {
    throw new HttpsError('invalid-argument', 'Provide a valid YYYY-MM-DD reporting range.');
  }
  const days = dateKeysInclusive(startDateKey, endDateKey).length;
  if (days > maxDays) {
    throw new HttpsError('invalid-argument', `Reporting range cannot exceed ${maxDays} days.`);
  }
  if (endDateKey > todayIstDateKey()) {
    throw new HttpsError('invalid-argument', 'Reporting range cannot extend into the future.');
  }
  return { startDateKey, endDateKey };
};

const resolveAdmin = async (auth: any): Promise<string> => {
  const uid = cleanText(auth?.uid, 160);
  if (!uid) throw new HttpsError('unauthenticated', 'Admin sign-in is required.');

  const tokenRole = cleanText(auth?.token?.role, 80).toLowerCase();
  if (auth?.token?.admin === true || tokenRole === 'admin' || tokenRole === 'superadmin') return uid;

  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  const data = userSnap.data() || {};
  const role = cleanText(data.role, 80).toLowerCase();
  if (data.superUser === true || role === 'admin' || role === 'superadmin') return uid;
  throw new HttpsError('permission-denied', 'Admin access is required.');
};

const base64Url = (value: string | Buffer): string =>
  Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

let secretManagerClient: SecretManagerServiceClient | null = null;

const getSecretManagerClient = (): SecretManagerServiceClient => {
  if (!secretManagerClient) secretManagerClient = new SecretManagerServiceClient();
  return secretManagerClient;
};

const loadServiceAccountSecret = async (): Promise<ServiceAccountSecret> => {
  const projectId = cleanText(process.env.GCLOUD_PROJECT, 160) || cleanText(admin.app().options.projectId, 160);
  if (!projectId) throw new Error('Firebase project id is unavailable for Secret Manager lookup.');

  const [version] = await getSecretManagerClient().accessSecretVersion({
    name: `projects/${projectId}/secrets/${credentialSecretName()}/versions/latest`,
  });
  const raw = version.payload?.data?.toString('utf8') || '';
  if (!raw) throw new Error('External analytics service-account secret is empty.');

  let parsed: Partial<ServiceAccountSecret>;
  try {
    parsed = JSON.parse(raw) as Partial<ServiceAccountSecret>;
  } catch {
    throw new Error('External analytics service-account secret is not valid JSON.');
  }

  const clientEmail = cleanText(parsed.client_email, 320);
  const privateKey = cleanText(parsed.private_key, 12000).replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey.includes('PRIVATE KEY')) {
    throw new Error('External analytics service-account secret is missing client_email/private_key.');
  }

  return {
    client_email: clientEmail,
    private_key: privateKey,
    token_uri: cleanText(parsed.token_uri, 320) || 'https://oauth2.googleapis.com/token',
  };
};

const mintGoogleAccessToken = async (): Promise<string> => {
  const serviceAccount = await loadServiceAccountSecret();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: `${ANALYTICS_SCOPE} ${SEARCH_CONSOLE_SCOPE}`,
    aud: serviceAccount.token_uri,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  }));
  const unsignedJwt = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64Url(signer.sign(serviceAccount.private_key));
  const assertion = `${unsignedJwt}.${signature}`;

  const response = await fetch(serviceAccount.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  const payload = await response.json() as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || `Google OAuth token request failed (${response.status}).`);
  }
  return payload.access_token;
};

const fetchGoogleJson = async <T>(
  url: string,
  token: string,
  body: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) {
    const message = payload?.error?.message || `Google API request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
};

const formatGa4Date = (value: string): string | null => {
  if (!/^\d{8}$/.test(value)) return null;
  const dateKey = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return isDateKey(dateKey) ? dateKey : null;
};

const makeEmptyGa4Days = (startDateKey: string, endDateKey: string): Map<string, ExternalTrafficProviderDay> =>
  new Map(dateKeysInclusive(startDateKey, endDateKey).map((dateKey) => [dateKey, {
    status: 'ok' as const,
    syncedAt: new Date().toISOString(),
    partial: dateKey === todayIstDateKey(),
    sessions: 0,
    engagedSessions: 0,
    pages: [],
  }]));

const fetchGa4Daily = async (
  token: string,
  startDateKey: string,
  endDateKey: string,
): Promise<Map<string, ExternalTrafficProviderDay>> => {
  const propertyId = ga4PropertyId();
  if (!/^\d+$/.test(propertyId)) throw new Error('GA4_PROPERTY_ID must be the numeric GA4 property id.');
  const hostName = new URL(siteOrigin()).hostname;
  const response = await fetchGoogleJson<Ga4RunReportResponse>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    token,
    {
      dateRanges: [{ startDate: startDateKey, endDate: endDateKey }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }],
      metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: { matchType: 'EXACT', value: hostName, caseSensitive: false },
        },
      },
      limit: String(GA4_ROW_LIMIT),
    },
  );

  const days = makeEmptyGa4Days(startDateKey, endDateKey);
  const pageMaps = new Map<string, Map<string, { sessions: number; engagedSessions: number }>>();
  days.forEach((_value, dateKey) => pageMaps.set(dateKey, new Map()));

  for (const row of response.rows || []) {
    const dateKey = formatGa4Date(row.dimensionValues?.[0]?.value || '');
    const path = normalizeExternalAnalyticsPath(row.dimensionValues?.[1]?.value, siteOrigin());
    if (!dateKey || !path || !days.has(dateKey)) continue;
    const sessions = Number(row.metricValues?.[0]?.value || 0) || 0;
    const engagedSessions = Number(row.metricValues?.[1]?.value || 0) || 0;
    const pageMap = pageMaps.get(dateKey)!;
    const page = pageMap.get(path) || { sessions: 0, engagedSessions: 0 };
    page.sessions += sessions;
    page.engagedSessions += engagedSessions;
    pageMap.set(path, page);
  }

  const truncated = Number(response.rowCount || 0) > GA4_ROW_LIMIT;
  days.forEach((day, dateKey) => {
    const pages = Array.from(pageMaps.get(dateKey)?.entries() || []).map(([path, metrics]) => ({
      path,
      sessions: metrics.sessions,
      engagedSessions: metrics.engagedSessions,
    }));
    day.pages = pages;
    day.sessions = pages.reduce((sum, page) => sum + Number(page.sessions || 0), 0);
    day.engagedSessions = pages.reduce((sum, page) => sum + Number(page.engagedSessions || 0), 0);
    day.truncated = truncated;
  });
  return days;
};

const makeEmptyGscDays = (
  startDateKey: string,
  endDateKey: string,
  firstIncompleteDate?: string | null,
): Map<string, ExternalTrafficProviderDay> => {
  const conservativeIncompleteStart = addDaysToDateKey(todayIstDateKey(), -2);
  return new Map(dateKeysInclusive(startDateKey, endDateKey).map((dateKey) => [dateKey, {
    status: 'ok' as const,
    syncedAt: new Date().toISOString(),
    partial: Boolean(
      (firstIncompleteDate && isDateKey(firstIncompleteDate) && dateKey >= firstIncompleteDate) ||
      (!firstIncompleteDate && dateKey >= conservativeIncompleteStart),
    ),
    clicks: 0,
    impressions: 0,
    weightedPositionSum: 0,
    pages: [],
  }]));
};

const fetchGscDaily = async (
  token: string,
  startDateKey: string,
  endDateKey: string,
): Promise<Map<string, ExternalTrafficProviderDay>> => {
  const property = gscSiteUrl();
  if (!property) throw new Error('GSC_SITE_URL is not configured.');
  const response = await fetchGoogleJson<GscSearchAnalyticsResponse>(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    token,
    {
      startDate: startDateKey,
      endDate: endDateKey,
      dimensions: ['date', 'page'],
      rowLimit: GSC_ROW_LIMIT,
      dataState: 'all',
    },
  );
  const firstIncompleteDate = response.metadata?.first_incomplete_date || response.metadata?.firstIncompleteDate || null;
  const days = makeEmptyGscDays(startDateKey, endDateKey, firstIncompleteDate);
  const pageMaps = new Map<string, Map<string, { clicks: number; impressions: number; weightedPositionSum: number }>>();
  days.forEach((_value, dateKey) => pageMaps.set(dateKey, new Map()));

  for (const row of response.rows || []) {
    const dateKey = row.keys?.[0] || '';
    const path = normalizeExternalAnalyticsPath(row.keys?.[1], siteOrigin());
    if (!isDateKey(dateKey) || !path || !days.has(dateKey)) continue;
    const clicks = Number(row.clicks || 0) || 0;
    const impressions = Number(row.impressions || 0) || 0;
    const position = Number(row.position || 0) || 0;
    const pageMap = pageMaps.get(dateKey)!;
    const page = pageMap.get(path) || { clicks: 0, impressions: 0, weightedPositionSum: 0 };
    page.clicks += clicks;
    page.impressions += impressions;
    page.weightedPositionSum += position * impressions;
    pageMap.set(path, page);
  }

  const truncated = (response.rows || []).length >= GSC_ROW_LIMIT;
  days.forEach((day, dateKey) => {
    const pages = Array.from(pageMaps.get(dateKey)?.entries() || []).map(([path, metrics]) => ({
      path,
      clicks: metrics.clicks,
      impressions: metrics.impressions,
      weightedPositionSum: metrics.weightedPositionSum,
    }));
    day.pages = pages;
    day.clicks = pages.reduce((sum, page) => sum + Number(page.clicks || 0), 0);
    day.impressions = pages.reduce((sum, page) => sum + Number(page.impressions || 0), 0);
    day.weightedPositionSum = pages.reduce((sum, page) => sum + Number(page.weightedPositionSum || 0), 0);
    day.truncated = truncated;
  });
  return days;
};

const writeProviderDays = async (
  provider: 'ga4' | 'gsc',
  days: Map<string, ExternalTrafficProviderDay>,
): Promise<void> => {
  const db = admin.firestore();
  const entries = Array.from(days.entries());
  for (let start = 0; start < entries.length; start += 400) {
    const batch = db.batch();
    entries.slice(start, start + 400).forEach(([dateKey, day]) => {
      batch.set(db.collection(DAILY_COLLECTION).doc(dateKey), {
        schemaVersion: EXTERNAL_TRAFFIC_SCHEMA_VERSION,
        dateKey,
        timeZone: EXTERNAL_TRAFFIC_TIME_ZONE,
        [provider]: day,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    await batch.commit();
  }
};

const readSyncMeta = async (): Promise<SyncMeta> => {
  const snap = await admin.firestore().doc(META_DOC_PATH).get();
  return (snap.data() || { schemaVersion: EXTERNAL_TRAFFIC_SCHEMA_VERSION }) as SyncMeta;
};

const writeSyncMeta = async (
  existing: SyncMeta,
  providerStatuses: { ga4: SyncProviderStatus; gsc: SyncProviderStatus },
  startDateKey: string,
  endDateKey: string,
  reason: string,
): Promise<void> => {
  await admin.firestore().doc(META_DOC_PATH).set({
    schemaVersion: EXTERNAL_TRAFFIC_SCHEMA_VERSION,
    configuration: {
      ga4Configured: Boolean(ga4PropertyId()),
      gscConfigured: Boolean(gscSiteUrl()),
      siteOrigin: siteOrigin(),
    },
    providers: {
      ga4: {
        ...providerStatuses.ga4,
        lastSuccessfulAt: providerStatuses.ga4.lastSuccessfulAt || existing.providers?.ga4?.lastSuccessfulAt || null,
      },
      gsc: {
        ...providerStatuses.gsc,
        lastSuccessfulAt: providerStatuses.gsc.lastSuccessfulAt || existing.providers?.gsc?.lastSuccessfulAt || null,
      },
    },
    lastAttempt: {
      startDateKey,
      endDateKey,
      reason,
      at: new Date().toISOString(),
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

const syncExternalTrafficRange = async (
  startDateKey: string,
  endDateKey: string,
  reason: string,
): Promise<{ ga4: SyncProviderStatus; gsc: SyncProviderStatus }> => {
  const existing = await readSyncMeta();
  const attemptedAt = new Date().toISOString();
  const ga4Configured = Boolean(ga4PropertyId());
  const gscConfigured = Boolean(gscSiteUrl());
  let token: string | null = null;
  let credentialError: string | null = null;

  if (ga4Configured || gscConfigured) {
    try {
      token = await mintGoogleAccessToken();
    } catch (error) {
      credentialError = sanitizeError(error);
      logger.error('externalTrafficAnalytics: credential load/token mint failed', { error: credentialError });
    }
  }

  const ga4Status: SyncProviderStatus = !ga4Configured
    ? { status: 'not_configured', lastAttemptAt: attemptedAt }
    : credentialError || !token
      ? { status: 'credential_error', lastAttemptAt: attemptedAt, error: credentialError || 'Credential unavailable.' }
      : { status: 'ok', lastAttemptAt: attemptedAt };

  const gscStatus: SyncProviderStatus = !gscConfigured
    ? { status: 'not_configured', lastAttemptAt: attemptedAt }
    : credentialError || !token
      ? { status: 'credential_error', lastAttemptAt: attemptedAt, error: credentialError || 'Credential unavailable.' }
      : { status: 'ok', lastAttemptAt: attemptedAt };

  if (ga4Status.status === 'ok' && token) {
    try {
      const days = await fetchGa4Daily(token, startDateKey, endDateKey);
      await writeProviderDays('ga4', days);
      ga4Status.lastSuccessfulAt = new Date().toISOString();
    } catch (error) {
      ga4Status.status = 'error';
      ga4Status.error = sanitizeError(error);
      logger.error('externalTrafficAnalytics: GA4 sync failed', { startDateKey, endDateKey, error: ga4Status.error });
    }
  }

  if (gscStatus.status === 'ok' && token) {
    try {
      const days = await fetchGscDaily(token, startDateKey, endDateKey);
      await writeProviderDays('gsc', days);
      gscStatus.lastSuccessfulAt = new Date().toISOString();
    } catch (error) {
      gscStatus.status = 'error';
      gscStatus.error = sanitizeError(error);
      logger.error('externalTrafficAnalytics: GSC sync failed', { startDateKey, endDateKey, error: gscStatus.error });
    }
  }

  await writeSyncMeta(existing, { ga4: ga4Status, gsc: gscStatus }, startDateKey, endDateKey, reason);
  return { ga4: ga4Status, gsc: gscStatus };
};

const readDailyDocs = async (startDateKey: string, endDateKey: string): Promise<ExternalTrafficDailyDoc[]> => {
  const db = admin.firestore();
  const refs = dateKeysInclusive(startDateKey, endDateKey).map((dateKey) => db.collection(DAILY_COLLECTION).doc(dateKey));
  if (!refs.length) return [];
  const snapshots = await db.getAll(...refs);
  return snapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => snapshot.data() as ExternalTrafficDailyDoc);
};

export const getAdminExternalTrafficAnalytics = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    await resolveAdmin(request.auth);
    const range = assertRange(request.data?.startDateKey, request.data?.endDateKey, MAX_READ_DAYS);
    const previous = previousEqualLengthRange(range.startDateKey, range.endDateKey);
    const combinedStart = previous.startDateKey;
    const docs = await readDailyDocs(combinedStart, range.endDateKey);
    const meta = await readSyncMeta();

    return {
      schemaVersion: EXTERNAL_TRAFFIC_SCHEMA_VERSION,
      timeZone: EXTERNAL_TRAFFIC_TIME_ZONE,
      configuration: {
        ga4Configured: Boolean(ga4PropertyId()),
        gscConfigured: Boolean(gscSiteUrl()),
        siteOrigin: siteOrigin(),
      },
      sync: meta,
      current: aggregateExternalTrafficDocs(docs, range.startDateKey, range.endDateKey),
      previous: aggregateExternalTrafficDocs(docs, previous.startDateKey, previous.endDateKey),
    };
  },
);

export const adminSyncExternalTrafficAnalytics = onCall(
  { region: REGION, memory: '512MiB', timeoutSeconds: 180 },
  async (request) => {
    const uid = await resolveAdmin(request.auth);
    const defaultEnd = todayIstDateKey();
    const defaultStart = addDaysToDateKey(defaultEnd, -(DAILY_REFRESH_LOOKBACK_DAYS - 1));
    const range = assertRange(
      request.data?.startDateKey || defaultStart,
      request.data?.endDateKey || defaultEnd,
      MAX_MANUAL_SYNC_DAYS,
    );
    const providers = await syncExternalTrafficRange(range.startDateKey, range.endDateKey, `admin:${uid}`);
    return { ok: true, ...range, providers };
  },
);

export const syncExternalTrafficAnalyticsDaily = onSchedule(
  {
    schedule: '45 6 * * *',
    timeZone: EXTERNAL_TRAFFIC_TIME_ZONE,
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 180,
  },
  async () => {
    const endDateKey = todayIstDateKey();
    const startDateKey = addDaysToDateKey(endDateKey, -(DAILY_REFRESH_LOOKBACK_DAYS - 1));
    const providers = await syncExternalTrafficRange(startDateKey, endDateKey, 'scheduled-daily');
    logger.info('externalTrafficAnalytics: daily sync finished', { startDateKey, endDateKey, providers });
  },
);
