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

function matchesSource(value: string, aliases: string[]): boolean {
  return aliases.includes(value);
}

function matchesDomain(domain: string, roots: string[]): boolean {
  return roots.some((root) => domain === root || domain.endsWith(`.${root}`));
}

function isGoogleDomain(domain: string): boolean {
  return /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain);
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
  const hasGoogle =
    matchesSource(source, ['google', 'google_ads', 'google-ads', 'googleads', 'adwords']) ||
    isGoogleDomain(referrerDomain);
  const hasBing =
    matchesSource(source, ['bing', 'microsoft', 'microsoft_ads', 'microsoft-ads']) ||
    matchesDomain(referrerDomain, ['bing.com', 'microsoft.com']);
  const hasInstagram =
    matchesSource(source, ['instagram', 'instagram_ads', 'instagram-ads', 'ig']) ||
    matchesDomain(referrerDomain, ['instagram.com']);
  const hasFacebook =
    matchesSource(source, ['facebook', 'facebook_ads', 'facebook-ads', 'fb', 'meta', 'meta_ads', 'meta-ads']) ||
    matchesDomain(referrerDomain, ['facebook.com', 'fb.com', 'meta.com']);
  const hasLinkedIn =
    matchesSource(source, ['linkedin', 'linkedin_ads', 'linkedin-ads']) ||
    matchesDomain(referrerDomain, ['linkedin.com']);
  const hasYouTube =
    matchesSource(source, ['youtube', 'youtube_ads', 'youtube-ads']) ||
    matchesDomain(referrerDomain, ['youtube.com', 'youtu.be']);

  if (input.gclid || (hasGoogle && isPaidMedium(medium))) {
    return { channel: 'google_ads', source: source || 'google' };
  }
  if (input.msclkid || (hasBing && isPaidMedium(medium))) {
    return { channel: 'microsoft_ads', source: source || 'microsoft' };
  }
  if (hasInstagram) {
    return { channel: 'instagram', source: source || referrerDomain || 'instagram' };
  }
  if (hasFacebook || input.fbclid) {
    return { channel: 'facebook', source: source || referrerDomain || 'facebook' };
  }
  if (hasLinkedIn) {
    return { channel: 'linkedin', source: source || referrerDomain || 'linkedin' };
  }
  if (hasYouTube) {
    return { channel: 'youtube', source: source || referrerDomain || 'youtube' };
  }
  if (hasGoogle) {
    return { channel: 'google_organic', source: referrerDomain || source || 'google' };
  }
  if (hasBing) {
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

function assertRecent(timestamp: unknown, unavailableMessage: string): void {
  if (!(timestamp instanceof admin.firestore.Timestamp)) {
    throw new HttpsError('failed-precondition', unavailableMessage);
  }
  if (Date.now() - timestamp.toMillis() > MAX_LEAD_AGE_MS) {
    throw new HttpsError('failed-precondition', 'Lead attribution enrichment window expired');
  }
}

export const enrichPublicLeadAttribution = onCall<EnrichmentRequest>(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    const leadId = sanitize(request.data?.leadId, 40);
    if (!leadId || !AUTO_ID_PATTERN.test(leadId)) {
      throw new HttpsError('invalid-argument', 'Invalid lead id');
    }

    const db = admin.firestore();
    const originalLeadRef = db.collection('leads').doc(leadId);
    const redirectRef = db.collection('leadMergeRedirects').doc(leadId);
    const { attribution, acquisition } = sanitizeAttribution(request.data?.attribution);

    const result = await db.runTransaction(async (tx) => {
      let targetRef = originalLeadRef;
      let targetSnap = await tx.get(originalLeadRef);
      let redirected = false;
      let promoteFirstTouch = false;
      let canonicalLeadId = leadId;

      if (!targetSnap.exists) {
        const redirectSnap = await tx.get(redirectRef);
        if (!redirectSnap.exists) {
          throw new HttpsError('not-found', 'Lead not found');
        }

        const redirect = redirectSnap.data() || {};
        canonicalLeadId = sanitize(redirect.canonicalLeadId, 40) || '';
        if (!AUTO_ID_PATTERN.test(canonicalLeadId)) {
          throw new HttpsError('failed-precondition', 'Lead merge redirect is invalid');
        }
        assertRecent(redirect.mergedAt, 'Lead merge timestamp is unavailable');
        promoteFirstTouch = redirect.promoteFirstTouch === true;
        targetRef = db.collection('leads').doc(canonicalLeadId);
        targetSnap = await tx.get(targetRef);
        if (!targetSnap.exists) {
          throw new HttpsError('failed-precondition', 'Canonical lead not found');
        }
        redirected = true;
      }

      const lead = targetSnap.data() || {};
      if (lead.source !== 'website') {
        throw new HttpsError('permission-denied', 'Only website leads can be enriched');
      }

      if (!redirected) {
        if (lead.attributionEnrichedAt) {
          return { alreadyEnriched: true, canonicalLeadId };
        }
        assertRecent(lead.createdAt, 'Lead creation timestamp is unavailable');

        tx.set(
          targetRef,
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

        return {
          alreadyEnriched: false,
          acquisitionChannel: acquisition.channel,
          canonicalLeadId,
        };
      }

      const interactionRef = targetRef.collection('inquiries').doc(leadId);
      tx.set(
        interactionRef,
        {
          landingPage: attribution.landingPage,
          conversionPage: attribution.conversionPage,
          acquisitionChannel: acquisition.channel,
          acquisitionSource: acquisition.source,
          attribution,
          attributionEnrichedAt: admin.firestore.FieldValue.serverTimestamp(),
          attributionRedirectedFromLeadId: leadId,
        },
        { merge: true },
      );

      const canonicalPatch: Record<string, unknown> = {
        lastInquiryLandingPage: attribution.landingPage,
        lastInquiryConversionPage: attribution.conversionPage,
        lastInquiryAcquisitionChannel: acquisition.channel,
        lastInquiryAcquisitionSource: acquisition.source,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (promoteFirstTouch) {
        canonicalPatch.acquisitionChannel = acquisition.channel;
        canonicalPatch.acquisitionSource = acquisition.source;
        canonicalPatch.landingPage = attribution.landingPage;
        canonicalPatch.conversionPage = attribution.conversionPage;
        canonicalPatch.attribution = attribution;
        canonicalPatch.attributionEnrichedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      tx.set(targetRef, canonicalPatch, { merge: true });

      return {
        alreadyEnriched: false,
        redirected: true,
        promoteFirstTouch,
        acquisitionChannel: acquisition.channel,
        canonicalLeadId,
      };
    });

    logger.info('[enrichPublicLeadAttribution] attribution persisted', {
      leadId,
      ...result,
    });

    return { ok: true, ...result };
  },
);
