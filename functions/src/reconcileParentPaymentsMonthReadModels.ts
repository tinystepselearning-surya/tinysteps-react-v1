import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  buildParentMonthlyBillingReadModel,
  type ParentMonthlyBillingChargeInput,
  type ParentMonthlyBillingReadModelOutput,
} from './parentMonthlyBillingReadModel';
import { recomputeParentMonthBillingReadModel } from './parentMonthlyReadModels';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const EPSILON = 0.01;
const DEFAULT_MAX_PARENTS = 500;
const HARD_MAX_PARENTS = 1500;
const REBUILD_BATCH_SIZE = 20;

type RequestData = {
  monthKey?: string;
  dryRun?: boolean;
  maxParents?: number;
};

type ExistingReadModel = {
  parentId: string;
  monthKey?: string;
  billedAmount?: unknown;
  billedClassCount?: unknown;
  settledAmount?: unknown;
  dueAmount?: unknown;
  status?: unknown;
};

type AuditMismatch = {
  parentId: string;
  reason: 'missing_read_model' | 'totals_mismatch' | 'stale_read_model';
  expected: {
    billedAmount: number;
    settledAmount: number;
    dueAmount: number;
    billedClassCount: number;
    status: string;
  };
  actual: {
    billedAmount: number;
    settledAmount: number;
    dueAmount: number;
    billedClassCount: number;
    status: string;
  } | null;
};

