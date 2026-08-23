import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import {
  buildParentMonthlyBillingReadModel,
  type ParentMonthlyBillingChargeInput,
} from './parentMonthlyBillingReadModel';
import {
  collectParentMonthlyBillingTargets,
  recomputeParentMonthBillingReadModel,
} from './parentMonthlyReadModels';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const PROJECTION_SCHEMA_VERSION = 2;
const MAX_PROJECTION_CHARGES = 250;
const MAX_PROJECTION_TOMBSTONES = 500;
const EPSILON = 0.01;

const CHARGE_PROJECTION_FIELDS = [
  'parentId',
  'monthKey',
  'amount',
  'paidAmount',
  'outstandingAmount',
  'status',
  'kidId',
  'studentId',
  'paymentIds',
  'lastPaymentId',
  'lastAllocationRef',
  'paidAt',
  'lastAllocatedAt',
  'archived',
] as const;

const PAYMENT_PROJECTION_FIELDS = [
  'parentId',
  'receiptMonthKey',
  'monthKey',
  'amount',
  'paidAt',
  'status',
  'appliedAmount',
  'allocatedAmount',
  'unappliedAmount',
  'walletTopupAmount',
  'allocations',
] as const;

type ParentMonthTarget = { parentId: string; monthKey: string };
type ProjectedChargeData = Omit<ParentMonthlyBillingChargeInput, 'id'>;

type StoredProjectionCharge = {
  id: string;
  versionMs: number;
  data: ProjectedChargeData;
};

type ProjectionTombstone = {
  id: string;
  versionMs: number;
};

export type BillingProjectionState = {
  schemaVersion: number;
  charges: StoredProjectionCharge[];
  tombstones: ProjectionTombstone[];
  bootstrappedAtMs: number;
  sourceCount: number;
};

export type BillingProjectionMutation = {
  chargeId: string;
  versionMs: number;
  parentId: string;
  monthKey: string;
  afterData: Record<string, unknown> | null;
};

class ProjectionTooLargeError extends Error {
  constructor(public readonly sourceCount: number) {
    super(`Billing projection source count ${sourceCount} exceeds safe cap ${MAX_PROJECTION_CHARGES}`);
    this.name = 'ProjectionTooLargeError';
  }
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function normalizeAmount(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry));
  if (value instanceof Date) return value.toISOString();
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const parsed = (value as { toDate: () => unknown }).toDate();
    return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = stableValue((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value ?? null;
}

function signatureForFields(
  data: Record<string, unknown> | null,
  fields: readonly string[],
): string {
  if (!data) return 'null';
  const selected: Record<string, unknown> = {};
  fields.forEach((field) => {
    selected[field] = stableValue(data[field]);
  });
  return JSON.stringify(selected);
}

export function billingChargeProjectionSignature(data: Record<string, unknown> | null): string {
  return signatureForFields(data, CHARGE_PROJECTION_FIELDS);
}

export function paymentProjectionSignature(data: Record<string, unknown> | null): string {
  return signatureForFields(data, PAYMENT_PROJECTION_FIELDS);
}

export function shouldRefreshBillingChargeProjection(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  if (!beforeData || !afterData) return true;
  return billingChargeProjectionSignature(beforeData) !== billingChargeProjectionSignature(afterData);
}

export function shouldRefreshPaymentProjection(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): boolean {
  if (!beforeData || !afterData) return true;
  return paymentProjectionSignature(beforeData) !== paymentProjectionSignature(afterData);
}

function pickChargeProjectionData(data: Record<string, unknown>): ProjectedChargeData {
  const selected: Record<string, unknown> = {};
  CHARGE_PROJECTION_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) selected[field] = data[field];
  });
  return selected as ProjectedChargeData;
}

function belongsToTarget(
  data: Record<string, unknown> | null,
  parentId: string,
  monthKey: string,
): boolean {
  if (!data) return false;
  return normalizeText(data.parentId) === parentId && normalizeText(data.monthKey) === monthKey;
}

function latestVersionForCharge(state: BillingProjectionState, chargeId: string): number {
  const storedCharge = state.charges.find((entry) => entry.id === chargeId);
  const tombstone = state.tombstones.find((entry) => entry.id === chargeId);
  return Math.max(storedCharge?.versionMs || 0, tombstone?.versionMs || 0);
}

