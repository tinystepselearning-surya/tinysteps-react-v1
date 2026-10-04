import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  buildParentPaymentBackfillDryRunReport,
  type ParentPaymentBackfillChargeInput,
  type ParentPaymentBackfillMonthlyReadModelInput,
  type ParentPaymentBackfillPaymentInput,
  type ParentPaymentBackfillWalletInput,
  type ParentPaymentBackfillWalletTransactionInput,
} from './parentPaymentBackfillAudit';
import { createParentPaymentBackfillReportHash } from './parentPaymentBackfillHash';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

export type AuditParentPaymentBackfillDryRunRequest = {
  parentId?: string;
  fromMonth?: string;
  toMonth?: string;
  includeArchived?: boolean;
  limitParents?: number;
  limitPayments?: number;
  mode?: 'dry_run';
};

export function normalizeParentPaymentBackfillOptionalText(
  value: unknown,
  maxLength = 150
): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  return raw.slice(0, maxLength);
}

export function normalizeParentPaymentBackfillMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

export function normalizeParentPaymentBackfillLimit(
  value: unknown,
  fallback: number,
  maxValue: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), maxValue);
}

export async function loadParentPaymentBackfillPayments(
  db: admin.firestore.Firestore,
  parentId: string | null,
  fromMonth: string | null,
  toMonth: string | null,
  limitPayments: number
): Promise<ParentPaymentBackfillPaymentInput[]> {
  let query: admin.firestore.Query = db.collection('payments');

  if (parentId) {
    query = query.where('parentId', '==', parentId);
  } else if (fromMonth) {
    query = query.where('monthKey', '>=', fromMonth);
    if (toMonth) query = query.where('monthKey', '<=', toMonth);
  } else if (toMonth) {
    query = query.where('monthKey', '<=', toMonth);
  }

  if (!parentId) {
    query = query.limit(limitPayments);
  }

  const paymentsSnap = await query.get();
  let payments = paymentsSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    data: (docSnap.data() || {}) as Record<string, unknown>,
  }));

  payments = payments
    .sort((left, right) => {
      const leftDate = Number((left.data.paidAt as { toMillis?: () => number } | undefined)?.toMillis?.()) || 0;
      const rightDate = Number((right.data.paidAt as { toMillis?: () => number } | undefined)?.toMillis?.()) || 0;
      if (leftDate !== rightDate) return leftDate - rightDate;
      return left.id.localeCompare(right.id);
    })
    .slice(0, limitPayments);

  const paymentsWithAllocations = await Promise.all(
    payments.map(async (payment) => {
      const allocationSnap = await db
        .collection('payments')
        .doc(payment.id)
        .collection('allocations')
        .get();
      return {
        ...payment,
        allocationDocs: allocationSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        })),
      };
    })
  );

  return paymentsWithAllocations;
}

