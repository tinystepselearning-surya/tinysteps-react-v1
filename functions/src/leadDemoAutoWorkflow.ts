import { createHash } from 'node:crypto';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import {
  normalizeWebsiteLeadChildName,
  normalizeWebsiteLeadPhone,
} from './websiteLeadDeduplication';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const SYSTEM_ACTOR = 'system:lead-demo-workflow';
const DEMO_UNIQUE_KEYS_COLLECTION = 'demoSessionUniqueKeys';
const TERMINAL_LEAD_STATUSES = new Set([
  'admitted_confirmed',
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
]);
const TERMINAL_CONVERSION_STATUSES = new Set([
  'enrolled',
  'not_interested',
  'wrong_fit',
  'no_response',
]);

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const digitPhone = (value: unknown): string => cleanText(value, 80).replace(/[^\d]/g, '');

const normalizeDemoChildForKey = (value: unknown): string =>
  cleanText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const demoDedupeKey = (childName: unknown, phone: unknown): string | null => {
  const child = normalizeDemoChildForKey(childName);
  const digits = digitPhone(phone);
  if (!child || digits.length < 7) return null;
  return createHash('sha256').update(`${child}|${digits}`).digest('hex');
};

const identityKey = (phone: unknown, childName: unknown): string | null => {
  const normalizedPhone = normalizeWebsiteLeadPhone(phone);
  const normalizedChild = normalizeWebsiteLeadChildName(childName);
  if (normalizedPhone.length < 7 || normalizedChild.length < 2) return null;
  return `${normalizedPhone}|${normalizedChild}`;
};

const phoneVariants = (...values: unknown[]): string[] => {
  const variants = new Set<string>();
  values.forEach((value) => {
    const digits = digitPhone(value);
    const canonical = normalizeWebsiteLeadPhone(value);
    if (digits.length >= 7) variants.add(digits);
    if (canonical.length >= 7) variants.add(canonical);
  });
  return [...variants].slice(0, 10);
};

const sourceLabel = (value: unknown): string => {
  const source = cleanText(value, 80).toLowerCase();
  if (source === 'website') return 'Website';
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'instagram') return 'Instagram';
  if (source === 'referral') return 'Referral';
  return 'Manual';
};

const courseLabel = (lead: Record<string, unknown>): string => {
  const programme = cleanText(lead.programInterest, 120);
  if (programme) return programme;
  const track = cleanText(lead.interestTrack, 80).toLowerCase();
  if (track === 'grammar') return 'Grammar';
  if (track === 'public_speaking' || track === 'speaking') return 'Public Speaking';
  if (track === 'phonics') return 'Phonics';
  return 'Assessment';
};

const demoStatusToLeadStatus = (demo: Record<string, unknown>): string => {
  const conversion = cleanText(demo.conversionStatus, 80).toLowerCase();
  if (conversion === 'enrolled') return 'admitted_confirmed';
  if (conversion === 'interested' || conversion === 'follow_up_later') return 'admission_follow_up';
  if (['not_interested', 'wrong_fit', 'no_response'].includes(conversion)) return conversion;
  const status = cleanText(demo.status, 80).toLowerCase();
  if (status === 'assigned') return 'demo_booked';
  if (status === 'completed') return 'demo_completed';
  return 'demo_pending_schedule';
};

const isTerminalLead = (lead: Record<string, unknown>): boolean => {
  const status = cleanText(lead.status, 80).toLowerCase();
  const conversion = cleanText(lead.conversionStatus, 80).toLowerCase();
  return TERMINAL_LEAD_STATUSES.has(status) || TERMINAL_CONVERSION_STATUSES.has(conversion);
};

const isSyntheticDemoLeadId = (leadId: string, demoId?: string): boolean =>
  leadId.startsWith('demo_') && (!demoId || leadId === `demo_${demoId}`);

const leadPhone = (lead: Record<string, unknown>): string =>
  cleanText(lead.primaryPhone || lead.whatsappNumber || lead.phoneNormalized, 80);

const isWebsiteCanonicalReady = (leadId: string, lead: Record<string, unknown>): boolean => {
  if (cleanText(lead.source, 80).toLowerCase() !== 'website') return true;
  if (cleanText(lead.dedupeConflict, 160)) return false;
  return (
    cleanText(lead.dedupeCanonicalLeadId, 120) === leadId &&
    Boolean(cleanText(lead.dedupeIdentityKey, 160))
  );
};