export function applyBillingProjectionMutation(
  state: BillingProjectionState,
  mutation: BillingProjectionMutation,
): BillingProjectionState {
  const incomingVersion = Number.isFinite(mutation.versionMs) ? mutation.versionMs : 0;
  if (incomingVersion <= latestVersionForCharge(state, mutation.chargeId)) return state;

  const charges = state.charges.filter((entry) => entry.id !== mutation.chargeId);
  let tombstones = state.tombstones.filter((entry) => entry.id !== mutation.chargeId);

  if (belongsToTarget(mutation.afterData, mutation.parentId, mutation.monthKey)) {
    charges.push({
      id: mutation.chargeId,
      versionMs: incomingVersion,
      data: pickChargeProjectionData(mutation.afterData || {}),
    });
  } else {
    tombstones.push({ id: mutation.chargeId, versionMs: incomingVersion });
  }

  if (charges.length > MAX_PROJECTION_CHARGES) {
    throw new ProjectionTooLargeError(charges.length);
  }

  charges.sort((left, right) => left.id.localeCompare(right.id));
  tombstones = tombstones
    .sort((left, right) => right.versionMs - left.versionMs || left.id.localeCompare(right.id))
    .slice(0, MAX_PROJECTION_TOMBSTONES)
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    ...state,
    charges,
    tombstones,
    sourceCount: charges.length,
  };
}

export function buildBillingProjectionState(
  rows: Array<{ id: string; versionMs: number; data: Record<string, unknown> }>,
  nowMs = Date.now(),
): BillingProjectionState {
  if (rows.length > MAX_PROJECTION_CHARGES) {
    throw new ProjectionTooLargeError(rows.length);
  }
  return {
    schemaVersion: PROJECTION_SCHEMA_VERSION,
    charges: rows
      .map((row) => ({
        id: row.id,
        versionMs: Number.isFinite(row.versionMs) ? row.versionMs : 0,
        data: pickChargeProjectionData(row.data),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    tombstones: [],
    bootstrappedAtMs: nowMs,
    sourceCount: rows.length,
  };
}

function parseProjectionState(raw: unknown): BillingProjectionState | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  if (Number(data.schemaVersion) !== PROJECTION_SCHEMA_VERSION) return null;
  if (!Array.isArray(data.charges) || !Array.isArray(data.tombstones)) return null;
  if (data.charges.length > MAX_PROJECTION_CHARGES) return null;

  const charges: StoredProjectionCharge[] = data.charges
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map((entry) => ({
      id: normalizeText(entry.id),
      versionMs: normalizeAmount(entry.versionMs),
      data: ((entry.data && typeof entry.data === 'object' ? entry.data : {}) as ProjectedChargeData),
    }))
    .filter((entry) => Boolean(entry.id));
  const tombstones: ProjectionTombstone[] = data.tombstones
    .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
    .map((entry) => ({ id: normalizeText(entry.id), versionMs: normalizeAmount(entry.versionMs) }))
    .filter((entry) => Boolean(entry.id));

  return {
    schemaVersion: PROJECTION_SCHEMA_VERSION,
    charges,
    tombstones,
    bootstrappedAtMs: normalizeAmount(data.bootstrappedAtMs),
    sourceCount: normalizeAmount(data.sourceCount) || charges.length,
  };
}

function sortedStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => normalizeText(entry)).filter(Boolean).sort((a, b) => a.localeCompare(b))
    : [];
}

function projectionMatchesPersistedModel(
  state: BillingProjectionState,
  parentId: string,
  monthKey: string,
  persisted: Record<string, unknown>,
): boolean {
  const projected = buildParentMonthlyBillingReadModel({
    parentId,
    monthKey,
    walletBalance: null,
    charges: state.charges.map((entry) => ({ id: entry.id, ...entry.data })),
  });
  const amountMatches = (left: unknown, right: number) =>
    Math.abs(normalizeAmount(left) - right) <= EPSILON;

  return (
    amountMatches(persisted.billedAmount, projected.billedAmount) &&
    amountMatches(persisted.settledAmount, projected.settledAmount) &&
    amountMatches(persisted.dueAmount, projected.dueAmount) &&
    normalizeAmount(persisted.billedClassCount) === projected.billedClassCount &&
    JSON.stringify(sortedStrings(persisted.chargeIds)) === JSON.stringify([...projected.chargeIds].sort())
  );
}

