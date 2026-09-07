import { resolveTeacherEarningNetEntitlementAmount } from './teacherEarningsAuthoritativeRollup';

export const TEACHER_PAYMENT_OFFSET_LEDGER_VERSION = 1;
export const TEACHER_PAYMENT_OFFSET_RECORD_TYPE = 'teacher_payment_offset';
export const TEACHER_PAYMENT_OFFSET_TYPE = 'prior_overpayment_carry';
export const TEACHER_PAYMENT_OFFSET_SOURCE = 'teacher_earning_adjustment';

export type TeacherPaymentOffsetLedgerRow = {
  id: string;
  data: Record<string, unknown>;
};

export type TeacherPaymentOffsetEarningRow = {
  id: string;
  data: Record<string, unknown>;
};

export type TeacherPaymentOffsetAllocation = {
  offsetId: string;
  sourceEarningId: string;
  sourceSessionId: string;
  sourceEarningMonthKey: string;
  targetEarningId: string;
  targetSessionId: string;
  targetEarningMonthKey: string;
  amount: number;
  sourceOverpaymentAmount: number;
  sourceConsumedBefore: number;
  sourceRemainingAfter: number;
  targetEntitlementBeforeOffset: number;
  targetOffsetBefore: number;
  targetOffsetAppliedAmount: number;
  targetCashDueAfterOffset: number;
};

export type TeacherPaymentCarryPlan = {
  allocations: TeacherPaymentOffsetAllocation[];
  availableCarryBefore: number;
  offsetAppliedAmount: number;
  remainingCarry: number;
  conflict: string | null;
};