export async function loadParentPaymentBackfillParentScopedData(
  db: admin.firestore.Firestore,
  parentIds: string[]
): Promise<{
  charges: ParentPaymentBackfillChargeInput[];
  wallets: ParentPaymentBackfillWalletInput[];
  walletTransactions: ParentPaymentBackfillWalletTransactionInput[];
  monthlyReadModels: ParentPaymentBackfillMonthlyReadModelInput[];
  parentProfiles: Array<{ parentId: string; parentName?: string | null }>;
}> {
  const result = {
    charges: [] as ParentPaymentBackfillChargeInput[],
    wallets: [] as ParentPaymentBackfillWalletInput[],
    walletTransactions: [] as ParentPaymentBackfillWalletTransactionInput[],
    monthlyReadModels: [] as ParentPaymentBackfillMonthlyReadModelInput[],
    parentProfiles: [] as Array<{ parentId: string; parentName?: string | null }>,
  };

  await Promise.all(
    parentIds.map(async (parentId) => {
      const [chargesSnap, walletSnap, transactionsSnap, readModelsSnap, userSnap] = await Promise.all([
        db.collection('billingCharges').where('parentId', '==', parentId).get(),
        db.collection('parentWallets').doc(parentId).get(),
        db.collection('parentWallets').doc(parentId).collection('transactions').get(),
        db.collection('parentMonthlyReadModels').doc(parentId).collection('months').get(),
        db.collection('users').doc(parentId).get(),
      ]);

      result.charges.push(
        ...chargesSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
      );

      result.wallets.push({
        parentId,
        data: (walletSnap.data() || {}) as Record<string, unknown>,
      });

      result.walletTransactions.push(
        ...transactionsSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          parentId,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
      );

      result.monthlyReadModels.push(
        ...readModelsSnap.docs.map((docSnap) => ({
          parentId,
          monthKey: docSnap.id,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
      );

      const userData = (userSnap.data() || {}) as Record<string, unknown>;
      result.parentProfiles.push({
        parentId,
        parentName:
          normalizeParentPaymentBackfillOptionalText(userData.name, 200) ||
          normalizeParentPaymentBackfillOptionalText(userData.displayName, 200) ||
          normalizeParentPaymentBackfillOptionalText(userData.parentName, 200),
      });
    })
  );

  return result;
}

export const auditParentPaymentBackfillDryRun = onCall(
  { region: REGION },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as AuditParentPaymentBackfillDryRunRequest;
    const mode = data.mode || 'dry_run';
    if (mode !== 'dry_run') {
      throw new HttpsError('invalid-argument', 'mode must be "dry_run" in this phase');
    }

    const parentId = normalizeParentPaymentBackfillOptionalText(data.parentId, 150);
    const fromMonth = normalizeParentPaymentBackfillMonthKey(data.fromMonth);
    const toMonth = normalizeParentPaymentBackfillMonthKey(data.toMonth);
    if (fromMonth && toMonth && fromMonth.localeCompare(toMonth) > 0) {
      throw new HttpsError('invalid-argument', 'fromMonth must be earlier than or equal to toMonth');
    }

    const includeArchived = data.includeArchived === true;
    const limitParents = normalizeParentPaymentBackfillLimit(
      data.limitParents,
      parentId ? 1 : 25,
      100
    );
    const limitPayments = normalizeParentPaymentBackfillLimit(data.limitPayments, 250, 1000);

    const db = admin.firestore();
    const payments = await loadParentPaymentBackfillPayments(
      db,
      parentId,
      fromMonth,
      toMonth,
      limitPayments
    );

    const inferredParentIds = Array.from(
      new Set(
        [parentId, ...payments.map((payment) => String(payment.data.parentId || '').trim())].filter(
          (value): value is string => Boolean(value)
        )
      )
    )
      .sort((left, right) => left.localeCompare(right))
      .slice(0, limitParents);

    const parentScopedData = await loadParentPaymentBackfillParentScopedData(
      db,
      inferredParentIds
    );
    const filteredPayments = payments.filter((payment) =>
      inferredParentIds.includes(String(payment.data.parentId || '').trim())
    );

    const report = buildParentPaymentBackfillDryRunReport({
      mode: 'dry_run',
      parentId,
      fromMonth,
      toMonth,
      includeArchived,
      payments: filteredPayments,
      charges: parentScopedData.charges,
      wallets: parentScopedData.wallets,
      walletTransactions: parentScopedData.walletTransactions,
      monthlyReadModels: parentScopedData.monthlyReadModels,
      parentProfiles: parentScopedData.parentProfiles,
    });

    return {
      ok: true,
      callable: 'auditParentPaymentBackfillDryRun',
      ...report,
      reportHash: createParentPaymentBackfillReportHash(report),
      dataRead: {
        payments: filteredPayments.length,
        paymentAllocationSubdocs: filteredPayments.reduce(
          (sum, payment) => sum + (payment.allocationDocs?.length || 0),
          0
        ),
        charges: parentScopedData.charges.length,
        wallets: parentScopedData.wallets.length,
        walletTransactions: parentScopedData.walletTransactions.length,
        monthlyReadModels: parentScopedData.monthlyReadModels.length,
        parentProfiles: parentScopedData.parentProfiles.length,
      },
      limitsApplied: {
        limitParents,
        limitPayments,
      },
      writeSafety: {
        wrotePayments: false,
        wroteBillingCharges: false,
        wroteParentWallets: false,
        wroteWalletTransactions: false,
        wroteParentMonthlyReadModels: false,
        wroteInvoices: false,
      },
    };
  }
);
