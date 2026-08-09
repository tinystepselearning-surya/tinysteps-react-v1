import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_LEAD_AGE_MS = 20 * 60 * 1000;
const AUTO_ID_PATTERN = /^[A-Za-z0-9]{20}$/;

type AttributionPayload = {
  landingPage?: unknown;
  conversionPage?: unknown;
  submittedFromUrl?: unknown;
  firstSeenAt?: unknown;
  referrer?: unknown;
  referrerDomain?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  msclkid?: unknown;
};

type EnrichmentRequest = {
  leadId?: unknown;
  attribution?: AttributionPayload;
};

type AcquisitionChannel =
  | 'google_organic'
  | 'google_ads'
  | 'bing_organic'
  | 'microsoft_ads'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'referral'
  | 'direct'
  | 'other';

function sanitize(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function sanitizePath(value: unknown): string | undefined {
  const path = sanitize(value, 200);
  if (!path || !path.startsWith('/')) return undefined;
  return path;
}

function deriveReferrerDomain(referrer?: string): string | undefined {
  if (!referrer) return undefined;
  try {
    return new URL(referrer).hostname.toLowerCase().replace(/^www\./, '').slice(0, 160);
  } catch {
    return undefined;
  }
}

function normalize(value: string | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function isPaidMedium(medium: string): boolean {
  return /(^|[_\-])(cpc|ppc|paid|paidsearch|paid_search|display|retargeting|remarketing)([_\-]|$)/.test(medium);
}

function classify(input: {
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
}): { channel: AcquisitionChannel; source: string } {
  const source = normalize(input.utmSource);
  const medium = normalize(input.utmMedium);
  const referrerDomain = normalize(input.referrerDomain);
  const combined = `${source} ${referrerDomain}`;
  const has = (needle: string) => combined.includes(needle);

  if (input.gclid || (has('google') && isPaidMedium(medium))) {
    return { channel: 'google_ads', source: source || 'google' };
  }
  if (input.msclkid || ((has('bing') || has('microsoft')) && isPaidMedium(medium))) {
    return { channel: 'microsoft_ads', source: source || 'microsoft' };
  }
  if (has('instagram') || source === 'ig') {
    return { channel: 'instagram', source: source || referrerDomain || 'instagram' };
  }
  if (has('facebook') || has('meta') || source === 'fb' || input.fbclid) {
    return { channel: 'facebook', source: source || referrerDomain || 'facebook' };
  }
  if (has('linkedin')) {
    return { channel: 'linkedin', source: source || referrerDomain || 'linkedin' };
  }
  if (has('youtube') || has('youtu.be')) {
    return { channel: 'youtube', source: source || referrerDomain || 'youtube' };
  }
  if (has('google')) {
    return { channel: 'google_organic', source: referrerDomain || source || 'google' };
  }
  if (has('bing') || has('microsoft')) {
    return { channel: 'bing_organic', source: referrerDomain || source || 'bing' };
  }
  if (source) {
    return { channel: 'other', source };
  }
  if (referrerDomain) {
    return { channel: 'referral', source: referrerDomain };
  }
  return { channel: 'direct', source: 'direct' };
}

function sanitizeAttribution(raw: AttributionPayload | undefined) {
  const referrer = sanitize(raw?.referrer, 300);
  const referrerDomain = deriveReferrerDomain(referrer) || sanitize(raw?.referrerDomain, 160);
  const landingPage = sanitizePath(raw?.landingPage) || '/';
  const conversionPage = sanitizePath(raw?.conversionPage) || landingPage;

  const attribution = {
    landingPage,
    conversionPage,
    submittedFromUrl: sanitize(raw?.submittedFromUrl, 400) || null,
    firstSeenAt: sanitize(raw?.firstSeenAt, 80) || null,
    referrer: referrer || null,
    referrerDomain: referrerDomain || null,
    utm_source: sanitize(raw?.utm_source, 120) || null,
    utm_medium: sanitize(raw?.utm_medium, 120) || null,
    utm_campaign: sanitize(raw?.utm_campaign, 160) || null,
    utm_content: sanitize(raw?.utm_content, 160) || null,
    utm_term: sanitize(raw?.utm_term, 160) || null,
    gclid: sanitize(raw?.gclid, 200) || null,
    fbclid: sanitize(raw?.fbclid, 200) || null,
    msclkid: sanitize(raw?.msclkid, 200) || null,
  };

  const acquisition = classify({
    referrerDomain: referrerDomain || undefined,
    utmSource: attribution.utm_source || undefined,
    utmMedium: attribution.utm_medium || undefined,
    gclid: attribution.gclid || undefined,
    fbclid: attribution.fbclid || undefined,
    msclkid: attribution.msclkid || undefined,
  });

  return { attribution, acquisition };
}

export const enrichPublicLeadAttribution = onCall<EnrichmentRequest>(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    const leadId = sanitize(request.data?.leadId, 40);
    if (!leadId || !AUTO_ID_PATTERN.test(leadId)) {
      throw new HttpsError('invalid-argument', 'Invalid lead id');
    }

    const db = admin.firestore();
    const leadRef = db.collection('leads').doc(leadId);
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(leadRef);
      if (!snap.exists) {
        throw new HttpsError('not-found', 'Lead not found');
      }

      const lead = snap.data() || {};
      if (lead.source !== 'website') {
        throw new HttpsError('permission-denied', 'Only website leads can be enriched');
      }

      if (lead.attributionEnrichedAt) {
        return { alreadyEnriched: true };
      }

      const createdAt = lead.createdAt;
      if (!(createdAt instanceof admin.firestore.Timestamp)) {
        throw new HttpsError('failed-precondition', 'Lead creation timestamp is unavailable');
      }
      if (Date.now() - createdAt.toMillis() > MAX_LEAD_AGE_MS) {
        throw new HttpsError('failed-precondition', 'Lead attribution enrichment window expired');
      }

      const { attribution, acquisition } = sanitizeAttribution(request.data?.attribution);
      tx.set(
        leadRef,
        {
          acquisitionChannel: acquisition.channel,
          acquisitionSource: acquisition.source,
          landingPage: attribution.landingPage,
          conversionPage: attribution.conversionPage,
          attribution,
          attributionEnrichedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return { alreadyEnriched: false, acquisitionChannel: acquisition.channel };
    });

    logger.info('[enrichPublicLeadAttribution] attribution persisted', {
      leadId,
      ...result,
    });

    return { ok: true, ...result };
  },
);
