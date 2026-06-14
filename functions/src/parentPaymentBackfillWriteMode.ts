import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { ensureAdmin } from './helpers/adminGuard';
import {
  loadParentPaymentBackfillParentScopedData,
  loadParentPaymentBackfillPayments,
  normalizeParentPaymentBackfillLimit,
  normalizeParentPaymentBackfillOptionalText,
} from './parentPaymentBackfillDryRun';
import { createParentPaymentBackfillReportHash } from './parentPaymentBackfillHash';
import {
  buildParentPaymentBackfillWritePlan,
  normalizeParentPaymentBackfillChargeSourceState,
  normalizeParentPaymentBackfillPaymentSourceState,
  type ParentPaymentBackfillAllocationDocPlan,
  type ParentPaymentBackfillChargePatchPlan,
  type ParentPaymentBackfillPaymentPatchPlan,
  validateParentPaymentBackfillParentIds,
} from './parentPaymentBackfillWrite';
import { recomputeParentMonthBillingReadModel } from './parentMonthlyReadModels';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const CONFIRMATION_TEXT = 'APPLY_SAFE_PARENT_PAYMENT_BACKFILL';

type ApplyParentPaymentBackfillForSafeParentsRequest = {
  mode?: 'write';
  parentIds?: string[];
  confirmationText?: string;
  dryRunReportHash?: string;
  maxParents?: number;
  maxPaymentsPerParent?: number;
  includeArchived?: boolean;
  allowWalletDrift?: boolean;
  allowAnomalies?: boolean;
};

function toTimestampOrNull(value: string | null): admin.firestore.Timestamp | null {
  if (!value) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : admin.firestore.Timestamp.fromDate(parsed);
}

function summarizeReport(report: ReturnType<typeof buildParentPaymentBackfillWritePlan>['beforeReport']) {
  return {
    totals: report.totals,
    parents: report.parents.map((parent) => ({
      parentId: parent.summary.parentId,
      recommendedAction: parent.summary.recommendedAction,
      walletDrift: parent.summary.walletDrift,
      anomalyCount: parent.summary.anomalyCount,
      totalWouldAllocate: parent.summary.totalWouldAllocate,
      monthsImpacted: parent.summary.monthsImpacted,
    })),
  };
}