function parentNameSortFromUser(parentId: string, data: Record<string, unknown> | null): string {
  return (
    normalizeText(data?.displayName || data?.name || data?.email || parentId).toLocaleLowerCase('en') ||
    parentId.toLocaleLowerCase('en')
  );
}

function snapshotVersionMs(snapshot: admin.firestore.DocumentSnapshot | undefined, fallbackTime: unknown): number {
  const updateTime = (snapshot as unknown as { updateTime?: admin.firestore.Timestamp })?.updateTime;
  if (updateTime && typeof updateTime.toMillis === 'function') return updateTime.toMillis();
  const fallbackMs = Date.parse(String(fallbackTime || ''));
  return Number.isFinite(fallbackMs) ? fallbackMs : Date.now();
}

async function bootstrapProjection(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  target: ParentMonthTarget,
): Promise<BillingProjectionState> {
  const sourceQuery = db
    .collection('billingCharges')
    .where('parentId', '==', target.parentId)
    .where('monthKey', '==', target.monthKey)
    .limit(MAX_PROJECTION_CHARGES + 1);
  const sourceSnap = await tx.get(sourceQuery);
  if (sourceSnap.size > MAX_PROJECTION_CHARGES) {
    throw new ProjectionTooLargeError(sourceSnap.size);
  }

  return buildBillingProjectionState(
    sourceSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      versionMs: snapshotVersionMs(docSnap, null),
      data: (docSnap.data() || {}) as Record<string, unknown>,
    })),
  );
}

function buildProjectionPatch(
  target: ParentMonthTarget,
  parentNameSort: string,
  state: BillingProjectionState,
  walletBalance: number | null,
): Record<string, unknown> {
  const billingModel = buildParentMonthlyBillingReadModel({
    parentId: target.parentId,
    monthKey: target.monthKey,
    walletBalance,
    charges: state.charges.map((entry) => ({ id: entry.id, ...entry.data })),
  });

  return {
    parentId: target.parentId,
    parentNameSort,
    monthKey: target.monthKey,
    schemaVersion: billingModel.schemaVersion,
    modelType: billingModel.modelType,
    allocationAware: billingModel.allocationAware,
    computedFrom: 'billingCharges_projection_v2',
    refreshedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    generatedAtMs: billingModel.generatedAtMs,
    billedAmount: billingModel.billedAmount,
    billedClassCount: billingModel.billedClassCount,
    settledAmount: billingModel.settledAmount,
    appliedAmount: billingModel.appliedAmount,
    outstandingAmount: billingModel.outstandingAmount,
    dueAmount: billingModel.dueAmount,
    status: billingModel.status,
    lastSettlementAtMs: billingModel.lastSettlementAtMs,
    lastPaymentAtMs: billingModel.lastPaymentAtMs,
    lastPaymentId: billingModel.lastPaymentId,
    allocationRefs: billingModel.allocationRefs,
    chargeIds: billingModel.chargeIds,
    totals: billingModel.totals,
    byKid: billingModel.byKid,
  };
}

