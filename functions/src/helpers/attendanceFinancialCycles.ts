/**
 * One real class session, one billingCharge, one teacherEarning. An attendance
 * reversal never creates a second canonical charge/earning document.
 *
 * Wallet deductions are immutable transactions, however, so each restored
 * billable interval needs a distinct idempotency key. Cycle 1 deliberately
 * preserves legacy keys so previously deducted and reversed wallet entries
 * continue to reconcile without migration.
 */
type LedgerRecord = Record<string, unknown>;

const positiveMoney = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const normalized = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase();

export function attendanceFinanceCycle(record: LedgerRecord | null | undefined): number {
  const value = Number(record?.attendanceFinanceCycle);
  return Number.isSafeInteger(value) && value >= 1 ? value : 1;
}

export function attendanceWalletCycleKeys(
  chargeId: string,
  record: LedgerRecord | null | undefined,
): {deduction: string; reversal: string; cycle: number} {
  const cycle = attendanceFinanceCycle(record);
  const suffix = cycle === 1 ? '' : `_cycle_${cycle}`;
  return {
    deduction: `charge_${chargeId}${suffix}`,
    reversal: `reverse_charge_${chargeId}${suffix}`,
    cycle,
  };
}

/**
 * Attendance may always be corrected; cash allocations and teacher payouts may
 * never be silently rewritten by that correction. Recognize both status-driven
 * settlement and legacy ledgers containing allocation evidence.
 */
export function hasAttendanceFinanceSettlementEvidence(
  record: LedgerRecord | null | undefined,
): boolean {
  if (!record) return false;
  if (['paid', 'settled', 'partial', 'partially_paid'].includes(normalized(record.status))) {
    return true;
  }
  if (['paidAmount', 'appliedAmount', 'settledAmount'].some(key =>
    positiveMoney(record[key]) > 0)) return true;
  if (['allocations', 'paymentIds', 'payoutIds'].some(key =>
    Array.isArray(record[key]) && (record[key] as unknown[]).length > 0)) return true;
  if (['paymentId', 'payoutId', 'lastPaymentId', 'lastAllocationRef', 'payoutBatchId'].some(key =>
    Boolean(String(record[key] ?? '').trim()))) return true;
  return false;
}

function hasPaymentAllocation(record: LedgerRecord): boolean {
  return hasAttendanceFinanceSettlementEvidence(record);
}

function voidWasCausedByAttendance(record: LedgerRecord): boolean {
  const origin = normalized(record.voidSource);
  const reason = normalized(record.voidReason);
  if (origin && origin !== 'attendance_status_correction' &&
      origin !== 'admin-attendance-correction') return false;
  if (origin === 'attendance_status_correction') return true;
  if (normalized(record.reconciliationSource) === 'admin-attendance-correction') {
    return true;
  }
  // Backward compatible with automated October cutover voids, which wrote
  // only status: void and voidedAt. The *known* manual void flows always
  // supply a nonempty reason and are therefore protected here.
  return (reason === '' && Boolean(record.voidedAt)) ||
    reason === 'attendance_marked_non_billable';
}

export function mayReopenAttendanceVoidedLedgers(input: {
  sessionId: string;
  session: LedgerRecord;
  charge: LedgerRecord | null;
  earning: LedgerRecord | null;
}): boolean {
  const {sessionId, session, charge, earning} = input;
  if (!charge || !earning || !sessionId || session.revenueAccrued === true) return false;
  if (normalized(charge.status) !== 'void' || normalized(earning.status) !== 'void') {
    return false;
  }
  if (normalized(charge.source) !== 'session_present_completed' ||
      normalized(earning.source) !== 'session_present_completed') return false;
  if (charge.sessionId && charge.sessionId !== sessionId) return false;
  if (earning.sessionId && earning.sessionId !== sessionId) return false;
  if (!voidWasCausedByAttendance(charge) || !voidWasCausedByAttendance(earning)) {
    return false;
  }
  if (hasPaymentAllocation(charge) || hasPaymentAllocation(earning)) return false;
  if (!(positiveMoney(charge.amount) > 0) || !(positiveMoney(earning.amount) > 0)) {
    return false;
  }
  // Both financial event documents must refer to the same enrollment/student.
  for (const key of ['enrollmentId', 'kidId', 'parentId', 'teacherId']) {
    const a = String(charge[key] || '').trim();
    const b = String(earning[key] || '').trim();
    if (a && b && a !== b) return false;
  }
  return true;
}
