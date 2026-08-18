export type PresentFinanceReplayPlan = {
  shouldWriteCharge: boolean;
  shouldWriteEarning: boolean;
  deferToRevenueAccrual: boolean;
  conflict:
    | 'charge_void'
    | 'earning_void'
    | 'missing_charge'
    | 'missing_earning'
    | 'missing_charge_and_earning'
    | 'already_accrued_without_ledger'
    | 'preexisting_ledger_for_non_billable_attendance'
    | null;
};

export function resolvePresentFinanceReplayPlan(input: {
  wasBillable: boolean;
  alreadyAccrued: boolean;
  chargeExists: boolean;
  chargeStatus: string;
  earningExists: boolean;
  earningStatus: string;
}): PresentFinanceReplayPlan {
  if (input.chargeExists && input.chargeStatus === 'void') {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'charge_void' };
  }
  if (input.earningExists && input.earningStatus === 'void') {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'earning_void' };
  }
  if (input.chargeExists && input.earningExists) {
    return {
      shouldWriteCharge: false,
      shouldWriteEarning: false,
      deferToRevenueAccrual: false,
      conflict: input.wasBillable ? null : 'preexisting_ledger_for_non_billable_attendance',
    };
  }
  if (input.chargeExists) {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_earning' };
  }
  if (input.earningExists) {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_charge' };
  }
  if (input.wasBillable) {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_charge_and_earning' };
  }
  if (input.alreadyAccrued) {
    return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'already_accrued_without_ledger' };
  }
  return { shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: true, conflict: null };
}