async function refreshProjectionTarget(
  db: admin.firestore.Firestore,
  target: ParentMonthTarget,
  mutation: BillingProjectionMutation | null,
  source: string,
): Promise<void> {
  const modelRef = db
    .collection('parentMonthlyReadModels')
    .doc(target.parentId)
    .collection('months')
    .doc(target.monthKey);
  const projectionRef = db
    .collection('internalBillingProjections')
    .doc(target.parentId)
    .collection('billingMonths')
    .doc(target.monthKey);

  try {
    await db.runTransaction(async (tx) => {
      const modelSnap = await tx.get(modelRef);
      const projectionSnap = await tx.get(projectionRef);
      const persisted = (modelSnap.data() || {}) as Record<string, unknown>;
      let state = parseProjectionState(projectionSnap.data());

      if (!state || !projectionMatchesPersistedModel(state, target.parentId, target.monthKey, persisted)) {
        state = await bootstrapProjection(tx, db, target);
      }

      if (mutation) state = applyBillingProjectionMutation(state, mutation);

      const provisional = buildParentMonthlyBillingReadModel({
        parentId: target.parentId,
        monthKey: target.monthKey,
        walletBalance: null,
        charges: state.charges.map((entry) => ({ id: entry.id, ...entry.data })),
      });

      let walletBalance: number | null = null;
      if (provisional.dueAmount <= EPSILON) {
        const walletSnap = await tx.get(db.collection('parentWallets').doc(target.parentId));
        const parsed = Number((walletSnap.data() || {}).currentBalance);
        walletBalance = Number.isFinite(parsed) ? parsed : 0;
      }

      let parentNameSort = normalizeText(persisted.parentNameSort);
      if (!parentNameSort) {
        const parentSnap = await tx.get(db.collection('users').doc(target.parentId));
        parentNameSort = parentNameSortFromUser(
          target.parentId,
          (parentSnap.data() || {}) as Record<string, unknown>,
        );
      }

      tx.set(
        modelRef,
        buildProjectionPatch(target, parentNameSort, state, walletBalance),
        { merge: true },
      );
      tx.set(
        projectionRef,
        {
          ...state,
          parentId: target.parentId,
          monthKey: target.monthKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: false },
      );
    });

    logger.debug('Refreshed incremental parent monthly billing projection', {
      source,
      parentId: target.parentId,
      monthKey: target.monthKey,
      mutation: Boolean(mutation),
    });
  } catch (error) {
    if (error instanceof ProjectionTooLargeError) {
      logger.warn('Billing projection exceeded safe charge cap; using legacy authoritative recompute', {
        source,
        parentId: target.parentId,
        monthKey: target.monthKey,
        sourceCount: error.sourceCount,
        cap: MAX_PROJECTION_CHARGES,
      });
      await recomputeParentMonthBillingReadModel(db, target.parentId, target.monthKey);
      return;
    }
    throw error;
  }
}

export const onBillingChargeReadModelWrite = onDocumentWritten(
  {
    document: 'billingCharges/{chargeId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    const chargeId = normalizeText(event.params.chargeId);
    if (!change || !chargeId) return;

    const beforeData = change.before.exists
      ? ((change.before.data() || {}) as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? ((change.after.data() || {}) as Record<string, unknown>)
      : null;

    if (!shouldRefreshBillingChargeProjection(beforeData, afterData)) {
      logger.debug('Skipped billing projection for metadata-only charge write', { chargeId });
      return;
    }

    const beforeParentId = normalizeText(beforeData?.parentId);
    const beforeMonthKey = normalizeText(beforeData?.monthKey);
    const afterParentId = normalizeText(afterData?.parentId);
    const afterMonthKey = normalizeText(afterData?.monthKey);
    const targets = new Map<string, ParentMonthTarget>();
    if (beforeParentId && /^\d{4}-\d{2}$/.test(beforeMonthKey)) {
      targets.set(`${beforeParentId}__${beforeMonthKey}`, { parentId: beforeParentId, monthKey: beforeMonthKey });
    }
    if (afterParentId && /^\d{4}-\d{2}$/.test(afterMonthKey)) {
      targets.set(`${afterParentId}__${afterMonthKey}`, { parentId: afterParentId, monthKey: afterMonthKey });
    }
    if (targets.size === 0) return;

    const versionMs = change.after.exists
      ? snapshotVersionMs(change.after, event.time)
      : Math.max(snapshotVersionMs(change.before, null) + 1, snapshotVersionMs(undefined, event.time));
    const db = admin.firestore();

    for (const target of targets.values()) {
      await refreshProjectionTarget(
        db,
        target,
        {
          chargeId,
          versionMs,
          parentId: target.parentId,
          monthKey: target.monthKey,
          afterData,
        },
        'billingCharges',
      );
    }
  },
);

export const onPaymentReadModelWrite = onDocumentWritten(
  {
    document: 'payments/{paymentId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const beforeData = change.before.exists
      ? ((change.before.data() || {}) as Record<string, unknown>)
      : null;
    const afterData = change.after.exists
      ? ((change.after.data() || {}) as Record<string, unknown>)
      : null;

    if (!shouldRefreshPaymentProjection(beforeData, afterData)) {
      logger.debug('Skipped billing projection for metadata-only payment write', {
        paymentId: normalizeText(event.params.paymentId),
      });
      return;
    }

    const targets = collectParentMonthlyBillingTargets(beforeData, afterData);
    if (targets.length === 0) return;
    const db = admin.firestore();
    for (const target of targets) {
      await refreshProjectionTarget(db, target, null, 'payments');
    }
  },
);
