import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { ensureAdmin } from './helpers/adminGuard';
import { normalizeFinancialStatus } from './helpers/status';
import { resolveTeacherEarningNetEntitlementAmount } from './helpers/teacherEarningsAuthoritativeRollup';
import {
  buildTeacherPayoutPeriod,
  parseTeacherPayoutPaidAt,
  resolvePayoutEarningMonthKey,
  resolveTeacherEarningCashAllocatedAmount,
  TEACHER_PAYOUT_PERIOD_SEMANTICS,
  TEACHER_PAYOUT_SCHEMA_VERSION,
} from './helpers/teacherPayoutPeriod';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

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

    const allocation = await db.runTransaction(async (tx) => {
      const existingPayoutSnap = await tx.get(payoutRef);
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
          idempotentReplay: true,
        };
      }

      const earningsSnap = await tx.get(earningsQuery);
      const earnings = earningsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: (docSnap.data() || {}) as Record<string, unknown>,
        }))
        .filter((row) => row.data.archived !== true);

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
            if (status(row.data.status) === 'void') return false;
            const entitlement = resolveTeacherEarningNetEntitlementAmount(row.data);
            if (!(entitlement > 0)) return false;
            const allocated = resolveTeacherEarningCashAllocatedAmount(row.data, entitlement);
            return allocated < entitlement - 0.01;
          })
          .sort((left, right) => earningSortMs(left.data) - earningSortMs(right.data));

        for (const earning of openEarnings) {
          if (remaining <= 0) break;

          const latestSnap = await tx.get(earning.ref);
          if (!latestSnap.exists) continue;
          const latest = (latestSnap.data() || {}) as Record<string, unknown>;
          if (clean(latest.teacherId, 160) !== teacherId || latest.archived === true) continue;
          if (status(latest.status) === 'void') continue;

          const entitlement = resolveTeacherEarningNetEntitlementAmount(latest);
          if (!(entitlement > 0)) continue;
          const currentCashAllocated = resolveTeacherEarningCashAllocatedAmount(latest, entitlement);
          const due = Math.max(entitlement - currentCashAllocated, 0);
          if (due <= 0.01) continue;

          const applyAmount = Math.min(remaining, due);
          const nextCashAllocated = currentCashAllocated + applyAmount;
          remaining -= applyAmount;

          const updates: Record<string, unknown> = {
            paidAmount: nextCashAllocated,
            payoutIds: FieldValue.arrayUnion(payoutRef.id),
            lastPayoutAt: paidAt,
            lastPayoutPaymentMonthKey: period.paymentMonthKey,
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (nextCashAllocated >= entitlement - 0.01) {
            updates.status = 'paid';
            updates.paidAt = paidAt;
          } else {
            updates.status = 'partial';
            updates.paidAt = FieldValue.delete();
          }

          tx.set(earning.ref, updates, { merge: true });
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
            if (status(row.data.status) === 'void') return false;
            const paidRaw = Number(row.data.paidAmount);
            return Number.isFinite(paidRaw) && paidRaw > 0;
          })
          .sort((left, right) => earningSortMs(right.data) - earningSortMs(left.data));

        for (const earning of paidEarnings) {
          if (remaining >= 0) break;

          const latestSnap = await tx.get(earning.ref);
          if (!latestSnap.exists) continue;
          const latest = (latestSnap.data() || {}) as Record<string, unknown>;
          if (clean(latest.teacherId, 160) !== teacherId || latest.archived === true) continue;
          if (status(latest.status) === 'void') continue;

          const paidRaw = Number(latest.paidAmount);
          const currentCashAllocated = Number.isFinite(paidRaw) && paidRaw > 0 ? paidRaw : 0;
          if (currentCashAllocated <= 0) continue;

          const applyAmount = Math.min(Math.abs(remaining), currentCashAllocated);
          const nextCashAllocated = currentCashAllocated - applyAmount;
          remaining += applyAmount;
          const entitlement = resolveTeacherEarningNetEntitlementAmount(latest);

          const updates: Record<string, unknown> = {
            paidAmount: nextCashAllocated,
            payoutIds: FieldValue.arrayUnion(payoutRef.id),
            lastPayoutAt: paidAt,
            lastPayoutPaymentMonthKey: period.paymentMonthKey,
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (entitlement <= 0.01 || nextCashAllocated >= entitlement - 0.01) {
            updates.status = 'paid';
            updates.paidAt = nextCashAllocated > 0 ? paidAt : FieldValue.delete();
          } else if (nextCashAllocated <= 0.01) {
            updates.status = 'unpaid';
            updates.paidAt = FieldValue.delete();
          } else {
            updates.status = 'partial';
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
