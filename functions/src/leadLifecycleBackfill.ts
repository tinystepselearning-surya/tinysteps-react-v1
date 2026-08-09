import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const DELIVERED_DEMO_OUTCOMES = new Set(['', 'completed', 'not_interested', 'follow_up_needed']);

const text = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const normalizeRole = (value: unknown): string => text(value, 80).toLowerCase();
const phoneDigits = (value: unknown): string => text(value, 80).replace(/[^\d]/g, '');

const timestampMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'object' && value !== null) {
    const maybe = value as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') return maybe.toMillis();
    if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  }
  return 0;
};

const requestDateTimestamp = (value: unknown): FirebaseFirestore.Timestamp | null => {
  const raw = text(value, 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const parsed = new Date(`${raw}T12:00:00+05:30`);
  return Number.isFinite(parsed.getTime()) ? admin.firestore.Timestamp.fromDate(parsed) : null;
};

const leadSource = (value: unknown): string => {
  const source = text(value, 80).toLowerCase();
  return ['website', 'whatsapp', 'instagram', 'referral'].includes(source) ? source : 'manual';
};

const leadTrack = (value: unknown): string => {
  const course = text(value, 120).toLowerCase();
  if (course.includes('grammar') || course.includes('writing')) return 'grammar';
  if (course.includes('speaking') || course.includes('communication')) return 'public_speaking';
  return 'phonics';
};

const leadStatus = (demo: Record<string, unknown>): string => {
  const conversion = text(demo.conversionStatus, 80).toLowerCase();
  if (conversion === 'enrolled') return 'admitted_confirmed';
  if (conversion === 'interested' || conversion === 'follow_up_later') return 'admission_follow_up';
  if (['not_interested', 'wrong_fit', 'no_response'].includes(conversion)) return conversion;
  const status = text(demo.status, 80).toLowerCase();
  if (status === 'completed') return 'demo_completed';
  if (status === 'assigned') return 'demo_booked';
  if (status === 'open' || status === 'cancelled') return 'demo_pending_schedule';
  return 'new';
};

export const adminBackfillLeadLifecycle = onCall<{ limit?: number; dryRun?: boolean }>(
  { region: REGION, timeoutSeconds: 540, memory: '512MiB' },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required');
    const db = admin.firestore();
    const callerSnap = await db.collection('users').doc(uid).get();
    if (!callerSnap.exists || normalizeRole(callerSnap.data()?.role) !== 'admin') {
      throw new HttpsError('permission-denied', 'Only admin can run lead lifecycle backfill');
    }

    const requestedLimit = Number(request.data?.limit || 2000);
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 2000, 5000));
    const dryRun = request.data?.dryRun !== false;
    const demoSnap = await db
      .collection('demoSessions')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(limit + 1)
      .get();
    const hasMore = demoSnap.size > limit;
    if (!dryRun && hasMore) {
      throw new HttpsError(
        'failed-precondition',
        `Migration would be incomplete: more than ${limit} demos exist. Rerun dry-run with a sufficient limit.`,
      );
    }
    const selectedDemoDocs = demoSnap.docs.slice(0, limit);
    const privateRefs = selectedDemoDocs.map((docSnap) => db.collection('demoSessionsPrivate').doc(docSnap.id));
    const privateDocs = privateRefs.length > 0 ? await db.getAll(...privateRefs) : [];

    const demos = new Map<string, Record<string, unknown>>();
    selectedDemoDocs.forEach((docSnap) => demos.set(docSnap.id, docSnap.data() || {}));
    const phones = new Map<string, string>();
    privateDocs.forEach((docSnap) => {
      const phone = text(docSnap.data()?.parentPhone, 80);
      if (phone) phones.set(docSnap.id, phone);
    });

    const resolvedLeadIds = new Map<string, string>();
    const resolving = new Set<string>();
    const resolveLeadId = (demoId: string): string => {
      const cached = resolvedLeadIds.get(demoId);
      if (cached) return cached;
      if (resolving.has(demoId)) return `demo_${demoId}`;
      resolving.add(demoId);
      const demo = demos.get(demoId) || {};
      const priorId = text(demo.rescheduledFromDemoId, 120);
      // The reschedule edge is authoritative even when an old async reconciler
      // previously attached the follow-up attempt to a separate generated lead.
      let leadId = priorId && demos.has(priorId)
        ? resolveLeadId(priorId)
        : text(demo.leadId, 120);
      if (!leadId) leadId = `demo_${demoId}`;
      resolving.delete(demoId);
      resolvedLeadIds.set(demoId, leadId);
      return leadId;
    };

    const groups = new Map<string, Array<{ id: string; data: Record<string, unknown> }>>();
    selectedDemoDocs.forEach((docSnap) => {
      const leadId = resolveLeadId(docSnap.id);
      const list = groups.get(leadId) || [];
      list.push({ id: docSnap.id, data: docSnap.data() || {} });
      groups.set(leadId, list);
    });

    let demosLinked = 0;
    let leadsCreated = 0;
    let leadsUpdated = 0;

    for (const [leadId, group] of groups) {
      group.sort((a, b) => timestampMillis(a.data.createdAt) - timestampMillis(b.data.createdAt));
      const first = group[0];
      const latest = group[group.length - 1];
      const leadRef = db.collection('leads').doc(leadId);
      const existingLeadSnap = await leadRef.get();
      const existing = existingLeadSnap.exists ? (existingLeadSnap.data() || {}) : {};
      const receivedAt =
        existing.receivedAt ||
        existing.requestedAt ||
        existing.createdAt ||
        requestDateTimestamp(first.data.requestReceivedDate) ||
        first.data.createdAt ||
        admin.firestore.FieldValue.serverTimestamp();
      const phone = group.map((item) => phones.get(item.id) || '').find(Boolean) || '';
      const firstAssigned = group.find((item) => item.data.assignedAt)?.data.assignedAt || null;
      const firstCompleted = group.find((item) => item.data.completedAt)?.data.completedAt || null;
      const enrolledAttempt = group.find(
        (item) => text(item.data.conversionStatus, 80).toLowerCase() === 'enrolled',
      );
      const completedAttempt = [...group]
        .reverse()
        .find((item) => (
          text(item.data.status, 80).toLowerCase() === 'completed' &&
          DELIVERED_DEMO_OUTCOMES.has(text(item.data.outcome, 80).toLowerCase())
        ));
      const cancelledAttempt = [...group]
        .reverse()
        .find((item) => text(item.data.status, 80).toLowerCase() === 'cancelled');
      const lifecycleAttempt = enrolledAttempt || completedAttempt || latest;

      const leadPayload: Record<string, unknown> = {
        receivedAt,
        demoSessionId: latest.id,
        demoIds: admin.firestore.FieldValue.arrayUnion(...group.map((item) => item.id)),
        status: leadStatus(lifecycleAttempt.data),
        demoStatus: text(latest.data.status, 80) || null,
        conversionStatus: text(lifecycleAttempt.data.conversionStatus, 80) || null,
        demoCreatedAt: first.data.createdAt || receivedAt,
        demoAssignedAt: firstAssigned,
        demoCompletedAt: firstCompleted,
        enrolledAt:
          enrolledAttempt
            ? enrolledAttempt.data.enrolledAt || enrolledAttempt.data.lastUpdatedAt || enrolledAttempt.data.completedAt || null
            : existing.enrolledAt || null,
        demoCancelledAt: cancelledAttempt?.data.cancelledAt || null,
        demoCancellationReason: cancelledAttempt ? text(cancelledAttempt.data.cancellationReason, 120) || null : null,
        demoCompletedByTeacherId:
          completedAttempt?.data.completedByTeacherId || completedAttempt?.data.assignedTeacherId || null,
        demoCompletedByTeacherName:
          completedAttempt?.data.completedByTeacherName || completedAttempt?.data.assignedTeacherName || null,
        lifecycleVersion: 2,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: uid,
      };

      if (!existingLeadSnap.exists) {
        Object.assign(leadPayload, {
          parentName: text(first.data.parentName, 120) || null,
          childName: text(first.data.childName, 120) || null,
          childAge: typeof first.data.childAge === 'number' ? first.data.childAge : null,
          childGrade: text(first.data.childGrade, 80) || null,
          interestTrack: leadTrack(first.data.courseInterested),
          programInterest: text(first.data.courseInterested, 120) || null,
          source: leadSource(first.data.source),
          sourceDetail: 'legacy_demo_backfill',
          primaryPhone: phone || null,
          phoneNormalized: phoneDigits(phone) || null,
          priority: 'normal',
          createdAt: first.data.createdAt || receivedAt,
          createdBy: text(first.data.createdBy, 120) || uid,
        });
        leadsCreated += 1;
      } else {
        leadsUpdated += 1;
      }
      const missingLinks = group.filter((item) => text(item.data.leadId, 120) !== leadId);
      demosLinked += missingLinks.length;
      if (!dryRun) {
        if (missingLinks.length > 450) {
          throw new HttpsError('resource-exhausted', `Lead ${leadId} has too many demo attempts for one transaction.`);
        }
        await db.runTransaction(async (tx) => {
          const freshLead = await tx.get(leadRef);
          const fresh = freshLead.exists ? (freshLead.data() || {}) : {};
          const transactionalPayload = { ...leadPayload };
          if (fresh.receivedAt) transactionalPayload.receivedAt = fresh.receivedAt;
          tx.set(leadRef, transactionalPayload, { merge: true });
          for (const item of missingLinks) {
            tx.set(db.collection('demoSessions').doc(item.id), { leadId }, { merge: true });
          }
        });
      }
    }

    return {
      ok: true,
      dryRun,
      hasMore,
      demosScanned: selectedDemoDocs.length,
      leadGroups: groups.size,
      demosLinked,
      leadsCreated,
      leadsUpdated,
    };
  },
);
