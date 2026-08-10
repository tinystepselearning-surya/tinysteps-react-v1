import { createHash } from 'node:crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DEDUPE_VERSION = 1;
const WEBSITE_SOURCE = 'website';

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export const normalizeWebsiteLeadPhone = (value: unknown): string => {
  const digits = cleanText(value, 80).replace(/[^\d]/g, '');
  if (digits.length === 14 && digits.startsWith('0091')) return digits.slice(4);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
};

export const normalizeWebsiteLeadChildName = (value: unknown): string =>
  cleanText(value, 160)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const buildWebsiteLeadIdentityKey = (phone: unknown, childName: unknown): string | null => {
  const normalizedPhone = normalizeWebsiteLeadPhone(phone);
  const normalizedChildName = normalizeWebsiteLeadChildName(childName);
  if (normalizedPhone.length < 7 || normalizedChildName.length < 2) return null;
  return createHash('sha256')
    .update(`${normalizedPhone}|${normalizedChildName}`)
    .digest('hex');
};

const identityKeyForLead = (lead: Record<string, unknown>): string | null =>
  buildWebsiteLeadIdentityKey(
    lead.phoneNormalized || lead.primaryPhone || lead.whatsappNumber,
    lead.childName,
  );

const toMillis = (value: unknown): number => {
  if (value instanceof admin.firestore.Timestamp) return value.toMillis();
  if (!value || typeof value !== 'object') return 0;
  const candidate = value as { toMillis?: () => number; seconds?: number; nanoseconds?: number };
  if (typeof candidate.toMillis === 'function') return candidate.toMillis();
  if (typeof candidate.seconds === 'number') {
    return candidate.seconds * 1000 + Math.floor((candidate.nanoseconds || 0) / 1_000_000);
  }
  return 0;
};

const eventTimestamp = (lead: Record<string, unknown>): unknown =>
  lead.receivedAt || lead.requestedAt || lead.createdAt || null;

const eventMillis = (lead: Record<string, unknown>): number =>
  toMillis(lead.receivedAt) || toMillis(lead.requestedAt) || toMillis(lead.createdAt) || 0;

const stringArray = (...values: unknown[]): string[] => {
  const result = new Set<string>();
  values.forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const normalized = cleanText(item, 120);
        if (normalized) result.add(normalized);
      });
      return;
    }
    const normalized = cleanText(value, 120);
    if (normalized) result.add(normalized);
  });
  return [...result];
};

const inquiryCount = (lead: Record<string, unknown>): number => {
  const raw = typeof lead.inquiryCount === 'number' ? lead.inquiryCount : 1;
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
};

const demoIds = (lead: Record<string, unknown>): string[] =>
  stringArray(lead.demoIds, lead.demoSessionId);

export const hasUnsafeWebsiteLeadDemoConflict = (
  canonical: Record<string, unknown>,
  duplicate: Record<string, unknown>,
): boolean => {
  const canonicalIds = new Set(demoIds(canonical));
  const duplicateIds = demoIds(duplicate);

  // A fresh duplicate without demo lifecycle can safely fold into an older canonical,
  // even when the canonical already has a demo. The reverse is unsafe because deleting
  // a duplicate that owns a demo could leave demoSessions pointing at a deleted lead.
  if (duplicateIds.length === 0) return false;
  if (canonicalIds.size === 0) return true;
  return duplicateIds.some((id) => !canonicalIds.has(id));
};

const interactionSnapshot = (
  sourceLeadId: string,
  lead: Record<string, unknown>,
): Record<string, unknown> => ({
  sourceLeadId,
  parentName: cleanText(lead.parentName, 160) || null,
  childName: cleanText(lead.childName, 160) || null,
  phoneNormalized: normalizeWebsiteLeadPhone(
    lead.phoneNormalized || lead.primaryPhone || lead.whatsappNumber,
  ),
  programInterest: cleanText(lead.programInterest, 120) || null,
  interestTrack: cleanText(lead.interestTrack, 120) || null,
  mainConcern: cleanText(lead.mainConcern, 300) || null,
  source: WEBSITE_SOURCE,
  sourceDetail: cleanText(lead.sourceDetail, 160) || null,
  sourcePath: cleanText(lead.sourcePath, 220) || null,
  landingPage: cleanText(lead.landingPage, 220) || null,
  conversionPage: cleanText(lead.conversionPage, 220) || null,
  acquisitionChannel: cleanText(lead.acquisitionChannel, 120) || null,
  acquisitionSource: cleanText(lead.acquisitionSource, 160) || null,
  attribution: lead.attribution || null,
  receivedAt: lead.receivedAt || null,
  requestedAt: lead.requestedAt || null,
  originalCreatedAt: lead.createdAt || null,
  capturedAt: admin.firestore.FieldValue.serverTimestamp(),
});