function normalizeMonthKey(value: unknown): string | null {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : null;
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function normalizeParentId(value: unknown): string {
  return String(value || '').trim();
}

function normalizeMaxParents(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_PARENTS;
  return Math.max(1, Math.min(HARD_MAX_PARENTS, Math.floor(parsed)));
}

function modelSnapshot(model: ParentMonthlyBillingReadModelOutput) {
  return {
    billedAmount: roundCurrency(model.billedAmount),
    settledAmount: roundCurrency(model.settledAmount),
    dueAmount: roundCurrency(model.dueAmount),
    billedClassCount: Math.max(0, Math.round(model.billedClassCount)),
    status: String(model.status || '').trim().toLowerCase(),
  };
}

function existingSnapshot(model: ExistingReadModel | null) {
  if (!model) return null;
  return {
    billedAmount: roundCurrency(normalizeNumber(model.billedAmount)),
    settledAmount: roundCurrency(normalizeNumber(model.settledAmount)),
    dueAmount: roundCurrency(normalizeNumber(model.dueAmount)),
    billedClassCount: Math.max(0, Math.round(normalizeNumber(model.billedClassCount))),
    status: String(model.status || '').trim().toLowerCase(),
  };
}

function differs(left: ReturnType<typeof modelSnapshot>, right: ReturnType<typeof existingSnapshot>): boolean {
  if (!right) return true;
  return (
    Math.abs(left.billedAmount - right.billedAmount) > EPSILON ||
    Math.abs(left.settledAmount - right.settledAmount) > EPSILON ||
    Math.abs(left.dueAmount - right.dueAmount) > EPSILON ||
    left.billedClassCount !== right.billedClassCount ||
    left.status !== right.status
  );
}

function isParentMonthlyReadModelPath(path: string): boolean {
  const parts = String(path || '').split('/').filter(Boolean);
  return parts.length === 4 && parts[0] === 'parentMonthlyReadModels' && parts[2] === 'months';
}

export function buildParentPaymentsMonthAudit(input: {
  monthKey: string;
  charges: Array<ParentMonthlyBillingChargeInput & { parentId?: unknown }>;
  existingReadModels: ExistingReadModel[];
  walletBalances?: Record<string, number | null | undefined>;
  now?: Date;
}) {
  const chargesByParent = new Map<string, Array<ParentMonthlyBillingChargeInput & { parentId?: unknown }>>();
  input.charges.forEach((charge) => {
    const parentId = normalizeParentId(charge.parentId);
    if (!parentId) return;
    const rows = chargesByParent.get(parentId) || [];
    rows.push(charge);
    chargesByParent.set(parentId, rows);
  });

  const existingByParent = new Map<string, ExistingReadModel>();
  input.existingReadModels.forEach((model) => {
    const parentId = normalizeParentId(model.parentId);
    if (!parentId) return;
    existingByParent.set(parentId, model);
  });

  const parentIds = Array.from(new Set([...chargesByParent.keys(), ...existingByParent.keys()])).sort();
  const expectedByParent = new Map<string, ParentMonthlyBillingReadModelOutput>();
  const mismatches: AuditMismatch[] = [];

  parentIds.forEach((parentId) => {
    const expected = buildParentMonthlyBillingReadModel({
      parentId,
      monthKey: input.monthKey,
      charges: chargesByParent.get(parentId) || [],
      walletBalance: input.walletBalances?.[parentId] ?? null,
      now: input.now,
    });
    expectedByParent.set(parentId, expected);

    const existing = existingByParent.get(parentId) || null;
    const expectedSnapshot = modelSnapshot(expected);
    const actualSnapshot = existingSnapshot(existing);

    if (!existing) {
      if (expected.billedAmount > EPSILON) {
        mismatches.push({
          parentId,
          reason: 'missing_read_model',
          expected: expectedSnapshot,
          actual: null,
        });
      }
      return;
    }

    if (!differs(expectedSnapshot, actualSnapshot)) return;
    mismatches.push({
      parentId,
      reason: expected.billedAmount <= EPSILON ? 'stale_read_model' : 'totals_mismatch',
      expected: expectedSnapshot,
      actual: actualSnapshot,
    });
  });

  let billedAmount = 0;
  let settledAmount = 0;
  let dueAmount = 0;
  let parentsBilled = 0;
  let paidParents = 0;
  let partialParents = 0;
  let unpaidParents = 0;

  expectedByParent.forEach((model) => {
    if (model.billedAmount <= EPSILON) return;
    parentsBilled += 1;
    billedAmount += model.billedAmount;
    settledAmount += model.settledAmount;
    dueAmount += model.dueAmount;
    if (model.dueAmount <= EPSILON) paidParents += 1;
    else if (model.settledAmount > EPSILON) partialParents += 1;
    else unpaidParents += 1;
  });

  const roundedBilled = roundCurrency(billedAmount);
  const roundedSettled = roundCurrency(settledAmount);
  const roundedDue = roundCurrency(dueAmount);

  return {
    monthKey: input.monthKey,
    parentIds,
    mismatches,
    expectedByParent,
    summary: {
      billedAmount: roundedBilled,
      settledAmount: roundedSettled,
      dueAmount: roundedDue,
      collectionRate: roundedBilled > EPSILON ? Math.round((roundedSettled / roundedBilled) * 10000) / 100 : 0,
      parentsBilled,
      paidParents,
      partialParents,
      unpaidParents,
      parentsWithDue: partialParents + unpaidParents,
      existingReadModels: existingByParent.size,
      missingReadModels: mismatches.filter((row) => row.reason === 'missing_read_model').length,
      mismatchedReadModels: mismatches.filter((row) => row.reason === 'totals_mismatch').length,
      staleReadModels: mismatches.filter((row) => row.reason === 'stale_read_model').length,
    },
  };
}

export const reconcileParentPaymentsMonthReadModels = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as RequestData;
    const monthKey = normalizeMonthKey(data.monthKey);
    if (!monthKey) {
      throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
    }
    const dryRun = data.dryRun !== false;
    const maxParents = normalizeMaxParents(data.maxParents);
    const db = admin.firestore();

    const [chargesSnap, readModelsSnap] = await Promise.all([
      db.collection('billingCharges').where('monthKey', '==', monthKey).get(),
      db.collectionGroup('months').where('monthKey', '==', monthKey).get(),
    ]);

    const charges = chargesSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...((docSnap.data() || {}) as Record<string, unknown>),
    })) as Array<ParentMonthlyBillingChargeInput & { parentId?: unknown }>;

    const existingReadModels = readModelsSnap.docs
      .filter((docSnap) => isParentMonthlyReadModelPath(docSnap.ref.path))
      .map((docSnap) => ({
        parentId: normalizeParentId(docSnap.data()?.parentId || docSnap.ref.parent.parent?.id),
        ...((docSnap.data() || {}) as Record<string, unknown>),
      })) as ExistingReadModel[];

    const candidateParentIds = Array.from(
      new Set([
        ...charges.map((row) => normalizeParentId(row.parentId)).filter(Boolean),
        ...existingReadModels.map((row) => normalizeParentId(row.parentId)).filter(Boolean),
      ]),
    ).sort();

    if (candidateParentIds.length > maxParents) {
      throw new HttpsError(
        'failed-precondition',
        `month ${monthKey} has ${candidateParentIds.length} parents; increase maxParents up to ${HARD_MAX_PARENTS}`,
      );
    }

    const walletBalances: Record<string, number | null> = {};
    for (let index = 0; index < candidateParentIds.length; index += 250) {
      const slice = candidateParentIds.slice(index, index + 250);
      if (slice.length === 0) continue;
      const refs = slice.map((parentId) => db.collection('parentWallets').doc(parentId));
      const snapshots = await db.getAll(...refs);
      snapshots.forEach((snapshot, snapshotIndex) => {
        const parentId = slice[snapshotIndex];
        if (!parentId) return;
        const balance = Number(snapshot.data()?.currentBalance);
        walletBalances[parentId] = Number.isFinite(balance) ? balance : null;
      });
    }

    const audit = buildParentPaymentsMonthAudit({
      monthKey,
      charges,
      existingReadModels,
      walletBalances,
      now: new Date(),
    });

    const mismatchedParentIds = audit.mismatches.map((row) => row.parentId);
    let rebuiltParents = 0;

    if (!dryRun && mismatchedParentIds.length > 0) {
      for (let index = 0; index < mismatchedParentIds.length; index += REBUILD_BATCH_SIZE) {
        const slice = mismatchedParentIds.slice(index, index + REBUILD_BATCH_SIZE);
        await Promise.all(
          slice.map((parentId) => recomputeParentMonthBillingReadModel(db, parentId, monthKey)),
        );
        rebuiltParents += slice.length;
      }
    }

    return {
      ok: true,
      dryRun,
      monthKey,
      summary: audit.summary,
      mismatchCount: audit.mismatches.length,
      rebuiltParents,
      mismatchSample: audit.mismatches.slice(0, 50),
      safety: {
        writesPayments: false,
        writesBillingCharges: false,
        writesWallets: false,
        writesMonthlyReadModels: !dryRun,
      },
    };
  },
);
