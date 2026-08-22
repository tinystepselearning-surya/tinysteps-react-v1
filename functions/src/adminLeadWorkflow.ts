import { createHash } from 'node:crypto';
import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  buildWebsiteLeadIdentityKey,
  normalizeWebsiteLeadPhone,
} from './websiteLeadDeduplication';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DEMO_UNIQUE_KEYS_COLLECTION = 'demoSessionUniqueKeys';
const LEAD_IDENTITY_INDEX_COLLECTION = 'leadIdentityIndex';
const LEAD_MERGE_REDIRECTS_COLLECTION = 'leadMergeRedirects';
const MAX_HISTORY_ENTRIES = 40;

interface AdminCaller {
  uid: string;
  displayName: string;
}

interface AdminUpdateLeadWorkflowRecordRequest {
  leadId?: string | null;
  demoId?: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  childName: string;
  childAge?: number | null;
  childGrade?: string | null;
  course: string;
  source?: string | null;
  preferredTimingText?: string | null;
  timezone?: string | null;
  notes?: string | null;
}

interface AdminDeleteLeadWorkflowRecordRequest {
  leadId?: string | null;
  demoId?: string | null;
}

const cleanText = (value: unknown, maxLength = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const optionalText = (value: unknown, maxLength = 2000): string | null => {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
};

const normalizeRole = (value: unknown): string => cleanText(value, 80).toLowerCase();

const normalizeDemoChildForKey = (value: unknown): string =>
  cleanText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeDemoPhoneForKey = (value: unknown): string =>
  cleanText(value, 80).replace(/[^\d]/g, '');

const buildDemoDedupeKey = (childName: unknown, phone: unknown): string | null => {
  const child = normalizeDemoChildForKey(childName);
  const digits = normalizeDemoPhoneForKey(phone);
  if (!child || digits.length < 7) return null;
  return createHash('sha256').update(`${child}|${digits}`).digest('hex');
};

const normalizeLeadSource = (value: unknown): string => {
  const source = cleanText(value, 120).toLowerCase();
  if (source === 'website') return 'website';
  if (source === 'whatsapp') return 'whatsapp';
  if (source === 'instagram') return 'instagram';
  if (source === 'referral') return 'referral';
  return 'manual';
};

const demoSourceLabel = (value: unknown): string => {
  const source = normalizeLeadSource(value);
  if (source === 'website') return 'Website';
  if (source === 'whatsapp') return 'WhatsApp';
  if (source === 'instagram') return 'Instagram';
  if (source === 'referral') return 'Referral';
  return cleanText(value, 120) || 'Manual';
};

const courseToLeadTrack = (value: unknown): 'phonics' | 'grammar' | 'public_speaking' => {
  const course = cleanText(value, 160).toLowerCase();
  if (course.includes('grammar') || course.includes('writing')) return 'grammar';
  if (course.includes('speaking') || course.includes('communication')) return 'public_speaking';
  return 'phonics';
};

const cleanAge = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 25) {
    throw new HttpsError('invalid-argument', 'Child age must be a valid number.');
  }
  return Math.round(value);
};

const stringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item, 120)).filter(Boolean);
};

const appendAdminHistory = (
  existing: unknown,
  caller: AdminCaller,
  note: string,
): Array<Record<string, unknown>> => {
  const history = Array.isArray(existing)
    ? existing.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
  return [
    ...history.slice(-(MAX_HISTORY_ENTRIES - 1)),
    {
      action: 'admin_details_updated',
      actorId: caller.uid,
      actorName: caller.displayName,
      atMs: Date.now(),
      note,
    },
  ];
};

async function requireAdmin(auth: any): Promise<AdminCaller> {
  const uid = cleanText(auth?.uid, 160);
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

  const db = admin.firestore();
  const userSnap = await db.collection('users').doc(uid).get();
  if (!userSnap.exists) throw new HttpsError('permission-denied', 'Admin profile not found.');

  const data = userSnap.data() || {};
  const role = normalizeRole(data.role || auth?.token?.role);
  if (role !== 'admin') throw new HttpsError('permission-denied', 'Only admin can manage leads.');

  return {
    uid,
    displayName:
      cleanText(data.name, 120) ||
      cleanText(data.displayName, 120) ||
      cleanText(data.email, 160) ||
      cleanText(auth?.token?.email, 160) ||
      'Admin',
  };
}