function clean(value: unknown, maxLen = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function nonNegativeTeacherMoney(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : 0;
}

export function resolveTeacherEarningHistoricalCashAmount(
  earning: Record<string, unknown>,
): number {
  if (earning.paidAmount !== undefined && earning.paidAmount !== null) {
    const explicitRaw = Number(earning.paidAmount);
    if (Number.isFinite(explicitRaw) && explicitRaw >= 0) return roundMoney(explicitRaw);
  }
  const status = clean(earning.status, 80).toLowerCase();
  if (status === 'paid' || status === 'settled') {
    return nonNegativeTeacherMoney(earning.amount);
  }
  return 0;
}

export function resolveTeacherEarningOffsetAppliedAmount(
  earning: Record<string, unknown>,
): number {
  return nonNegativeTeacherMoney(earning.teacherPayOffsetAppliedAmount);
}

export function resolveTeacherEarningSettlement(input: {
  entitlementAmount: number;
  cashPaidAmount: number;
  offsetAppliedAmount: number;
}): {
  satisfiedAmount: number;
  pendingAmount: number;
  settlementStatus: 'unpaid' | 'partial' | 'settled';
  settledBy: 'cash' | 'cash_and_offset' | 'offset' | null;
} {
  const entitlement = nonNegativeTeacherMoney(input.entitlementAmount);
  const cash = nonNegativeTeacherMoney(input.cashPaidAmount);
  const offset = nonNegativeTeacherMoney(input.offsetAppliedAmount);
  const satisfiedAmount = roundMoney(cash + offset);
  const pendingAmount = roundMoney(Math.max(entitlement - satisfiedAmount, 0));
  const settlementStatus =
    entitlement <= 0.01 || pendingAmount <= 0.01
      ? 'settled'
      : satisfiedAmount > 0.01
        ? 'partial'
        : 'unpaid';
  const settledBy =
    settlementStatus !== 'settled'
      ? null
      : cash > 0.01 && offset > 0.01
        ? 'cash_and_offset'
        : offset > 0.01
          ? 'offset'
          : cash > 0.01
            ? 'cash'
            : null;
  return { satisfiedAmount, pendingAmount, settlementStatus, settledBy };
}

export function buildTeacherPaymentOffsetId(input: {
  sourceEarningId: string;
  targetEarningId: string;
  idempotencyKey: string;
}): string {
  const token = [input.sourceEarningId, input.targetEarningId, input.idempotencyKey]
    .map((value) => clean(value, 180).replace(/[^A-Za-z0-9_-]/g, '_'))
    .join('__');
  return `teacher_offset_${token}`.slice(0, 700);
}

function earningMonthKey(row: TeacherPaymentOffsetEarningRow): string {
  return clean(row.data.monthKey, 20);
}

function earningSortValue(row: TeacherPaymentOffsetEarningRow): string {
  const data = row.data;
  const raw = data.earnedAt || data.createdAt || data.updatedAt;
  if (raw && typeof raw === 'object') {
    const timestamp = raw as { toMillis?: () => number; seconds?: unknown };
    if (typeof timestamp.toMillis === 'function') return String(timestamp.toMillis()).padStart(20, '0');
    const seconds = Number(timestamp.seconds);
    if (Number.isFinite(seconds)) return String(seconds * 1000).padStart(20, '0');
  }
  const parsed = new Date(String(raw || '')).getTime();
  return Number.isFinite(parsed) ? String(parsed).padStart(20, '0') : row.id;
}

/**
 * Ledger-derived carry planner. Historical cash is never capped at current entitlement: that
 * difference is precisely the overpayment evidence. Existing immutable offset rows are the
 * authority for both source consumption and target non-cash satisfaction.
 */
export function planTeacherPaymentCarry(input: {
  teacherId: string;
  targetEarningMonthKey: string;
  idempotencyKey: string;
  earnings: TeacherPaymentOffsetEarningRow[];
  offsets: TeacherPaymentOffsetLedgerRow[];
}): TeacherPaymentCarryPlan {
  const teacherId = clean(input.teacherId, 160);
  const targetMonth = clean(input.targetEarningMonthKey, 20);
  const appliedOffsets = input.offsets.filter((row) => {
    const data = row.data;
    return (
      clean(data.teacherId, 160) === teacherId &&
      clean(data.recordType, 80) === TEACHER_PAYMENT_OFFSET_RECORD_TYPE &&
      clean(data.status, 80) === 'applied' &&
      nonNegativeTeacherMoney(data.amount) > 0
    );
  });

  const consumedBySource = new Map<string, number>();
  const appliedByTarget = new Map<string, number>();
  for (const row of appliedOffsets) {
    const amount = nonNegativeTeacherMoney(row.data.amount);
    const sourceId = clean(row.data.sourceEarningId, 180);
    const targetId = clean(row.data.targetEarningId, 180);
    if (sourceId) consumedBySource.set(sourceId, roundMoney((consumedBySource.get(sourceId) || 0) + amount));
    if (targetId) appliedByTarget.set(targetId, roundMoney((appliedByTarget.get(targetId) || 0) + amount));
  }

  const sourceStates = input.earnings
    .filter((row) => {
      const data = row.data;
      return (
        clean(data.teacherId, 160) === teacherId &&
        data.archived !== true &&
        clean(data.status, 80).toLowerCase() !== 'void' &&
        earningMonthKey(row) < targetMonth &&
        clean(data.teacherPayAdjustmentStatus, 80).toLowerCase() === 'posted' &&
        data.teacherPayAdjustmentRequired === false
      );
    })
    .map((row) => {
      const cash = resolveTeacherEarningHistoricalCashAmount(row.data);
      const entitlement = resolveTeacherEarningNetEntitlementAmount(row.data);
      const overpayment = roundMoney(Math.max(cash - entitlement, 0));
      const consumed = consumedBySource.get(row.id) || 0;
      return { row, overpayment, consumed, available: roundMoney(overpayment - consumed) };
    })
    .sort((left, right) => {
      const monthOrder = earningMonthKey(left.row).localeCompare(earningMonthKey(right.row));
      return monthOrder || earningSortValue(left.row).localeCompare(earningSortValue(right.row));
    });

  const invalidSource = sourceStates.find((state) => state.available < -0.01);
  if (invalidSource) {
    return {
      allocations: [],
      availableCarryBefore: 0,
      offsetAppliedAmount: 0,
      remainingCarry: 0,
      conflict: `source_offset_consumption_exceeds_overpayment:${invalidSource.row.id}`,
    };
  }

  const targets = input.earnings
    .filter((row) => {
      const data = row.data;
      if (
        clean(data.teacherId, 160) !== teacherId ||
        data.archived === true ||
        clean(data.status, 80).toLowerCase() === 'void' ||
        earningMonthKey(row) !== targetMonth
      ) return false;
      const entitlement = resolveTeacherEarningNetEntitlementAmount(data);
      const cash = resolveTeacherEarningHistoricalCashAmount(data);
      const offset = appliedByTarget.get(row.id) || 0;
      return entitlement - cash - offset > 0.01;
    })
    .sort((left, right) => earningSortValue(left).localeCompare(earningSortValue(right)));

  const availableCarryBefore = roundMoney(sourceStates.reduce(
    (sum, state) => sum + Math.max(state.available, 0),
    0,
  ));
  const allocations: TeacherPaymentOffsetAllocation[] = [];

  for (const source of sourceStates) {
    let sourceAvailable = Math.max(source.available, 0);
    if (sourceAvailable <= 0.01) continue;
    for (const target of targets) {
      if (sourceAvailable <= 0.01) break;
      const entitlement = resolveTeacherEarningNetEntitlementAmount(target.data);
      const cash = resolveTeacherEarningHistoricalCashAmount(target.data);
      const targetBefore = roundMoney(
        (appliedByTarget.get(target.id) || 0) +
        allocations
          .filter((allocation) => allocation.targetEarningId === target.id)
          .reduce((sum, allocation) => sum + allocation.amount, 0),
      );
      const targetRemaining = roundMoney(Math.max(entitlement - cash - targetBefore, 0));
      if (targetRemaining <= 0.01) continue;
      const amount = roundMoney(Math.min(sourceAvailable, targetRemaining));
      if (amount <= 0.01) continue;
      sourceAvailable = roundMoney(sourceAvailable - amount);
      allocations.push({
        offsetId: buildTeacherPaymentOffsetId({
          sourceEarningId: source.row.id,
          targetEarningId: target.id,
          idempotencyKey: input.idempotencyKey,
        }),
        sourceEarningId: source.row.id,
        sourceSessionId: clean(source.row.data.sessionId, 160) || source.row.id,
        sourceEarningMonthKey: earningMonthKey(source.row),
        targetEarningId: target.id,
        targetSessionId: clean(target.data.sessionId, 160) || target.id,
        targetEarningMonthKey: targetMonth,
        amount,
        sourceOverpaymentAmount: source.overpayment,
        sourceConsumedBefore: source.consumed,
        sourceRemainingAfter: sourceAvailable,
        targetEntitlementBeforeOffset: entitlement,
        targetOffsetBefore: targetBefore,
        targetOffsetAppliedAmount: amount,
        targetCashDueAfterOffset: roundMoney(Math.max(entitlement - cash - targetBefore - amount, 0)),
      });
    }
  }

  const offsetAppliedAmount = roundMoney(allocations.reduce((sum, row) => sum + row.amount, 0));
  return {
    allocations,
    availableCarryBefore,
    offsetAppliedAmount,
    remainingCarry: roundMoney(Math.max(availableCarryBefore - offsetAppliedAmount, 0)),
    conflict: null,
  };
}

export function validateTeacherOffsetRestoration(input: {
  sourceEarningId: string;
  historicalCashAmount: number;
  resultingNetEntitlement: number;
  offsets: TeacherPaymentOffsetLedgerRow[];
}): { valid: true } | { valid: false; reason: string; consumedAmount: number; availableOverpayment: number } {
  const sourceEarningId = clean(input.sourceEarningId, 180);
  const consumedAmount = roundMoney(input.offsets.reduce((sum, row) => {
    const data = row.data;
    if (
      clean(data.sourceEarningId, 180) !== sourceEarningId ||
      clean(data.recordType, 80) !== TEACHER_PAYMENT_OFFSET_RECORD_TYPE ||
      clean(data.status, 80) !== 'applied'
    ) return sum;
    return sum + nonNegativeTeacherMoney(data.amount);
  }, 0));
  const availableOverpayment = roundMoney(Math.max(
    nonNegativeTeacherMoney(input.historicalCashAmount) -
      nonNegativeTeacherMoney(input.resultingNetEntitlement),
    0,
  ));
  if (consumedAmount > availableOverpayment + 0.01) {
    return {
      valid: false,
      reason: 'offset_consumed_before_entitlement_restoration',
      consumedAmount,
      availableOverpayment,
    };
  }
  return { valid: true };
}