export const shouldEnsureDemoForLead = (
  leadId: string,
  lead: Record<string, unknown>,
): boolean => {
  if (!leadId || isSyntheticDemoLeadId(leadId)) return false;
  if (lead.archived === true || isTerminalLead(lead)) return false;
  if (cleanText(lead.demoSessionId, 120)) return false;
  if (!isWebsiteCanonicalReady(leadId, lead)) return false;
  return Boolean(identityKey(leadPhone(lead), lead.childName));
};

const timestampToDateInputIST = (value: unknown): string => {
  let date: Date | null = null;
  if (value instanceof admin.firestore.Timestamp) date = value.toDate();
  else if (
    value &&
    typeof value === 'object' &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    date = (value as { toDate: () => Date }).toDate();
  }
  if (!date || Number.isNaN(date.getTime())) date = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '1970';
  const month = parts.find((part) => part.type === 'month')?.value || '01';
  const day = parts.find((part) => part.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
};

const demoHistoryCreated = (leadId: string) => ({
  action: 'created',
  actorId: SYSTEM_ACTOR,
  actorName: 'Tiny Steps system',
  atMs: Date.now(),
  note: `Demo request auto-created from lead ${leadId}`,
});

const buildLeadDemoPatch = (
  demoId: string,
  demo: Record<string, unknown>,
): Record<string, unknown> => ({
  status: demoStatusToLeadStatus(demo),
  demoSessionId: demoId,
  demoIds: admin.firestore.FieldValue.arrayUnion(demoId),
  demoStatus: cleanText(demo.status, 80) || 'open',
  conversionStatus: cleanText(demo.conversionStatus, 80) || null,
  demoCreatedAt: demo.createdAt || admin.firestore.FieldValue.serverTimestamp(),
  lifecycleVersion: 2,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedBy: SYSTEM_ACTOR,
});

const safeSyntheticLead = (
  data: Record<string, unknown>,
  demoId: string,
): boolean => {
  if (cleanText(data.demoSessionId, 120) !== demoId) return false;
  if (cleanText(data.sourceDetail, 160) !== 'manual_demo_request') return false;
  if (cleanText(data.enrollmentId, 120)) return false;
  if (Array.isArray(data.enrollmentIds) && data.enrollmentIds.length > 0) return false;
  return true;
};

const canRelinkDemoToLead = (
  demoId: string,
  demo: Record<string, unknown>,
  leadId: string,
): boolean => {
  const owner = cleanText(demo.leadId, 120);
  if (!owner || owner === leadId) return true;
  return isSyntheticDemoLeadId(owner, demoId);
};

export const onLeadEnsureDemoRequest = onDocumentWritten(
  { document: 'leads/{leadId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const leadId = cleanText(event.params.leadId, 120);
    const initialLead = change.after.data() || {};
    if (!shouldEnsureDemoForLead(leadId, initialLead)) return;

    const db = admin.firestore();
    const leadRef = db.collection('leads').doc(leadId);
    const deterministicDemoRef = db.collection('demoSessions').doc(`lead_${leadId}`);
    const deterministicPrivateRef = db.collection('demoSessionsPrivate').doc(deterministicDemoRef.id);

    const result = await db.runTransaction(async (tx) => {
      const leadSnap = await tx.get(leadRef);
      if (!leadSnap.exists) return { action: 'lead_missing' as const };
      const lead = leadSnap.data() || {};
      if (!shouldEnsureDemoForLead(leadId, lead)) return { action: 'not_needed' as const };

      const phone = leadPhone(lead);
      const childName = cleanText(lead.childName, 120);
      const variants = phoneVariants(lead.primaryPhone, lead.whatsappNumber, lead.phoneNormalized);
      const dedupeKeys = Array.from(
        new Set(
          variants
            .map((variant) => demoDedupeKey(childName, variant))
            .filter(Boolean) as string[],
        ),
      );
      if (dedupeKeys.length === 0) return { action: 'identity_missing' as const };

      const keyRefs = dedupeKeys.map((key) =>
        db.collection(DEMO_UNIQUE_KEYS_COLLECTION).doc(key),
      );
      const keySnaps: FirebaseFirestore.DocumentSnapshot[] = [];
      for (const ref of keyRefs) keySnaps.push(await tx.get(ref));

      const mappedDemoIds = Array.from(
        new Set(
          keySnaps
            .map((snap) => cleanText(snap.data()?.demoId, 120))
            .filter(Boolean),
        ),
      );

      const candidateIds = Array.from(new Set([...mappedDemoIds, deterministicDemoRef.id]));
      const candidates: Array<{
        id: string;
        demo: Record<string, unknown>;
        privateData: Record<string, unknown>;
      }> = [];
      for (const demoId of candidateIds) {
        const demoRef = db.collection('demoSessions').doc(demoId);
        const privateRef = db.collection('demoSessionsPrivate').doc(demoId);
        const demoSnap = await tx.get(demoRef);
        const privateSnap = await tx.get(privateRef);
        if (!demoSnap.exists) continue;
        candidates.push({
          id: demoId,
          demo: demoSnap.data() || {},
          privateData: privateSnap.exists ? privateSnap.data() || {} : {},
        });
      }

      const expectedIdentity = identityKey(phone, childName);
      const existing = candidates.find(
        (candidate) =>
          identityKey(candidate.privateData.parentPhone, candidate.demo.childName) ===
          expectedIdentity,
      );

      if (existing) {
        if (!canRelinkDemoToLead(existing.id, existing.demo, leadId)) {
          return {
            action: 'owned_demo_conflict' as const,
            demoId: existing.id,
            ownerLeadId: cleanText(existing.demo.leadId, 120),
          };
        }
        const existingDemoRef = db.collection('demoSessions').doc(existing.id);
        tx.set(
          existingDemoRef,
          {
            leadId,
            identityLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
            identityLinkedBy: SYSTEM_ACTOR,
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedBy: SYSTEM_ACTOR,
          },
          { merge: true },
        );
        tx.set(leadRef, buildLeadDemoPatch(existing.id, existing.demo), { merge: true });
        return { action: 'linked_existing' as const, demoId: existing.id };
      }

      if (mappedDemoIds.length > 0) {
        return { action: 'dedupe_conflict' as const, demoIds: mappedDemoIds };
      }

      const demoSnap = await tx.get(deterministicDemoRef);
      const privateSnap = await tx.get(deterministicPrivateRef);
      if (demoSnap.exists) {
        const demo = demoSnap.data() || {};
        const privateData = privateSnap.exists ? privateSnap.data() || {} : {};
        if (identityKey(privateData.parentPhone, demo.childName) !== expectedIdentity) {
          return { action: 'deterministic_conflict' as const };
        }
        if (!canRelinkDemoToLead(deterministicDemoRef.id, demo, leadId)) {
          return {
            action: 'deterministic_owner_conflict' as const,
            ownerLeadId: cleanText(demo.leadId, 120),
          };
        }
        tx.set(deterministicDemoRef, { leadId }, { merge: true });
        tx.set(leadRef, buildLeadDemoPatch(deterministicDemoRef.id, demo), { merge: true });
        return {
          action: 'linked_deterministic' as const,
          demoId: deterministicDemoRef.id,
        };
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const childAge =
        typeof lead.childAge === 'number' && Number.isFinite(lead.childAge)
          ? lead.childAge
          : null;
      const childGrade =
        cleanText(lead.childGrade, 80) ||
        (childAge !== null ? `Age ${childAge}` : 'Not specified');
      const preferredTiming =
        cleanText(lead.preferredTimingText, 500) ||
        (cleanText(lead.urgency, 80)
          ? `Parent preference: ${cleanText(lead.urgency, 80)}`
          : 'To be scheduled with parent');
      const createdAt = lead.createdAt || lead.requestedAt || lead.receivedAt || now;
      const requestReceivedDate = timestampToDateInputIST(
        lead.receivedAt || lead.requestedAt || lead.createdAt,
      );
      const primaryDedupeKey = demoDedupeKey(childName, phone) || dedupeKeys[0];

      tx.set(deterministicDemoRef, {
        parentName: cleanText(lead.parentName, 120) || 'Parent',
        leadType: '1:1',
        childName,
        childGrade,
        childAge,
        courseInterested: courseLabel(lead),
        source: sourceLabel(lead.source),
        demoMode: null,
        preferredDateTimeText: preferredTiming,
        requestReceivedDate,
        timezone: cleanText(lead.timezone, 120) || 'IST',
        adminNotes: cleanText(lead.mainConcern, 500) || null,
        leadId,
        dedupeKey: primaryDedupeKey,
        status: 'open',
        assignedTeacherId: null,
        assignedTeacherName: null,
        assignedAt: null,
        teacherConfirmedDate: null,
        teacherConfirmedTime: null,
        teacherPreDemoNote: null,
        outcome: null,
        teacherRemarks: null,
        teacherRecommendation: null,
        childLevelObserved: null,
        readingLevel: null,
        phonicsAwareness: null,
        grammarEvaluation: null,
        speakingConfidence: null,
        attentionSpan: null,
        parentExpectation: null,
        recommendedNextStep: null,
        releasedAt: null,
        reopenedAt: null,
        rescheduledFromDemoId: null,
        rescheduledToDemoId: null,
        history: [demoHistoryCreated(leadId)],
        conversionStatus: null,
        recommendedCourse: null,
        recommendedClassType: null,
        recommendedFrequency: null,
        feeDiscussed: null,
        followUpDate: null,
        followUpCallStatus: null,
        followUpCallCompletedAt: null,
        admissionNotConfirmedReason: null,
        archived: false,
        completedAt: null,
        autoCreatedFromLead: true,
        createdAt,
        createdBy: SYSTEM_ACTOR,
        lastUpdatedAt: now,
        lastUpdatedBy: SYSTEM_ACTOR,
      });

      tx.set(
        deterministicPrivateRef,
        {
          parentPhone: phone,
          parentPhoneKey: digitPhone(phone),
          createdAt,
          createdBy: SYSTEM_ACTOR,
          lastUpdatedAt: now,
          lastUpdatedBy: SYSTEM_ACTOR,
        },
        { merge: true },
      );

      const primaryKeyRef = db
        .collection(DEMO_UNIQUE_KEYS_COLLECTION)
        .doc(primaryDedupeKey);
      const primaryKeyIndex = dedupeKeys.indexOf(primaryDedupeKey);
      const knownKeySnap = primaryKeyIndex >= 0 ? keySnaps[primaryKeyIndex] : null;
      if (!knownKeySnap?.exists) {
        tx.set(primaryKeyRef, {
          demoId: deterministicDemoRef.id,
          dedupeKey: primaryDedupeKey,
          childNameKey: normalizeDemoChildForKey(childName),
          parentPhoneKey: digitPhone(phone),
          createdAt: now,
          createdBy: SYSTEM_ACTOR,
          lastUpdatedAt: now,
          lastUpdatedBy: SYSTEM_ACTOR,
        });
      }

      tx.set(
        leadRef,
        {
          status: 'demo_pending_schedule',
          demoSessionId: deterministicDemoRef.id,
          demoIds: admin.firestore.FieldValue.arrayUnion(deterministicDemoRef.id),
          demoStatus: 'open',
          demoCreatedAt: createdAt,
          lifecycleVersion: 2,
          updatedAt: now,
          updatedBy: SYSTEM_ACTOR,
        },
        { merge: true },
      );

      return { action: 'created' as const, demoId: deterministicDemoRef.id };
    });

    if (result.action === 'created' || result.action === 'linked_existing') {
      logger.info('[lead-demo-workflow] ensured demo request', { leadId, ...result });
    } else if (result.action.includes('conflict')) {
      logger.warn('[lead-demo-workflow] skipped automatic demo because identity conflicted', {
        leadId,
        ...result,
      });
    }
  },
);

const chooseCanonicalCandidate = (
  demoId: string,
  demo: Record<string, unknown>,
  privateData: Record<string, unknown>,
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
): FirebaseFirestore.QueryDocumentSnapshot | null => {
  const expected = identityKey(privateData.parentPhone, demo.childName);
  if (!expected) return null;
  const matches = docs.filter((docSnap) => {
    if (docSnap.id === `demo_${demoId}`) return false;
    const lead = docSnap.data() || {};
    if (lead.archived === true) return false;
    return identityKey(leadPhone(lead), lead.childName) === expected;
  });
  if (matches.length === 1) return matches[0];
  const canonical = matches.filter(
    (docSnap) => cleanText(docSnap.data()?.dedupeCanonicalLeadId, 120) === docSnap.id,
  );
  if (canonical.length === 1) return canonical[0];
  const alreadyLinked = matches.filter(
    (docSnap) => cleanText(docSnap.data()?.demoSessionId, 120) === demoId,
  );
  return alreadyLinked.length === 1 ? alreadyLinked[0] : null;
};

const cleanupSyntheticLead = async (
  db: FirebaseFirestore.Firestore,
  demoId: string,
  realLeadId: string,
) => {
  const syntheticRef = db.collection('leads').doc(`demo_${demoId}`);
  await db.runTransaction(async (tx) => {
    const [syntheticSnap, demoSnap] = await Promise.all([
      tx.get(syntheticRef),
      tx.get(db.collection('demoSessions').doc(demoId)),
    ]);
    if (!syntheticSnap.exists || !demoSnap.exists) return;
    if (cleanText(demoSnap.data()?.leadId, 120) !== realLeadId) return;
    const synthetic = syntheticSnap.data() || {};
    if (safeSyntheticLead(synthetic, demoId)) tx.delete(syntheticRef);
  });
};

export const onOrphanDemoIdentityRepair = onDocumentWritten(
  { document: 'demoSessions/{demoId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change || !change.after.exists) return;

    const demoId = cleanText(event.params.demoId, 120);
    const after = change.after.data() || {};
    const currentLeadId = cleanText(after.leadId, 120);
    const db = admin.firestore();

    if (currentLeadId && !isSyntheticDemoLeadId(currentLeadId, demoId)) {
      await cleanupSyntheticLead(db, demoId, currentLeadId);
      return;
    }

    const privateSnap = await db.collection('demoSessionsPrivate').doc(demoId).get();
    const privateData = privateSnap.exists ? privateSnap.data() || {} : {};
    const variants = phoneVariants(privateData.parentPhone, privateData.parentPhoneKey);
    if (variants.length === 0 || !normalizeWebsiteLeadChildName(after.childName)) return;

    const candidateDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (let start = 0; start < variants.length; start += 10) {
      const slice = variants.slice(start, start + 10);
      const snapshot = await db
        .collection('leads')
        .where('phoneNormalized', 'in', slice)
        .limit(25)
        .get();
      snapshot.docs.forEach((docSnap) => candidateDocs.set(docSnap.id, docSnap));
    }

    const candidate = chooseCanonicalCandidate(
      demoId,
      after,
      privateData,
      Array.from(candidateDocs.values()),
    );
    if (!candidate) return;

    const realLeadId = candidate.id;
    const demoRef = db.collection('demoSessions').doc(demoId);
    const realLeadRef = db.collection('leads').doc(realLeadId);
    const syntheticRef = db.collection('leads').doc(`demo_${demoId}`);

    await db.runTransaction(async (tx) => {
      const [freshDemoSnap, realLeadSnap, syntheticSnap] = await Promise.all([
        tx.get(demoRef),
        tx.get(realLeadRef),
        tx.get(syntheticRef),
      ]);
      if (!freshDemoSnap.exists || !realLeadSnap.exists) return;
      const freshDemo = freshDemoSnap.data() || {};
      const freshLeadId = cleanText(freshDemo.leadId, 120);
      if (
        freshLeadId &&
        !isSyntheticDemoLeadId(freshLeadId, demoId) &&
        freshLeadId !== realLeadId
      ) {
        return;
      }

      tx.set(
        demoRef,
        {
          leadId: realLeadId,
          identityLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
          identityLinkedBy: SYSTEM_ACTOR,
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: SYSTEM_ACTOR,
        },
        { merge: true },
      );
      tx.set(realLeadRef, buildLeadDemoPatch(demoId, freshDemo), { merge: true });

      if (syntheticSnap.exists && safeSyntheticLead(syntheticSnap.data() || {}, demoId)) {
        tx.delete(syntheticRef);
      }
    });

    logger.info('[lead-demo-workflow] repaired orphan demo identity', {
      demoId,
      previousLeadId: currentLeadId || null,
      leadId: realLeadId,
    });
  },
);