function buildPaymentWritePayload(paymentPatch: ParentPaymentBackfillPaymentPatchPlan) {
  return {
    ...paymentPatch.data,
    allocationBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function buildAllocationWritePayload(allocationPatch: ParentPaymentBackfillAllocationDocPlan) {
  return {
    ...allocationPatch.data,
    paidAt: toTimestampOrNull(allocationPatch.paidAtIso),
    allocatedAt: admin.firestore.FieldValue.serverTimestamp(),
    backfilledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

function buildChargeWritePayload(chargePatch: ParentPaymentBackfillChargePatchPlan) {
  const payload: Record<string, unknown> = {
    ...chargePatch.data,
    lastAllocatedAt: toTimestampOrNull(chargePatch.lastAllocatedAtIso),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    allocationBackfilledAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (chargePatch.clearPaidAt) {
    payload.paidAt = admin.firestore.FieldValue.delete();
  } else {
    payload.paidAt = toTimestampOrNull(chargePatch.paidAtIso);
  }
  return payload;
}

function matchesSourceVerification(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function verifyPaymentPatchSourceState(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  paymentPatch: ParentPaymentBackfillPaymentPatchPlan
): Promise<void> {
  const paymentRef = db.collection('payments').doc(paymentPatch.paymentId);
  const paymentSnap = await tx.get(paymentRef);
  if (!paymentSnap.exists) {
    throw new Error(`payment ${paymentPatch.paymentId} is missing at write time`);
  }
  const currentState = normalizeParentPaymentBackfillPaymentSourceState(
    (paymentSnap.data() || {}) as Record<string, unknown>
  );
  if (!matchesSourceVerification(currentState, paymentPatch.sourceVerification)) {
    throw new Error(`payment ${paymentPatch.paymentId} changed after dry-run verification`);
  }

  for (const allocationDocId of paymentPatch.allocationDocIds) {
    const allocationRef = paymentRef.collection('allocations').doc(allocationDocId);
    const allocationSnap = await tx.get(allocationRef);
    if (allocationSnap.exists) {
      throw new Error(
        `payment ${paymentPatch.paymentId} already has allocation doc ${allocationDocId}`
      );
    }
  }
}

async function verifyChargePatchSourceState(
  tx: admin.firestore.Transaction,
  db: admin.firestore.Firestore,
  chargePatch: ParentPaymentBackfillChargePatchPlan
): Promise<void> {
  const chargeRef = db.collection('billingCharges').doc(chargePatch.chargeId);
  const chargeSnap = await tx.get(chargeRef);
  if (!chargeSnap.exists) {
    throw new Error(`billing charge ${chargePatch.chargeId} is missing at write time`);
  }
  const currentState = normalizeParentPaymentBackfillChargeSourceState(
    (chargeSnap.data() || {}) as Record<string, unknown>
  );
  if (!matchesSourceVerification(currentState, chargePatch.sourceVerification)) {
    throw new Error(`billing charge ${chargePatch.chargeId} changed after dry-run verification`);
  }
}

export const applyParentPaymentBackfillForSafeParents = onCall(
  {
    region: REGION,
    memory: '512MiB',
    timeoutSeconds: 180,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const data = (request.data || {}) as ApplyParentPaymentBackfillForSafeParentsRequest;
    if (data.mode !== 'write') {
      throw new HttpsError('invalid-argument', 'mode must be exactly "write"');
    }
    if (data.confirmationText !== CONFIRMATION_TEXT) {
      throw new HttpsError(
        'failed-precondition',
        `confirmationText must be exactly: ${CONFIRMATION_TEXT}`
      );
    }
    if (data.includeArchived === true) {
      throw new HttpsError('failed-precondition', 'includeArchived must remain false in write mode');
    }
    if (data.allowWalletDrift === true) {
      throw new HttpsError('failed-precondition', 'allowWalletDrift is not allowed in this phase');
    }
    if (data.allowAnomalies === true) {
      throw new HttpsError('failed-precondition', 'allowAnomalies is not allowed in this phase');
    }

    let parentIds: string[] = [];
    try {
      parentIds = validateParentPaymentBackfillParentIds(
        Array.isArray(data.parentIds)
          ? data.parentIds.map((value) => normalizeParentPaymentBackfillOptionalText(value, 150))
          : []
      );
    } catch (error) {
      throw new HttpsError(
        'invalid-argument',
        error instanceof Error ? error.message : 'parentIds is invalid'
      );
    }
    if (parentIds.length === 0) {
      throw new HttpsError('invalid-argument', 'parentIds is required');
    }

    const maxParents = normalizeParentPaymentBackfillLimit(data.maxParents, 5, 20);
    const maxPaymentsPerParent = normalizeParentPaymentBackfillLimit(
      data.maxPaymentsPerParent,
      50,
      200
    );
    if (parentIds.length > maxParents) {
      throw new HttpsError(
        'failed-precondition',
        `selected parentIds exceed maxParents (${parentIds.length} > ${maxParents})`
      );
    }

    const db = admin.firestore();
    const payments = (
      await Promise.all(
        parentIds.map((parentId) =>
          loadParentPaymentBackfillPayments(db, parentId, null, null, maxPaymentsPerParent)
        )
      )
    ).flat();
    const parentScopedData = await loadParentPaymentBackfillParentScopedData(db, parentIds);

    const plan = buildParentPaymentBackfillWritePlan({
      mode: 'write',
      parentIds,
      includeArchived: false,
      maxParents,
      maxPaymentsPerParent,
      allowWalletDrift: false,
      allowAnomalies: false,
      payments,
      charges: parentScopedData.charges,
      wallets: parentScopedData.wallets,
      walletTransactions: parentScopedData.walletTransactions,
      monthlyReadModels: parentScopedData.monthlyReadModels,
      parentProfiles: parentScopedData.parentProfiles,
    });

    const reportHashBefore = createParentPaymentBackfillReportHash(plan.beforeReport);
    if (data.dryRunReportHash && data.dryRunReportHash !== reportHashBefore) {
      throw new HttpsError(
        'failed-precondition',
        'dryRunReportHash does not match the freshly recomputed dry-run report'
      );
    }

    const requestedBy =
      request.auth?.uid ||
      normalizeParentPaymentBackfillOptionalText(request.auth?.token?.email, 200) ||
      'unknown';

    const runRef = db.collection('parentPaymentBackfillRuns').doc(plan.runId);
    const parentRunRefs = new Map(
      parentIds.map((parentId) => [
        parentId,
        runRef.collection('parents').doc(parentId),
      ])
    );

    await runRef.set(
      {
        runId: plan.runId,
        mode: 'write',
        requestedBy,
        status: 'running',
        parentIds,
        writeSafety: {
          changesWalletBalances: false,
          createsWalletTransactions: false,
        },
        dryRunReportHashBefore: reportHashBefore,
        dryRunSummaryBefore: summarizeReport(plan.beforeReport),
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedAt: null,
        errors: [],
      },
      { merge: true }
    );

    let completedParents = 0;
    const parentResults: Array<Record<string, unknown>> = [];
    let failedParentId: string | null = null;

    try {
      for (const parentPlan of plan.parentPlans) {
        const parentRunRef = parentRunRefs.get(parentPlan.parentId)!;
        if (parentPlan.status === 'skip') {
          await parentRunRef.set(
            {
              parentId: parentPlan.parentId,
              recommendedActionBefore: parentPlan.recommendedActionBefore,
              writesPlanned: 0,
              writesApplied: 0,
              monthsImpacted: [],
              paymentsBackfilled: [],
              chargesUpdated: 0,
              readModelsRebuilt: 0,
              status: 'skipped',
              errors: [],
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          parentResults.push({
            parentId: parentPlan.parentId,
            status: 'skipped',
            writesApplied: 0,
            paymentsBackfilled: 0,
            chargesUpdated: 0,
            readModelsRebuilt: 0,
          });
          completedParents += 1;
          continue;
        }
        try {
          await parentRunRef.set(
            {
              parentId: parentPlan.parentId,
              recommendedActionBefore: parentPlan.recommendedActionBefore,
              writesPlanned: parentPlan.writeCountEstimate,
              writesApplied: 0,
              monthsImpacted: parentPlan.monthsImpacted,
              paymentsBackfilled: parentPlan.paymentsBackfilled,
              chargesUpdated: parentPlan.chargePatches.length,
              readModelsRebuilt: 0,
              status: 'running',
              errors: [],
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          await db.runTransaction(async (tx) => {
            for (const paymentPatch of parentPlan.paymentPatches) {
              await verifyPaymentPatchSourceState(tx, db, paymentPatch);
            }
            for (const chargePatch of parentPlan.chargePatches) {
              await verifyChargePatchSourceState(tx, db, chargePatch);
            }

            parentPlan.paymentPatches.forEach((paymentPatch) => {
              const paymentRef = db.collection('payments').doc(paymentPatch.paymentId);
              tx.set(paymentRef, buildPaymentWritePayload(paymentPatch), { merge: true });
            });

            parentPlan.allocationDocPatches.forEach((allocationPatch) => {
              const allocationRef = db
                .collection('payments')
                .doc(allocationPatch.paymentId)
                .collection('allocations')
                .doc(allocationPatch.allocationDocId);
              tx.set(allocationRef, buildAllocationWritePayload(allocationPatch), { merge: true });
            });

            parentPlan.chargePatches.forEach((chargePatch) => {
              const chargeRef = db.collection('billingCharges').doc(chargePatch.chargeId);
              tx.set(chargeRef, buildChargeWritePayload(chargePatch), { merge: true });
            });
          });

          for (const monthKey of parentPlan.monthsImpacted) {
            await recomputeParentMonthBillingReadModel(db, parentPlan.parentId, monthKey);
          }

          await parentRunRef.set(
            {
              status: 'completed',
              writesApplied:
                parentPlan.paymentPatches.length +
                parentPlan.allocationDocPatches.length +
                parentPlan.chargePatches.length +
                parentPlan.monthsImpacted.length,
              readModelsRebuilt: parentPlan.monthsImpacted.length,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          parentResults.push({
            parentId: parentPlan.parentId,
            status: 'completed',
            writesApplied:
              parentPlan.paymentPatches.length +
              parentPlan.allocationDocPatches.length +
              parentPlan.chargePatches.length +
              parentPlan.monthsImpacted.length,
            paymentsBackfilled: parentPlan.paymentPatches.length,
            chargesUpdated: parentPlan.chargePatches.length,
            readModelsRebuilt: parentPlan.monthsImpacted.length,
          });
          completedParents += 1;
        } catch (error) {
          failedParentId = parentPlan.parentId;
          const message = error instanceof Error ? error.message : String(error);
          await parentRunRef.set(
            {
              status: 'failed',
              errors: [message],
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          throw new Error(`parent ${parentPlan.parentId}: ${message}`);
        }
      }

      const afterPayments = (
        await Promise.all(
          parentIds.map((parentId) =>
            loadParentPaymentBackfillPayments(db, parentId, null, null, maxPaymentsPerParent)
          )
        )
      ).flat();
      const afterParentScopedData = await loadParentPaymentBackfillParentScopedData(db, parentIds);
      const verificationPlan = buildParentPaymentBackfillWritePlan({
        mode: 'write',
        parentIds,
        includeArchived: false,
        maxParents,
        maxPaymentsPerParent,
        allowWalletDrift: false,
        allowAnomalies: false,
        payments: afterPayments,
        charges: afterParentScopedData.charges,
        wallets: afterParentScopedData.wallets,
        walletTransactions: afterParentScopedData.walletTransactions,
        monthlyReadModels: afterParentScopedData.monthlyReadModels,
        parentProfiles: afterParentScopedData.parentProfiles,
        runId: plan.runId,
      });

      const reportHashAfter = createParentPaymentBackfillReportHash(verificationPlan.beforeReport);

      await runRef.set(
        {
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          totals: {
            parentsRequested: parentIds.length,
            parentsCompleted: completedParents,
            paymentsBackfilled: parentResults.reduce(
              (sum, row) => sum + Number(row.paymentsBackfilled || 0),
              0
            ),
            chargesUpdated: parentResults.reduce(
              (sum, row) => sum + Number(row.chargesUpdated || 0),
              0
            ),
            readModelsRebuilt: parentResults.reduce(
              (sum, row) => sum + Number(row.readModelsRebuilt || 0),
              0
            ),
          },
          dryRunReportHashAfter: reportHashAfter,
          dryRunSummaryAfter: summarizeReport(verificationPlan.beforeReport),
          errors: [],
        },
        { merge: true }
      );

      return {
        ok: true,
        callable: 'applyParentPaymentBackfillForSafeParents',
        runId: plan.runId,
        writeSafety: {
          changedWalletBalances: false,
          createdWalletTransactions: false,
        },
        reportHashBefore,
        reportHashAfter,
        before: summarizeReport(plan.beforeReport),
        after: summarizeReport(verificationPlan.beforeReport),
        parentResults,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await runRef.set(
        {
          status: completedParents > 0 ? 'partial' : 'failed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          failedParentId,
          errors: [message],
        },
        { merge: true }
      );
      throw new HttpsError(
        completedParents > 0 ? 'aborted' : 'failed-precondition',
        `parent payment backfill write-mode failed: ${message}`
      );
    }
  }
);
