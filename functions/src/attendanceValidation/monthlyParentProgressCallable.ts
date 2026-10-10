import * as admin from 'firebase-admin';
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https';
import { ensureCanonicalAdmin } from '../helpers/canonicalAdminGuard';
import { alreadyReviewedCurrentBilling, alreadySentCurrentInvoice } from './monthlyParentWorkflowDecisions';

if (!admin.apps.length) admin.initializeApp();

const COLLECTION = 'attendanceValidationMonthlyParentProgress';
const START_MONTH = '2026-09';
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ALLOWED_STATUSES = new Set(['not_started', 'in_progress', 'completed']);

type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

function cleanId(value: unknown, field: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > 180 || text.includes('/') || [...text].some((char) => char.charCodeAt(0) < 32)) {
    throw new HttpsError('invalid-argument', `${field} is invalid.`);
  }
  return text;
}

function cleanMonth(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!MONTH_RE.test(text) || text < START_MONTH) {
    throw new HttpsError('invalid-argument', 'monthKey must be a completed AVS month from 2026-09 onward.');
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const currentMonth = year && month ? `${year}-${month}` : '';
  if (!MONTH_RE.test(currentMonth)) {
    throw new HttpsError('internal', 'Unable to resolve the current IST month.');
  }
  if (text >= currentMonth) {
    throw new HttpsError('failed-precondition', 'Only fully completed months can be tracked.');
  }
  return text;
}

function cleanStatus(value: unknown): ProgressStatus {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!ALLOWED_STATUSES.has(text)) {
    throw new HttpsError('invalid-argument', 'status must be not_started, in_progress, or completed.');
  }
  return text as ProgressStatus;
}


type WorkflowAction = 'billing_reviewed' | 'invoice_sent';

function cleanWorkflowAction(value: unknown): WorkflowAction | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  if (text !== 'billing_reviewed' && text !== 'invoice_sent') {
    throw new HttpsError('invalid-argument', 'workflowAction is invalid.');
  }
  return text;
}

function amount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 0) : 0;
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function currentBillingSnapshot(data: Record<string, unknown>): {
  sessionCount: number;
  billedClassCount: number;
  billedAmount: number;
  settledAmount: number;
  dueAmount: number;
  chargeIds: string[];
  fingerprint: string;
} {
  const totals = data.totals && typeof data.totals === 'object' && !Array.isArray(data.totals)
    ? data.totals as Record<string, unknown>
    : {};
  const billedClassCount = integer(data.billedClassCount ?? totals.billedClassCount ?? totals.chargesCount);
  const billedAmount = amount(data.billedAmount ?? totals.billedAmount);
  const settledAmount = Math.min(
    amount(
      data.settledAmount
      ?? data.appliedAmount
      ?? totals.settledAmount
      ?? totals.appliedAmount
      ?? totals.paidAmountFromCharges,
    ),
    billedAmount,
  );
  const rawDue = data.dueAmount ?? data.outstandingAmount ?? totals.dueAmount ?? totals.outstandingAmount;
  const dueAmount = rawDue == null
    ? Math.max(billedAmount - settledAmount, 0)
    : Math.min(amount(rawDue), billedAmount);
  const rawChargeIds = Array.isArray(data.chargeIds ?? totals.chargeIds)
    ? (data.chargeIds ?? totals.chargeIds) as unknown[]
    : [];
  const chargeIds = Array.from(new Set(
    rawChargeIds.map((item) => String(item || '').trim()).filter(Boolean),
  )).sort();
  const attendance = data.attendance && typeof data.attendance === 'object'
    ? data.attendance as Record<string, unknown> : {};
  const attendanceTotals = attendance.totals && typeof attendance.totals === 'object'
    ? attendance.totals as Record<string, unknown> : {};
  const sessionCount = integer(attendance.sourceSessionCount ?? attendance.sourceSessionRecords
    ?? attendanceTotals.totalSessions ?? attendanceTotals.total);
  const normalized = [
    billedClassCount,
    Math.round(billedAmount * 100),
    ...chargeIds,
  ].join('|');
  return {
    sessionCount,
    billedClassCount,
    billedAmount,
    settledAmount,
    dueAmount,
    chargeIds,
    fingerprint: typeof data.billingCompositionFingerprint === 'string' && data.billingCompositionFingerprint
      ? data.billingCompositionFingerprint
      : `v1:${stableHash(normalized)}`,
  };
}

function actorEmail(auth: unknown): string | null {
  const token = (auth as { token?: Record<string, unknown> } | null)?.token;
  return typeof token?.email === 'string' ? token.email : null;
}

export const updateAttendanceValidationMonthlyParentProgress = onCall({
  region: 'asia-south1',
  memory: '256MiB',
  invoker: 'public',
  labels: { 'avs-public-invoker': 'true' },
  timeoutSeconds: 60,
  maxInstances: 2,
}, (request) => handleMonthlyParentProgress(request));