const firstTouchPatch = (
  preferred: Record<string, unknown>,
  fallback: Record<string, unknown>,
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};
  const choose = (field: string) => preferred[field] ?? fallback[field];
  const fields = [
    'acquisitionChannel',
    'acquisitionSource',
    'landingPage',
    'conversionPage',
    'attribution',
    'attributionEnrichedAt',
  ];
  fields.forEach((field) => {
    const value = choose(field);
    if (value !== undefined && value !== null) patch[field] = value;
  });
  return patch;
};

export const onWebsiteLeadIdentityWrite = onDocumentWritten(
  { document: 'leads/{leadId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const leadId = cleanText(event.params.leadId, 120);
    if (!leadId) return;

    const initial = change.after.data() || {};
    if (cleanText(initial.source, 80).toLowerCase() !== WEBSITE_SOURCE) return;

    const identityKey = identityKeyForLead(initial);
    if (!identityKey) return;

    const before = change.before.exists ? (change.before.data() || {}) : {};
    const previousIdentityKey =
      cleanText(before.source, 80).toLowerCase() === WEBSITE_SOURCE
        ? identityKeyForLead(before)
        : null;

    const db = admin.firestore();
    const leadRef = db.collection('leads').doc(leadId);
    const identityRef = db.collection('leadIdentityIndex').doc(identityKey);

    const outcome = await db.runTransaction(async (tx) => {
      const currentSnap = await tx.get(leadRef);
      if (!currentSnap.exists) return { action: 'missing' as const };
      const current = currentSnap.data() || {};
      if (cleanText(current.source, 80).toLowerCase() !== WEBSITE_SOURCE) {
        return { action: 'ignored' as const };
      }

      const currentIdentityKey = identityKeyForLead(current);
      if (currentIdentityKey !== identityKey) return { action: 'identity_changed' as const };

      const identitySnap = await tx.get(identityRef);
      const indexedCanonicalId = identitySnap.exists
        ? cleanText(identitySnap.data()?.canonicalLeadId, 120)
        : '';

      const ensureCanonical = () => {
        const timestamp = eventTimestamp(current) || admin.firestore.FieldValue.serverTimestamp();
        const patch: Record<string, unknown> = {};
        if (current.dedupeIdentityKey !== identityKey) patch.dedupeIdentityKey = identityKey;
        if (current.dedupeCanonicalLeadId !== leadId) patch.dedupeCanonicalLeadId = leadId;
        if (current.dedupeVersion !== DEDUPE_VERSION) patch.dedupeVersion = DEDUPE_VERSION;
        if (typeof current.inquiryCount !== 'number') patch.inquiryCount = 1;
        if (!current.firstInquiryAt) patch.firstInquiryAt = timestamp;
        if (!current.lastInquiryAt) patch.lastInquiryAt = timestamp;
        if (!Array.isArray(current.programInterests)) {
          patch.programInterests = stringArray(current.programInterest);
        }
        if (!Array.isArray(current.interestTracks)) {
          patch.interestTracks = stringArray(current.interestTrack);
        }
        if (Object.keys(patch).length > 0) tx.set(leadRef, patch, { merge: true });
        tx.set(
          leadRef.collection('inquiries').doc(leadId),
          interactionSnapshot(leadId, current),
          { merge: true },
        );
      };

      // Admin edits can legitimately correct phone/child identity. If this lead owned the
      // prior identity mapping, move that mapping atomically. Never leave a stale key that
      // could later route an unrelated enquiry into this corrected lead.
      if (previousIdentityKey && previousIdentityKey !== identityKey) {
        const previousIdentityRef = db.collection('leadIdentityIndex').doc(previousIdentityKey);
        const previousIdentitySnap = await tx.get(previousIdentityRef);
        const previousCanonicalId = previousIdentitySnap.exists
          ? cleanText(previousIdentitySnap.data()?.canonicalLeadId, 120)
          : '';

        if (previousCanonicalId === leadId) {
          if (indexedCanonicalId && indexedCanonicalId !== leadId) {
            tx.set(leadRef, {
              dedupeVersion: DEDUPE_VERSION,
              dedupeConflict: 'identity_edit_collides_with_existing_lead',
              dedupeConflictCanonicalLeadId: indexedCanonicalId,
              dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            return {
              action: 'identity_conflict' as const,
              canonicalLeadId: indexedCanonicalId,
            };
          }

          tx.delete(previousIdentityRef);
          tx.set(identityRef, {
            canonicalLeadId: leadId,
            identityKey,
            version: DEDUPE_VERSION,
            remappedFromIdentityKey: previousIdentityKey,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          ensureCanonical();
          return { action: 'identity_remapped' as const, canonicalLeadId: leadId };
        }
      }

      if (!indexedCanonicalId) {
        tx.set(identityRef, {
          canonicalLeadId: leadId,
          identityKey,
          version: DEDUPE_VERSION,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        ensureCanonical();
        return { action: 'claimed' as const, canonicalLeadId: leadId };
      }

      if (indexedCanonicalId === leadId) {
        ensureCanonical();
        return { action: 'canonical' as const, canonicalLeadId: leadId };
      }

      const canonicalRef = db.collection('leads').doc(indexedCanonicalId);
      const canonicalSnap = await tx.get(canonicalRef);
      if (!canonicalSnap.exists) {
        tx.set(identityRef, {
          canonicalLeadId: leadId,
          identityKey,
          version: DEDUPE_VERSION,
          recoveredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        ensureCanonical();
        return { action: 'recovered' as const, canonicalLeadId: leadId };
      }

      const canonical = canonicalSnap.data() || {};
      if (hasUnsafeWebsiteLeadDemoConflict(canonical, current)) {
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: 'duplicate_has_unmigrated_demo_links',
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          canonicalLeadId: indexedCanonicalId,
        };
      }

      const canonicalMs = eventMillis(canonical);
      const duplicateMs = eventMillis(current);
      const promoteFirstTouch = duplicateMs > 0 && (canonicalMs === 0 || duplicateMs < canonicalMs);
      const earliest = promoteFirstTouch ? current : canonical;
      const later = promoteFirstTouch ? canonical : current;
      const earliestAt = eventTimestamp(earliest) || eventTimestamp(later) || admin.firestore.FieldValue.serverTimestamp();
      const latestAt = eventMillis(later) >= eventMillis(earliest)
        ? eventTimestamp(later)
        : eventTimestamp(earliest);

      const mergedPatch: Record<string, unknown> = {
        dedupeIdentityKey: identityKey,
        dedupeCanonicalLeadId: indexedCanonicalId,
        dedupeVersion: DEDUPE_VERSION,
        inquiryCount: inquiryCount(canonical) + inquiryCount(current),
        firstInquiryAt: earliestAt,
        lastInquiryAt: latestAt || admin.firestore.FieldValue.serverTimestamp(),
        programInterests: stringArray(
          canonical.programInterests,
          canonical.programInterest,
          current.programInterests,
          current.programInterest,
        ),
        interestTracks: stringArray(
          canonical.interestTracks,
          canonical.interestTrack,
          current.interestTracks,
          current.interestTrack,
        ),
        mergedLeadIds: admin.firestore.FieldValue.arrayUnion(
          leadId,
          ...stringArray(current.mergedLeadIds),
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      // receivedAt is immutable in leadLifecycle. Runtime canonicalization naturally keeps
      // the first website enquiry as canonical; historical backfill uses firstInquiryAt to
      // retain an earlier enquiry if a lifecycle-rich later record must remain canonical.
      if (!canonical.receivedAt) mergedPatch.receivedAt = earliestAt;

      const currentIsLatest = duplicateMs >= canonicalMs;
      if (currentIsLatest) {
        const latestFields = ['programInterest', 'interestTrack', 'mainConcern', 'urgency'];
        latestFields.forEach((field) => {
          if (current[field] !== undefined && current[field] !== null && current[field] !== '') {
            mergedPatch[field] = current[field];
          }
        });
        mergedPatch.lastInquirySourcePath = cleanText(current.sourcePath, 220) || null;
      }

      Object.assign(mergedPatch, firstTouchPatch(earliest, later));

      tx.set(canonicalRef, mergedPatch, { merge: true });
      tx.set(
        canonicalRef.collection('inquiries').doc(leadId),
        interactionSnapshot(leadId, current),
        { merge: true },
      );
      tx.set(
        db.collection('leadMergeRedirects').doc(leadId),
        {
          canonicalLeadId: indexedCanonicalId,
          identityKey,
          promoteFirstTouch,
          mergedAt: admin.firestore.FieldValue.serverTimestamp(),
          version: DEDUPE_VERSION,
        },
        { merge: true },
      );
      tx.set(identityRef, {
        canonicalLeadId: indexedCanonicalId,
        identityKey,
        version: DEDUPE_VERSION,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.delete(leadRef);

      return {
        action: 'merged' as const,
        canonicalLeadId: indexedCanonicalId,
        duplicateLeadId: leadId,
        promoteFirstTouch,
      };
    });

    if (outcome.action === 'merged') {
      logger.info('[websiteLeadDeduplication] merged duplicate website lead', outcome);
    } else if (outcome.action === 'conflict') {
      logger.warn('[websiteLeadDeduplication] duplicate not merged because demo lifecycle is unsafe to migrate automatically', {
        leadId,
        identityKey,
        ...outcome,
      });
    } else if (outcome.action === 'identity_conflict') {
      logger.warn('[websiteLeadDeduplication] corrected lead identity collides with another canonical lead', {
        leadId,
        identityKey,
        previousIdentityKey,
        ...outcome,
      });
    }
  },
);
