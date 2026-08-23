import { createHash } from 'node:crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DEDUPE_VERSION = 1;
const WEBSITE_SOURCE = 'website';
const DEMO_CONFLICT = 'duplicate_has_unmigrated_demo_links';
const LIFECYCLE_CONFLICT = 'duplicate_has_unmigrated_lifecycle_links';
const HISTORY_CONFLICT = 'duplicate_history_requires_manual_migration';
const IDENTITY_EDIT_CONFLICT = 'identity_edit_collides_with_existing_lead';
const INDEX_CONFLICT = 'identity_index_canonical_mismatch';
const MAX_HISTORY_DOCS_TO_MIGRATE = 400;

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

const enrollmentIds = (lead: Record<string, unknown>): string[] =>
  stringArray(lead.enrollmentIds, lead.enrollmentId);

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

export const hasUnsafeWebsiteLeadLifecycleConflict = (
  canonical: Record<string, unknown>,
  duplicate: Record<string, unknown>,
): boolean => {
  const canonicalEnrollmentIds = new Set(enrollmentIds(canonical));
  const duplicateEnrollmentIds = enrollmentIds(duplicate);
  if (duplicateEnrollmentIds.some((id) => !canonicalEnrollmentIds.has(id))) return true;

  const duplicateStatus = cleanText(duplicate.status, 80).toLowerCase();
  const duplicateConversion = cleanText(duplicate.conversionStatus, 80).toLowerCase();
  const lifecycleRich = Boolean(
    duplicate.enrolledAt ||
    duplicate.demoCreatedAt ||
    duplicate.demoAssignedAt ||
    duplicate.demoCompletedAt ||
    duplicate.demoCancelledAt ||
    duplicateStatus === 'demo_booked' ||
    duplicateStatus === 'demo_completed' ||
    duplicateStatus === 'admission_follow_up' ||
    duplicateStatus === 'admitted_confirmed' ||
    duplicateConversion === 'enrolled',
  );

  // Demo linkage is checked separately. Lifecycle-rich records without a concrete,
  // matching relationship are intentionally left for manual review.
  return lifecycleRich && demoIds(duplicate).length === 0 && duplicateEnrollmentIds.length === 0;
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

const clearConflictPatch = (): Record<string, unknown> => ({
  dedupeConflict: admin.firestore.FieldValue.delete(),
  dedupeConflictCanonicalLeadId: admin.firestore.FieldValue.delete(),
  dedupeConflictAt: admin.firestore.FieldValue.delete(),
});

export const hasCompleteWebsiteCanonicalMetadata = (
  leadId: string,
  identityKey: string,
  lead: Record<string, unknown>,
): boolean => (
  cleanText(lead.dedupeCanonicalLeadId, 120) === leadId &&
  cleanText(lead.dedupeIdentityKey, 160) === identityKey &&
  lead.dedupeVersion === DEDUPE_VERSION &&
  typeof lead.inquiryCount === 'number' &&
  Boolean(lead.firstInquiryAt) &&
  Boolean(lead.lastInquiryAt) &&
  Array.isArray(lead.programInterests) &&
  Array.isArray(lead.interestTracks) &&
  !cleanText(lead.dedupeConflict, 160)
);

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

      // An update to an already-canonical lead is not a new enquiry. This fresh-state
      // check also makes delayed/duplicate Eventarc deliveries a read-only no-op and,
      // critically, avoids rewriting capturedAt on every unrelated lead event.
      if (
        change.before.exists &&
        previousIdentityKey === identityKey &&
        hasCompleteWebsiteCanonicalMetadata(leadId, identityKey, current)
      ) {
        return { action: 'canonical_noop' as const, canonicalLeadId: leadId };
      }

      const identitySnap = await tx.get(identityRef);
      const indexedCanonicalId = identitySnap.exists
        ? cleanText(identitySnap.data()?.canonicalLeadId, 120)
        : '';
      const currentConflict = cleanText(current.dedupeConflict, 160);
      const currentConflictCanonicalId = cleanText(current.dedupeConflictCanonicalLeadId, 120);

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
        if (currentConflict) Object.assign(patch, clearConflictPatch());
        if (Object.keys(patch).length > 0) tx.set(leadRef, patch, { merge: true });
        tx.set(
          leadRef.collection('inquiries').doc(leadId),
          interactionSnapshot(leadId, current),
          { merge: true },
        );
      };

      // A conflict-marker write retriggers this function. Keep identity collisions sticky
      // until an admin actually changes the identity again; otherwise the second trigger
      // could fall through and delete the conflicting lead.
      if (
        currentConflict === IDENTITY_EDIT_CONFLICT &&
        indexedCanonicalId &&
        indexedCanonicalId !== leadId &&
        currentConflictCanonicalId === indexedCanonicalId &&
        previousIdentityKey === identityKey
      ) {
        return {
          action: 'identity_conflict_existing' as const,
          canonicalLeadId: indexedCanonicalId,
        };
      }

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
            if (
              currentConflict === IDENTITY_EDIT_CONFLICT &&
              currentConflictCanonicalId === indexedCanonicalId
            ) {
              return {
                action: 'identity_conflict_existing' as const,
                canonicalLeadId: indexedCanonicalId,
              };
            }
            tx.set(leadRef, {
              dedupeVersion: DEDUPE_VERSION,
              dedupeConflict: IDENTITY_EDIT_CONFLICT,
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
      if (
        cleanText(canonical.source, 80).toLowerCase() !== WEBSITE_SOURCE ||
        identityKeyForLead(canonical) !== identityKey
      ) {
        if (
          currentConflict === INDEX_CONFLICT &&
          currentConflictCanonicalId === indexedCanonicalId
        ) {
          return {
            action: 'conflict_existing' as const,
            canonicalLeadId: indexedCanonicalId,
          };
        }
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: INDEX_CONFLICT,
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          conflictReason: INDEX_CONFLICT,
          canonicalLeadId: indexedCanonicalId,
        };
      }
      if (hasUnsafeWebsiteLeadDemoConflict(canonical, current)) {
        if (
          currentConflict === DEMO_CONFLICT &&
          currentConflictCanonicalId === indexedCanonicalId
        ) {
          return {
            action: 'conflict_existing' as const,
            canonicalLeadId: indexedCanonicalId,
          };
        }
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: DEMO_CONFLICT,
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          conflictReason: DEMO_CONFLICT,
          canonicalLeadId: indexedCanonicalId,
        };
      }

      if (hasUnsafeWebsiteLeadLifecycleConflict(canonical, current)) {
        if (
          currentConflict === LIFECYCLE_CONFLICT &&
          currentConflictCanonicalId === indexedCanonicalId
        ) {
          return {
            action: 'conflict_existing' as const,
            canonicalLeadId: indexedCanonicalId,
          };
        }
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: LIFECYCLE_CONFLICT,
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          conflictReason: LIFECYCLE_CONFLICT,
          canonicalLeadId: indexedCanonicalId,
        };
      }

      // Parent deletes do not cascade in Firestore. Read and migrate every known
      // meaningful lead subcollection before deleting a historical duplicate.
      const [inquiriesSnap, communicationsSnap] = await Promise.all([
        tx.get(leadRef.collection('inquiries').limit(MAX_HISTORY_DOCS_TO_MIGRATE + 1)),
        tx.get(leadRef.collection('communications').limit(MAX_HISTORY_DOCS_TO_MIGRATE + 1)),
      ]);
      if (
        inquiriesSnap.size + communicationsSnap.size > MAX_HISTORY_DOCS_TO_MIGRATE ||
        inquiriesSnap.size > MAX_HISTORY_DOCS_TO_MIGRATE ||
        communicationsSnap.size > MAX_HISTORY_DOCS_TO_MIGRATE
      ) {
        if (
          currentConflict === HISTORY_CONFLICT &&
          currentConflictCanonicalId === indexedCanonicalId
        ) {
          return {
            action: 'conflict_existing' as const,
            canonicalLeadId: indexedCanonicalId,
          };
        }
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: HISTORY_CONFLICT,
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          conflictReason: HISTORY_CONFLICT,
          canonicalLeadId: indexedCanonicalId,
        };
      }

      const duplicateDemoIds = demoIds(current);
      const duplicateDemoSnaps = await Promise.all(
        duplicateDemoIds.map((demoId) => tx.get(db.collection('demoSessions').doc(demoId))),
      );
      const inconsistentDemoLink = duplicateDemoSnaps.some((demoSnap) => {
        if (!demoSnap.exists) return true;
        const linkedLeadId = cleanText(demoSnap.data()?.leadId, 120);
        return linkedLeadId !== leadId && linkedLeadId !== indexedCanonicalId;
      });
      if (inconsistentDemoLink) {
        if (
          currentConflict === DEMO_CONFLICT &&
          currentConflictCanonicalId === indexedCanonicalId
        ) {
          return {
            action: 'conflict_existing' as const,
            canonicalLeadId: indexedCanonicalId,
          };
        }
        tx.set(leadRef, {
          dedupeIdentityKey: identityKey,
          dedupeVersion: DEDUPE_VERSION,
          dedupeConflict: DEMO_CONFLICT,
          dedupeConflictCanonicalLeadId: indexedCanonicalId,
          dedupeConflictAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
          action: 'conflict' as const,
          conflictReason: DEMO_CONFLICT,
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
      if (currentConflict) Object.assign(mergedPatch, clearConflictPatch());

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
        mergedPatch.lastInquiryLandingPage = cleanText(current.landingPage, 220) || null;
        mergedPatch.lastInquiryConversionPage = cleanText(current.conversionPage, 220) || null;
        mergedPatch.lastInquiryAcquisitionChannel = cleanText(current.acquisitionChannel, 120) || null;
        mergedPatch.lastInquiryAcquisitionSource = cleanText(current.acquisitionSource, 160) || null;
      }

      Object.assign(mergedPatch, firstTouchPatch(earliest, later));

      tx.set(canonicalRef, mergedPatch, { merge: true });
      tx.set(
        canonicalRef.collection('inquiries').doc(leadId),
        interactionSnapshot(leadId, current),
        { merge: true },
      );
      inquiriesSnap.docs.forEach((inquirySnap) => {
        tx.set(
          canonicalRef.collection('inquiries').doc(inquirySnap.id),
          {
            ...inquirySnap.data(),
            migratedFromLeadId: leadId,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
      communicationsSnap.docs.forEach((communicationSnap) => {
        tx.set(
          canonicalRef.collection('communications').doc(`${leadId}__${communicationSnap.id}`),
          {
            ...communicationSnap.data(),
            migratedFromLeadId: leadId,
            originalCommunicationId: communicationSnap.id,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      });
      duplicateDemoSnaps.forEach((demoSnap) => {
        if (cleanText(demoSnap.data()?.leadId, 120) === leadId) {
          tx.set(demoSnap.ref, {
            leadId: indexedCanonicalId,
            leadDeduplicatedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      });
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
      logger.warn('[websiteLeadDeduplication] duplicate not merged because integrity checks require manual review', {
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