export async function handleMonthlyParentProgress(
  request: CallableRequest<Record<string, unknown>>,
  db: admin.firestore.Firestore = admin.firestore(),
) {
  await ensureCanonicalAdmin(request.auth);
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in as an admin.');

  const parentId = cleanId(request.data?.parentId, 'parentId');
  const monthKey = cleanMonth(request.data?.monthKey);
  const workflowAction = cleanWorkflowAction(request.data?.workflowAction);

  const parentSnapshot = await db.collection('users').doc(parentId).get();
  const parentRole = String(parentSnapshot.data()?.role ?? '').trim().toLowerCase();
  if (!parentSnapshot.exists || parentRole !== 'parent') {
    throw new HttpsError('failed-precondition', 'The selected user is not a canonical parent.');
  }

  const progressId = `${monthKey}__${parentId}`;
  const ref = db.collection(COLLECTION).doc(progressId);

  if (workflowAction) {
    const billingRef = db
      .collection('parentMonthlyReadModels')
      .doc(parentId)
      .collection('months')
      .doc(monthKey);

    return db.runTransaction(async (tx) => {
      const [progressSnapshot, billingSnapshot] = await Promise.all([
        tx.get(ref),
        tx.get(billingRef),
      ]);
      if (!progressSnapshot.exists || progressSnapshot.data()?.status !== 'completed') {
        throw new HttpsError(
          'failed-precondition',
          'Complete the attendance review before continuing the month close workflow.',
        );
      }
      if (!billingSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'The canonical monthly billing read model is not available.',
        );
      }

      const progressData = progressSnapshot.data() as Record<string, unknown>;
      const billing = currentBillingSnapshot(
        billingSnapshot.data() as Record<string, unknown>,
      );
      const now = admin.firestore.Timestamp.now();
      const email = actorEmail(request.auth);

      if (workflowAction === 'billing_reviewed') {
        if (alreadyReviewedCurrentBilling(progressData, billing.fingerprint)) {
          return {
            ok: true, parentId, monthKey, workflowAction,
            billingReviewedAt: (progressData.billingReviewedAt as admin.firestore.Timestamp).toDate().toISOString(),
            billingReviewedFingerprint: billing.fingerprint,
            billing,
          };
        }
        tx.set(ref, {
          schemaVersion: 2,
          billingReviewedAt: now,
          billingReviewedByUid: uid,
          billingReviewedByEmail: email,
          billingReviewedFingerprint: billing.fingerprint,
          updatedAt: now,
          updatedByUid: uid,
          updatedByEmail: email,
        }, { merge: true });
        return {
          ok: true,
          parentId,
          monthKey,
          workflowAction,
          billingReviewedAt: now.toDate().toISOString(),
          billingReviewedFingerprint: billing.fingerprint,
          billing,
        };
      }

      if (progressData.billingReviewedFingerprint !== billing.fingerprint) {
        throw new HttpsError(
          'failed-precondition',
          'Billing changed after review. Review billing again before marking the invoice as sent.',
        );
      }
      if (billing.billedAmount <= 0.01) {
        throw new HttpsError(
          'failed-precondition',
          'This month has no billable amount and does not require an invoice.',
        );
      }

      if (alreadySentCurrentInvoice(progressData, billing.fingerprint)) {
        return {
          ok: true, parentId, monthKey, workflowAction,
          invoiceSentAt: (progressData.invoiceSentAt as admin.firestore.Timestamp).toDate().toISOString(),
          sentBillingFingerprint: billing.fingerprint,
          billing,
        };
      }

      tx.set(ref, {
        schemaVersion: 2,
        invoiceSentAt: now,
        invoiceSentByUid: uid,
        invoiceSentByEmail: email,
        sentBillingFingerprint: billing.fingerprint,
        updatedAt: now,
        updatedByUid: uid,
        updatedByEmail: email,
      }, { merge: true });
      return {
        ok: true,
        parentId,
        monthKey,
        workflowAction,
        invoiceSentAt: now.toDate().toISOString(),
        sentBillingFingerprint: billing.fingerprint,
        billing,
      };
    });
  }

  const status = cleanStatus(request.data?.status);

  if (status === 'not_started') {
    await ref.delete();
    return {
      ok: true,
      parentId,
      monthKey,
      status,
      updatedAt: null,
      completedAt: null,
    };
  }

  const existing = await ref.get();
  const existingData = existing.data() as Record<string, unknown> | undefined;
  const now = admin.firestore.Timestamp.now();
  const completedAt = status === 'completed'
    ? (
        existingData?.status === 'completed'
        && existingData.completedAt instanceof admin.firestore.Timestamp
          ? existingData.completedAt
          : now
      )
    : null;

  await ref.set({
    schemaVersion: 2,
    parentId,
    monthKey,
    status,
    updatedAt: now,
    updatedByUid: uid,
    updatedByEmail: actorEmail(request.auth),
    completedAt,
  }, { merge: true });

  return {
    ok: true,
    parentId,
    monthKey,
    status,
    updatedAt: now.toDate().toISOString(),
    completedAt: completedAt?.toDate().toISOString() ?? null,
  };
}