export const adminUpdateLeadWorkflowRecord = onCall<AdminUpdateLeadWorkflowRecordRequest>(
  { region: REGION },
  async (request): Promise<{ ok: true }> => {
    const caller = await requireAdmin(request.auth);
    const leadId = optionalText(request.data?.leadId, 160);
    const demoId = optionalText(request.data?.demoId, 160);
    if (!leadId && !demoId) {
      throw new HttpsError('invalid-argument', 'A lead or demo record is required.');
    }

    const parentName = cleanText(request.data?.parentName, 160);
    const parentPhone = cleanText(request.data?.parentPhone, 80);
    const parentEmail = optionalText(request.data?.parentEmail, 200);
    const childName = cleanText(request.data?.childName, 160);
    const childAge = cleanAge(request.data?.childAge);
    const childGrade = optionalText(request.data?.childGrade, 80);
    const course = cleanText(request.data?.course, 160);
    const sourceInput = optionalText(request.data?.source, 120) || 'Manual';
    const preferredTimingText = optionalText(request.data?.preferredTimingText, 500);
    const timezone = optionalText(request.data?.timezone, 120);
    const notes = optionalText(request.data?.notes, 2000);

    if (!parentName || !parentPhone || !childName || !course) {
      throw new HttpsError(
        'invalid-argument',
        'Parent name, parent phone, child name and course are required.',
      );
    }

    const db = admin.firestore();
    const leadRef = leadId ? db.collection('leads').doc(leadId) : null;
    const demoRef = demoId ? db.collection('demoSessions').doc(demoId) : null;
    const privateRef = demoId ? db.collection('demoSessionsPrivate').doc(demoId) : null;
    const normalizedLeadSource = normalizeLeadSource(sourceInput);
    const newDemoDedupeKey = demoId ? buildDemoDedupeKey(childName, parentPhone) : null;

    await db.runTransaction(async (tx) => {
      const leadSnap = leadRef ? await tx.get(leadRef) : null;
      const demoSnap = demoRef ? await tx.get(demoRef) : null;
      const privateSnap = privateRef ? await tx.get(privateRef) : null;

      if (leadRef && !leadSnap?.exists) throw new HttpsError('not-found', 'Lead no longer exists.');
      if (demoRef && !demoSnap?.exists) throw new HttpsError('not-found', 'Demo no longer exists.');

      const lead = leadSnap?.data() || {};
      const demo = demoSnap?.data() || {};
      const privateData = privateSnap?.data() || {};

      const previousDemoDedupeKey = demoId
        ? cleanText(demo.dedupeKey, 128) || buildDemoDedupeKey(demo.childName, privateData.parentPhone)
        : null;
      const nextDemoDedupeRef = newDemoDedupeKey
        ? db.collection(DEMO_UNIQUE_KEYS_COLLECTION).doc(newDemoDedupeKey)
        : null;
      const previousDemoDedupeRef =
        previousDemoDedupeKey && previousDemoDedupeKey !== newDemoDedupeKey
          ? db.collection(DEMO_UNIQUE_KEYS_COLLECTION).doc(previousDemoDedupeKey)
          : null;
      const nextDemoDedupeSnap = nextDemoDedupeRef ? await tx.get(nextDemoDedupeRef) : null;
      const previousDemoDedupeSnap = previousDemoDedupeRef
        ? await tx.get(previousDemoDedupeRef)
        : null;

      if (nextDemoDedupeSnap?.exists) {
        const mappedDemoId = cleanText(nextDemoDedupeSnap.data()?.demoId, 160);
        if (mappedDemoId && mappedDemoId !== demoId) {
          throw new HttpsError(
            'already-exists',
            'Another demo already uses this child and parent phone combination.',
          );
        }
      }

      const previousLeadIdentityKey = leadId
        ? cleanText(lead.dedupeIdentityKey, 160) ||
          buildWebsiteLeadIdentityKey(
            lead.phoneNormalized || lead.primaryPhone || lead.whatsappNumber,
            lead.childName,
          )
        : null;
      const nextLeadIdentityKey =
        leadId && normalizedLeadSource === 'website'
          ? buildWebsiteLeadIdentityKey(parentPhone, childName)
          : null;
      const nextLeadIdentityRef = nextLeadIdentityKey
        ? db.collection(LEAD_IDENTITY_INDEX_COLLECTION).doc(nextLeadIdentityKey)
        : null;
      const previousLeadIdentityRef =
        previousLeadIdentityKey && previousLeadIdentityKey !== nextLeadIdentityKey
          ? db.collection(LEAD_IDENTITY_INDEX_COLLECTION).doc(previousLeadIdentityKey)
          : null;
      const nextLeadIdentitySnap = nextLeadIdentityRef ? await tx.get(nextLeadIdentityRef) : null;
      const previousLeadIdentitySnap = previousLeadIdentityRef
        ? await tx.get(previousLeadIdentityRef)
        : null;

      if (nextLeadIdentitySnap?.exists) {
        const canonicalLeadId = cleanText(nextLeadIdentitySnap.data()?.canonicalLeadId, 160);
        if (canonicalLeadId && canonicalLeadId !== leadId) {
          throw new HttpsError(
            'already-exists',
            'Another website lead already uses this child and parent phone combination.',
          );
        }
      }

      if (demoRef && privateRef && demoId) {
        const effectiveGrade = childGrade || cleanText(demo.childGrade, 80) || 'Not specified';
        const effectiveTiming =
          preferredTimingText ||
          cleanText(demo.preferredDateTimeText, 500) ||
          'To be scheduled with parent';

        tx.update(demoRef, {
          parentName,
          childName,
          childAge,
          childGrade: effectiveGrade,
          courseInterested: course,
          source: demoSourceLabel(sourceInput),
          preferredDateTimeText: effectiveTiming,
          timezone: timezone || cleanText(demo.timezone, 120) || 'IST',
          adminNotes: notes,
          dedupeKey: newDemoDedupeKey,
          history: appendAdminHistory(
            demo.history,
            caller,
            'Admin updated lead details from Leads & Enquiries.',
          ),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: caller.uid,
        });

        tx.set(
          privateRef,
          {
            parentPhone,
            parentPhoneKey: normalizeDemoPhoneForKey(parentPhone),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedBy: caller.uid,
          },
          { merge: true },
        );

        if (nextDemoDedupeRef && newDemoDedupeKey) {
          tx.set(
            nextDemoDedupeRef,
            {
              demoId,
              dedupeKey: newDemoDedupeKey,
              childNameKey: normalizeDemoChildForKey(childName),
              parentPhoneKey: normalizeDemoPhoneForKey(parentPhone),
              lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              lastUpdatedBy: caller.uid,
            },
            { merge: true },
          );
        }
        if (previousDemoDedupeRef && previousDemoDedupeSnap?.exists) {
          const mappedDemoId = cleanText(previousDemoDedupeSnap.data()?.demoId, 160);
          if (mappedDemoId === demoId) tx.delete(previousDemoDedupeRef);
        }
      }

      if (leadRef && leadId) {
        const leadPatch: Record<string, unknown> = {
          parentName,
          primaryPhone: parentPhone,
          phoneNormalized: normalizeWebsiteLeadPhone(parentPhone),
          parentEmail,
          childName,
          childAge,
          childGrade,
          programInterest: course,
          interestTrack: courseToLeadTrack(course),
          source: normalizedLeadSource,
          preferredTimingText,
          timezone,
          notes,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedBy: caller.uid,
        };
        if (Object.prototype.hasOwnProperty.call(lead, 'whatsappNumber')) {
          leadPatch.whatsappNumber = parentPhone;
        }

        if (normalizedLeadSource === 'website' && nextLeadIdentityKey && nextLeadIdentityRef) {
          leadPatch.dedupeIdentityKey = nextLeadIdentityKey;
          leadPatch.dedupeCanonicalLeadId = leadId;
          leadPatch.dedupeVersion = 1;
          leadPatch.dedupeConflict = admin.firestore.FieldValue.delete();
          leadPatch.dedupeConflictCanonicalLeadId = admin.firestore.FieldValue.delete();
          leadPatch.dedupeConflictAt = admin.firestore.FieldValue.delete();
          tx.set(
            nextLeadIdentityRef,
            {
              canonicalLeadId: leadId,
              identityKey: nextLeadIdentityKey,
              version: 1,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        } else {
          leadPatch.dedupeIdentityKey = admin.firestore.FieldValue.delete();
          leadPatch.dedupeCanonicalLeadId = admin.firestore.FieldValue.delete();
          leadPatch.dedupeConflict = admin.firestore.FieldValue.delete();
          leadPatch.dedupeConflictCanonicalLeadId = admin.firestore.FieldValue.delete();
          leadPatch.dedupeConflictAt = admin.firestore.FieldValue.delete();
        }

        if (previousLeadIdentityRef && previousLeadIdentitySnap?.exists) {
          const canonicalLeadId = cleanText(previousLeadIdentitySnap.data()?.canonicalLeadId, 160);
          if (canonicalLeadId === leadId) tx.delete(previousLeadIdentityRef);
        }

        tx.update(leadRef, leadPatch);
      }
    });

    return { ok: true };
  },
);

export const adminDeleteLeadWorkflowRecord = onCall<AdminDeleteLeadWorkflowRecordRequest>(
  { region: REGION },
  async (request): Promise<{ ok: true; deletedLeads: number; archivedDemos: number }> => {
    const caller = await requireAdmin(request.auth);
    const initialLeadId = optionalText(request.data?.leadId, 160);
    const initialDemoId = optionalText(request.data?.demoId, 160);
    if (!initialLeadId && !initialDemoId) {
      throw new HttpsError('invalid-argument', 'A lead or demo record is required.');
    }

    const db = admin.firestore();
    const leadIds = new Set<string>();
    const demoIds = new Set<string>();
    if (initialLeadId) leadIds.add(initialLeadId);
    if (initialDemoId) demoIds.add(initialDemoId);

    const leadData = new Map<string, Record<string, unknown>>();
    const demoData = new Map<string, Record<string, unknown>>();
    const privateData = new Map<string, Record<string, unknown>>();
    const processedLeads = new Set<string>();
    const processedDemos = new Set<string>();

    // Resolve the whole workflow record. This includes rescheduled/historical demos and
    // compatibility demo_* lead records so a deleted row cannot reappear in another bucket.
    while (
      [...leadIds].some((id) => !processedLeads.has(id)) ||
      [...demoIds].some((id) => !processedDemos.has(id))
    ) {
      for (const leadId of [...leadIds]) {
        if (processedLeads.has(leadId)) continue;
        processedLeads.add(leadId);
        const leadSnap = await db.collection('leads').doc(leadId).get();
        if (leadSnap.exists) {
          const data = leadSnap.data() || {};
          leadData.set(leadId, data);
          const linkedDemoId = cleanText(data.demoSessionId, 160);
          if (linkedDemoId) demoIds.add(linkedDemoId);
          stringArray(data.demoIds).forEach((id) => demoIds.add(id));
        }
        const linkedDemos = await db.collection('demoSessions').where('leadId', '==', leadId).get();
        linkedDemos.docs.forEach((docSnap) => demoIds.add(docSnap.id));
      }

      for (const demoId of [...demoIds]) {
        if (processedDemos.has(demoId)) continue;
        processedDemos.add(demoId);
        const [demoSnap, privateSnap] = await Promise.all([
          db.collection('demoSessions').doc(demoId).get(),
          db.collection('demoSessionsPrivate').doc(demoId).get(),
        ]);
        if (demoSnap.exists) {
          const data = demoSnap.data() || {};
          demoData.set(demoId, data);
          const linkedLeadId = cleanText(data.leadId, 160);
          if (linkedLeadId) leadIds.add(linkedLeadId);
        }
        if (privateSnap.exists) privateData.set(demoId, privateSnap.data() || {});

        const matchingLeads = await db.collection('leads').where('demoSessionId', '==', demoId).get();
        matchingLeads.docs.forEach((docSnap) => leadIds.add(docSnap.id));
      }
    }

    if (leadData.size === 0 && demoData.size === 0) {
      throw new HttpsError('not-found', 'This lead has already been removed.');
    }

    const identityRefs = new Map<string, FirebaseFirestore.DocumentReference>();
    leadData.forEach((data, leadId) => {
      const identityKey =
        cleanText(data.dedupeIdentityKey, 160) ||
        buildWebsiteLeadIdentityKey(
          data.phoneNormalized || data.primaryPhone || data.whatsappNumber,
          data.childName,
        );
      if (identityKey) {
        identityRefs.set(
          leadId,
          db.collection(LEAD_IDENTITY_INDEX_COLLECTION).doc(identityKey),
        );
      }
    });

    const demoKeyRefs = new Map<string, FirebaseFirestore.DocumentReference>();
    demoData.forEach((data, demoId) => {
      const dedupeKey =
        cleanText(data.dedupeKey, 160) ||
        buildDemoDedupeKey(data.childName, privateData.get(demoId)?.parentPhone);
      if (dedupeKey) {
        demoKeyRefs.set(
          demoId,
          db.collection(DEMO_UNIQUE_KEYS_COLLECTION).doc(dedupeKey),
        );
      }
    });

    await db.runTransaction(async (tx) => {
      const identitySnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      const demoKeySnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      const liveLeadSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      const liveDemoSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      const livePrivateSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();

      for (const leadId of leadData.keys()) {
        liveLeadSnaps.set(leadId, await tx.get(db.collection('leads').doc(leadId)));
      }
      for (const demoId of demoData.keys()) {
        liveDemoSnaps.set(demoId, await tx.get(db.collection('demoSessions').doc(demoId)));
        livePrivateSnaps.set(
          demoId,
          await tx.get(db.collection('demoSessionsPrivate').doc(demoId)),
        );
      }
      for (const [leadId, ref] of identityRefs) identitySnaps.set(leadId, await tx.get(ref));
      for (const [demoId, ref] of demoKeyRefs) demoKeySnaps.set(demoId, await tx.get(ref));

      for (const [leadId, snap] of liveLeadSnaps) {
        if (snap.exists) tx.delete(snap.ref);
        const identityRef = identityRefs.get(leadId);
        const identitySnap = identitySnaps.get(leadId);
        if (identityRef && identitySnap?.exists) {
          const canonicalLeadId = cleanText(identitySnap.data()?.canonicalLeadId, 160);
          if (canonicalLeadId === leadId) tx.delete(identityRef);
        }
      }

      for (const [demoId, snap] of liveDemoSnaps) {
        if (!snap.exists) continue;
        tx.update(snap.ref, {
          archived: true,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          archivedBy: caller.uid,
          archiveReason: 'admin_deleted_from_leads_workspace',
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedBy: caller.uid,
        });
        const privateSnap = livePrivateSnaps.get(demoId);
        if (privateSnap?.exists) {
          tx.set(
            privateSnap.ref,
            {
              archived: true,
              archivedAt: admin.firestore.FieldValue.serverTimestamp(),
              archivedBy: caller.uid,
            },
            { merge: true },
          );
        }
        const keyRef = demoKeyRefs.get(demoId);
        const keySnap = demoKeySnaps.get(demoId);
        if (keyRef && keySnap?.exists) {
          const mappedDemoId = cleanText(keySnap.data()?.demoId, 160);
          if (mappedDemoId === demoId) tx.delete(keyRef);
        }
      }
    });

    // Redirects are only attribution helpers. Once the canonical lead is deleted, keeping
    // them would route late attribution to a non-existent lead.
    const redirectRefs: FirebaseFirestore.DocumentReference[] = [];
    for (const leadId of leadData.keys()) {
      const redirectSnap = await db
        .collection(LEAD_MERGE_REDIRECTS_COLLECTION)
        .where('canonicalLeadId', '==', leadId)
        .get();
      redirectSnap.docs.forEach((docSnap) => redirectRefs.push(docSnap.ref));
    }
    if (redirectRefs.length > 0) {
      const batches: FirebaseFirestore.WriteBatch[] = [];
      let batch = db.batch();
      let count = 0;
      redirectRefs.forEach((ref) => {
        batch.delete(ref);
        count += 1;
        if (count === 400) {
          batches.push(batch);
          batch = db.batch();
          count = 0;
        }
      });
      if (count > 0) batches.push(batch);
      for (const pending of batches) await pending.commit();
    }

    return {
      ok: true,
      deletedLeads: leadData.size,
      archivedDemos: demoData.size,
    };
  },
);
