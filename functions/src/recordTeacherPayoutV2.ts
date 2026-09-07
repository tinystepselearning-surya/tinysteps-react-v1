import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeFinancialStatus } from './helpers/status';
import { resolveTeacherEarningNetEntitlementAmount } from './helpers/teacherEarningsAuthoritativeRollup';
import {
  planTeacherPaymentCarry,
  resolveTeacherEarningHistoricalCashAmount,
  resolveTeacherEarningSettlement,
  TEACHER_PAYMENT_OFFSET_LEDGER_VERSION,
  TEACHER_PAYMENT_OFFSET_RECORD_TYPE,
  TEACHER_PAYMENT_OFFSET_SOURCE,
  TEACHER_PAYMENT_OFFSET_TYPE,
} from './helpers/teacherPaymentOffsetLedger';
import {
  buildTeacherPayoutPeriod,
  parseTeacherPayoutPaidAt,
  resolvePayoutEarningMonthKey,
  TEACHER_PAYOUT_PERIOD_SEMANTICS,
  TEACHER_PAYOUT_SCHEMA_VERSION,
} from './helpers/teacherPayoutPeriod';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const MAX_TEACHER_LEDGER_ROWS = 500;

function clean(value: unknown, maxLen = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function money(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePaymentMethod(value: unknown): 'UPI' | 'bank_transfer' | 'online' {
  const raw = clean(value, 80).toLowerCase();
  if (raw === 'upi') return 'UPI';
  if (raw === 'bank_transfer' || raw === 'bank' || raw === 'transfer') return 'bank_transfer';
  if (raw === 'online') return 'online';
  throw new HttpsError('invalid-argument', 'Invalid payment method');
}

function normalizeIdempotencyKey(value: unknown): string {
  const raw = clean(value, 160);
  return raw ? raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120) : '';
}

function status(value: unknown): string {
  return normalizeFinancialStatus(value);
}

function earningSortMs(row: Record<string, unknown>): number {
  const values = [row.earnedAt, row.createdAt, row.updatedAt];
  for (const value of values) {
    if (!value) continue;
    if (value && typeof value === 'object' && 'toDate' in value) {
      const candidate = value as { toDate?: () => Date };
      if (typeof candidate.toDate === 'function') {
        const parsed = candidate.toDate().getTime();
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    const parsed = new Date(String(value)).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * Brick 5 payout path.
 *
 * earningMonthKey identifies the service/earning period being settled.
 * paidAt is the real cash-transfer date. paymentMonthKey is derived from paidAt.
 * Legacy monthKey remains an alias of earningMonthKey so existing monthly read models continue
 * to group payouts with the earnings they settle instead of silently moving them to cash month.
 */
export const recordTeacherPayoutV2 = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const teacherId = clean(request.data?.teacherId, 160);
    if (!teacherId) throw new HttpsError('invalid-argument', 'teacherId is required');

    const amount = Number(request.data?.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new HttpsError('invalid-argument', 'amount must be a non-zero number');
    }

    const period = buildTeacherPayoutPeriod({
      earningMonthKey: request.data?.earningMonthKey,
      paidAt: request.data?.paidAt,
    });
    if (!period) {
      throw new HttpsError(
        'invalid-argument',
        'earningMonthKey (YYYY-MM) and a valid actual paidAt date are required',
      );
    }

    const paidAtDate = parseTeacherPayoutPaidAt(request.data?.paidAt);
    if (!paidAtDate) {
      throw new HttpsError('invalid-argument', 'paidAt must be a valid actual payment date');
    }
    const paidAt = Timestamp.fromDate(paidAtDate);
    const method = normalizePaymentMethod(request.data?.method);
    const note = clean(request.data?.note, 1000);
    const idempotencyKey = normalizeIdempotencyKey(request.data?.idempotencyKey);
    if (!idempotencyKey) {
      throw new HttpsError('invalid-argument', 'idempotencyKey is required');
    }

    const db = admin.firestore();
    const payoutDocId = `payout_v2_${teacherId}_${period.earningMonthKey}_${idempotencyKey}`.replace(/\//g, '_');
    const payoutRef = db.collection('teacherPayouts').doc(payoutDocId);
    const earningsQuery = db
      .collection('teacherEarnings')
      .where('monthKey', '==', period.earningMonthKey)
      .where('teacherId', '==', teacherId);
    // Carry sources are only earnings whose Brick 4 adjustment is already posted. Do not scan a
    // teacher's entire lifetime session ledger; ordinary teachers can legitimately exceed 500 rows.
    const teacherEarningsQuery = db
      .collection('teacherEarnings')
      .where('teacherId', '==', teacherId)
      .where('teacherPayAdjustmentStatus', '==', 'posted')
      .limit(MAX_TEACHER_LEDGER_ROWS + 1);
    const offsetsQuery = db
      .collection('teacherPaymentOffsets')
      .where('teacherId', '==', teacherId)
      .limit(MAX_TEACHER_LEDGER_ROWS + 1);
    const adjustmentsQuery = db
      .collection('teacherEarningAdjustments')
      .where('teacherId', '==', teacherId)
      .limit(MAX_TEACHER_LEDGER_ROWS + 1);

    const allocation = await db.runTransaction(async (tx) => {
      // Complete the full authoritative read set before any write. Firestore transactions reject
      // read-after-write sequences, and query reads are already retry-safe under transaction isolation.
      const [existingPayoutSnap, earningsSnap, teacherEarningsSnap, offsetsSnap, adjustmentsSnap] = await Promise.all([
        tx.get(payoutRef),
        tx.get(earningsQuery),
        tx.get(teacherEarningsQuery),
        tx.get(offsetsQuery),
        tx.get(adjustmentsQuery),
      ]);

      if (existingPayoutSnap.exists) {
        const existing = (existingPayoutSnap.data() || {}) as Record<string, unknown>;
        const existingTeacherId = clean(existing.teacherId, 160);
        const existingEarningMonthKey = resolvePayoutEarningMonthKey(existing);
        const existingPaymentMonthKey = clean(existing.paymentMonthKey, 20);
        const existingPaymentDate = clean(existing.date, 40);
        const existingMethod = clean(existing.method, 80);
        const existingAmount = money(existing.amount, Number.NaN);

        if (
          (existingTeacherId && existingTeacherId !== teacherId) ||
          (existingEarningMonthKey && existingEarningMonthKey !== period.earningMonthKey) ||
          (existingPaymentMonthKey && existingPaymentMonthKey !== period.paymentMonthKey) ||
          (existingPaymentDate && existingPaymentDate !== period.paymentDate) ||
          (existingMethod && existingMethod !== method) ||
          (Number.isFinite(existingAmount) && Math.abs(existingAmount - amount) > 0.01)
        ) {
          throw new HttpsError(
            'failed-precondition',
            'idempotencyKey already used for a different teacher payout request',
          );
        }

        return {
          payoutId: payoutRef.id,
          earningMonthKey: existingEarningMonthKey || period.earningMonthKey,
          paymentMonthKey: existingPaymentMonthKey || period.paymentMonthKey,
          paymentDate: existingPaymentDate || period.paymentDate,
          appliedEarningIds: Array.isArray(existing.appliedEarningIds)
            ? existing.appliedEarningIds
            : [],
          appliedAmount: money(existing.appliedAmount, 0),
          unappliedAmount: money(existing.unappliedAmount, 0),
          offsetAppliedAmount: money(existing.offsetAppliedAmount, 0),
          availableCarryBefore: money(existing.availableCarryBefore, 0),
          remainingCarry: money(existing.remainingCarry, 0),
          idempotentReplay: true,
        };
      }

      if (
        teacherEarningsSnap.size > MAX_TEACHER_LEDGER_ROWS ||
        offsetsSnap.size > MAX_TEACHER_LEDGER_ROWS ||
        adjustmentsSnap.size > MAX_TEACHER_LEDGER_ROWS
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Teacher adjustment/offset ledger exceeds the safe automatic carry limit; finance repair required',
        );
      }

      const earnings = earningsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
        .filter((row) => row.data.archived !== true);

      const allTeacherEarningsById = new Map<string, {
        id: string;
        ref: admin.firestore.DocumentReference;
        data: Record<string, unknown>;
      }>();
      for (const docSnap of [...earningsSnap.docs, ...teacherEarningsSnap.docs]) {
        allTeacherEarningsById.set(docSnap.id, {
          id: docSnap.id,
          ref: docSnap.ref,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        });
      }
      const allTeacherEarnings = Array.from(allTeacherEarningsById.values());

      const existingOffsets = offsetsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        data: (docSnap.data() || {}) as Record<string, unknown>,
      }));
      const adjustmentsById = new Map(
        adjustmentsSnap.docs.map((docSnap) => [
          docSnap.id,
          (docSnap.data() || {}) as Record<string, unknown>,
        ]),
      );

      const carryPlan = amount > 0
        ? planTeacherPaymentCarry({
            teacherId,
            targetEarningMonthKey: period.earningMonthKey,
            idempotencyKey,
            earnings: allTeacherEarnings,
            offsets: existingOffsets,
          })
        : {
            allocations: [],
            availableCarryBefore: 0,
            offsetAppliedAmount: 0,
            remainingCarry: 0,
            conflict: null,
          };
      if (carryPlan.conflict) {
        throw new HttpsError(
          'failed-precondition',
          `Teacher payment carry is ambiguous (${carryPlan.conflict}); finance repair required`,
        );
      }

      const existingOffsetByTarget = new Map<string, number>();
      for (const offset of existingOffsets) {
        if (clean(offset.data.status, 80) !== 'applied') continue;
        const targetId = clean(offset.data.targetEarningId, 180);
        if (!targetId) continue;
        existingOffsetByTarget.set(
          targetId,
          money(existingOffsetByTarget.get(targetId), 0) + Math.max(money(offset.data.amount, 0), 0),
        );
      }
      const newOffsetByTarget = new Map<string, number>();
      const newOffsetBySource = new Map<string, number>();
      for (const offset of carryPlan.allocations) {
        newOffsetByTarget.set(
          offset.targetEarningId,
          money(newOffsetByTarget.get(offset.targetEarningId), 0) + offset.amount,
        );
        newOffsetBySource.set(
          offset.sourceEarningId,
          money(newOffsetBySource.get(offset.sourceEarningId), 0) + offset.amount,
        );
      }

      let remaining = amount;
      const appliedEarningIds: string[] = [];
      const appliedAllocations: Array<{
        earningId: string;
        amount: number;
        entitlementAmount: number;
        earningMonthKey: string;
      }> = [];

      if (remaining > 0) {
        const openEarnings = earnings
          .filter((row) => {
            if (clean(row.data.teacherId, 160) !== teacherId) return false;
            if (status(row.data.status) === 'void') return false;
            const entitlement = resolveTeacherEarningNetEntitlementAmount(row.data);
            if (!(entitlement > 0)) return false;
            const cashAllocated = resolveTeacherEarningHistoricalCashAmount(row.data);
            const offsetApplied =
              money(existingOffsetByTarget.get(row.id), 0) + money(newOffsetByTarget.get(row.id), 0);
            return cashAllocated + offsetApplied < entitlement - 0.01;
          })
          .sort((left, right) => earningSortMs(left.data) - earningSortMs(right.data));

        for (const earning of openEarnings) {
          if (remaining <= 0) break;

          const current = earning.data;
          const entitlement = resolveTeacherEarningNetEntitlementAmount(current);
          if (!(entitlement > 0)) continue;
          const currentCashAllocated = resolveTeacherEarningHistoricalCashAmount(current);
          const offsetApplied =
            money(existingOffsetByTarget.get(earning.id), 0) + money(newOffsetByTarget.get(earning.id), 0);
          const due = Math.max(entitlement - currentCashAllocated - offsetApplied, 0);
          if (due <= 0.01) continue;

          const applyAmount = Math.min(remaining, due);
          remaining -= applyAmount;

          appliedEarningIds.push(earning.id);
          appliedAllocations.push({
            earningId: earning.id,
            amount: applyAmount,
            entitlementAmount: entitlement,
            earningMonthKey: period.earningMonthKey,
          });
        }
      } else if (remaining < 0) {
        const paidEarnings = earnings
          .filter((row) => {
            if (clean(row.data.teacherId, 160) !== teacherId) return false;
            if (status(row.data.status) === 'void') return false;
            const paidRaw = Number(row.data.paidAmount);
            return Number.isFinite(paidRaw) && paidRaw > 0;
          })
          .sort((left, right) => earningSortMs(right.data) - earningSortMs(left.data));

        for (const earning of paidEarnings) {
          if (remaining >= 0) break;

          const current = earning.data;
          const paidRaw = Number(current.paidAmount);
          const currentCashAllocated = Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : 0;
          if (currentCashAllocated <= 0) continue;

          const applyAmount = Math.min(Math.abs(remaining), currentCashAllocated);
          const nextCashAllocated = currentCashAllocated - applyAmount;
          remaining += applyAmount;
          const entitlement = resolveTeacherEarningNetEntitlementAmount(current);
          const offsetApplied = money(existingOffsetByTarget.get(earning.id), 0);
          const settlement = resolveTeacherEarningSettlement({
            entitlementAmount: entitlement,
            cashPaidAmount: nextCashAllocated,
            offsetAppliedAmount: offsetApplied,
          });

          const updates: Record<string, unknown> = {
            paidAmount: nextCashAllocated,
            teacherPayOffsetAppliedAmount: offsetApplied,
            settlementStatus: settlement.settlementStatus,
            settledBy: settlement.settledBy,
            status: settlement.settlementStatus === 'settled' ? 'paid' : settlement.settlementStatus,
            payoutIds: FieldValue.arrayUnion(payoutRef.id),
            lastPayoutAt: paidAt,
            lastPayoutPaymentMonthKey: period.paymentMonthKey,
            updatedAt: FieldValue.serverTimestamp(),
          };
          // Keep the original positive cash paidAt while cash still contributes to a settled earning.
          // If the refund makes the earning partial/unpaid or removes all cash, clear the aggregate field;
          // immutable payout rows still retain the complete historical cash timeline.
          if (settlement.settlementStatus !== 'settled' || nextCashAllocated <= 0.01) {
            updates.paidAt = FieldValue.delete();
          }

          tx.set(earning.ref, updates, { merge: true });
          appliedEarningIds.push(earning.id);
          appliedAllocations.push({
            earningId: earning.id,
            amount: -applyAmount,
            entitlementAmount: entitlement,
            earningMonthKey: period.earningMonthKey,
          });
        }
      }

      if (remaining > 0.01) {
        throw new HttpsError(
          'failed-precondition',
          'Actual cash amount exceeds outstanding teacher entitlement after carry. Record only the cash actually due.',
        );
      }
      if (remaining < -0.01) {
        throw new HttpsError(
          'failed-precondition',
          'Cash refund exceeds the reversible cash allocated to this earning month.',
        );
      }
      if (Math.abs(remaining) <= 0.01) remaining = 0;

      const cashByTarget = new Map<string, number>();
      for (const allocationRow of appliedAllocations) {
        if (allocationRow.amount <= 0) continue;
        cashByTarget.set(
          allocationRow.earningId,
          money(cashByTarget.get(allocationRow.earningId), 0) + allocationRow.amount,
        );
      }

      if (amount > 0) {
        for (const offset of carryPlan.allocations) {
          const sourceEarning = allTeacherEarnings.find((row) => row.id === offset.sourceEarningId);
          const targetEarning = allTeacherEarnings.find((row) => row.id === offset.targetEarningId);
          if (!sourceEarning || !targetEarning) {
            throw new HttpsError('failed-precondition', 'Carry allocation references missing earning evidence');
          }
          const sourceAdjustmentId = clean(sourceEarning.data.teacherPayAdjustmentLatestId, 240);
          const sourceAdjustment = sourceAdjustmentId ? adjustmentsById.get(sourceAdjustmentId) : null;
          const sourceCorrectionId = clean(sourceAdjustment?.attendanceCorrectionId, 160);
          const sourceTeacherPayDecisionId =
            clean(sourceAdjustment?.teacherPayDecisionId, 160) ||
            clean(sourceEarning.data.teacherPayAdjustmentDecisionId, 160);
          if (!sourceAdjustmentId || !sourceAdjustment || !sourceCorrectionId || !sourceTeacherPayDecisionId) {
            throw new HttpsError(
              'failed-precondition',
              'Carry source is missing immutable Brick 4 adjustment evidence; finance repair required',
            );
          }

          const offsetRef = db.collection('teacherPaymentOffsets').doc(offset.offsetId);
          tx.create(offsetRef, {
            ledgerVersion: TEACHER_PAYMENT_OFFSET_LEDGER_VERSION,
            recordType: TEACHER_PAYMENT_OFFSET_RECORD_TYPE,
            teacherId,
            sourceEarningId: offset.sourceEarningId,
            sourceSessionId: offset.sourceSessionId,
            sourceEarningMonthKey: offset.sourceEarningMonthKey,
            targetEarningId: offset.targetEarningId,
            targetSessionId: offset.targetSessionId,
            targetEarningMonthKey: offset.targetEarningMonthKey,
            sourceAdjustmentId,
            sourceCorrectionId,
            sourceTeacherPayDecisionId,
            payoutId: payoutRef.id,
            idempotencyKey,
            amount: offset.amount,
            currency: clean(sourceEarning.data.currency, 20) || 'INR',
            offsetType: TEACHER_PAYMENT_OFFSET_TYPE,
            status: 'applied',
            sourceOverpaymentAmount: offset.sourceOverpaymentAmount,
            sourceOffsetConsumedBefore: offset.sourceConsumedBefore,
            sourceOffsetRemainingAmount: offset.sourceRemainingAfter,
            targetEntitlementBeforeOffset: offset.targetEntitlementBeforeOffset,
            targetOffsetAppliedAmount: offset.targetOffsetAppliedAmount,
            targetCashDueAfterOffset: offset.targetCashDueAfterOffset,
            appliedAt: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            createdBy: request.auth?.uid || null,
            source: TEACHER_PAYMENT_OFFSET_SOURCE,
            ledgerImmutable: true,
          });
        }

        const touchedTargetIds = new Set([
          ...Array.from(newOffsetByTarget.keys()),
          ...Array.from(cashByTarget.keys()),
        ]);
        for (const targetId of touchedTargetIds) {
          const target = allTeacherEarnings.find((row) => row.id === targetId);
          if (!target) throw new HttpsError('failed-precondition', 'Target earning evidence is missing');
          const entitlement = resolveTeacherEarningNetEntitlementAmount(target.data);
          const priorCash = resolveTeacherEarningHistoricalCashAmount(target.data);
          const cashAdded = money(cashByTarget.get(targetId), 0);
          const nextCash = Number((priorCash + cashAdded).toFixed(2));
          const nextOffset = Number((
            money(existingOffsetByTarget.get(targetId), 0) + money(newOffsetByTarget.get(targetId), 0)
          ).toFixed(2));
          const settlement = resolveTeacherEarningSettlement({
            entitlementAmount: entitlement,
            cashPaidAmount: nextCash,
            offsetAppliedAmount: nextOffset,
          });
          const updates: Record<string, unknown> = {
            paidAmount: nextCash,
            teacherPayOffsetAppliedAmount: nextOffset,
            settlementStatus: settlement.settlementStatus,
            settledBy: settlement.settledBy,
            status: settlement.settlementStatus === 'settled' ? 'paid' : settlement.settlementStatus,
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (cashAdded > 0) {
            updates.payoutIds = FieldValue.arrayUnion(payoutRef.id);
            updates.lastPayoutAt = paidAt;
            updates.lastPayoutPaymentMonthKey = period.paymentMonthKey;
            if (settlement.settlementStatus === 'settled') updates.paidAt = paidAt;
          }
          tx.set(target.ref, updates, { merge: true });
        }

        for (const [sourceId] of newOffsetBySource) {
          const source = allTeacherEarnings.find((row) => row.id === sourceId);
          const sourceState = carryPlan.allocations.filter((row) => row.sourceEarningId === sourceId);
          const latest = sourceState[sourceState.length - 1];
          if (!source || !latest) continue;
          tx.set(source.ref, {
            teacherPayOffsetConsumedAmount: Number((latest.sourceConsumedBefore + sourceState.reduce(
              (sum, row) => sum + row.amount,
              0,
            )).toFixed(2)),
            teacherPayOffsetRemainingAmount: latest.sourceRemainingAfter,
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }
      }

      const appliedAmount = amount - remaining;
      tx.create(payoutRef, {
        teacherId,
        amount,
        cashAmount: amount,
        currency: 'INR',
        paidAt,
        date: period.paymentDate,
        earningMonthKey: period.earningMonthKey,
        // Compatibility alias. Do not change: legacy rollups group teacher payouts by monthKey.
        monthKey: period.monthKey,
        paymentMonthKey: period.paymentMonthKey,
        payoutSchemaVersion: TEACHER_PAYOUT_SCHEMA_VERSION,
        periodSemantics: TEACHER_PAYOUT_PERIOD_SEMANTICS,
        method,
        status: amount < 0 ? 'refunded' : 'completed',
        note: note || null,
        idempotencyKey,
        appliedEarningIds,
        appliedAllocations,
        appliedAmount,
        unappliedAmount: remaining,
        offsetAppliedAmount: carryPlan.offsetAppliedAmount,
        availableCarryBefore: carryPlan.availableCarryBefore,
        remainingCarry: carryPlan.remainingCarry,
        offsetIds: carryPlan.allocations.map((row) => row.offsetId),
        createdAt: FieldValue.serverTimestamp(),
        createdBy: request.auth?.uid || null,
      });

      return {
        payoutId: payoutRef.id,
        earningMonthKey: period.earningMonthKey,
        paymentMonthKey: period.paymentMonthKey,
        paymentDate: period.paymentDate,
        appliedEarningIds,
        appliedAmount,
        unappliedAmount: remaining,
        offsetAppliedAmount: carryPlan.offsetAppliedAmount,
        availableCarryBefore: carryPlan.availableCarryBefore,
        remainingCarry: carryPlan.remainingCarry,
        idempotentReplay: false,
      };
    });

    logger.info('recordTeacherPayoutV2: payout recorded with separate earning/payment periods', {
      payoutId: allocation.payoutId,
      teacherId,
      earningMonthKey: allocation.earningMonthKey,
      paymentMonthKey: allocation.paymentMonthKey,
      paymentDate: allocation.paymentDate,
      amount,
      appliedAmount: allocation.appliedAmount,
      unappliedAmount: allocation.unappliedAmount,
      idempotentReplay: allocation.idempotentReplay,
    });

    return {
      ok: true,
      ...allocation,
    };
  },
);
