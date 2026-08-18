export type RevenueAccrualLedgerRepairReason =
  | 'void_ledger_requires_review'
  | 'preexisting_charge_and_earning_before_accrual'
  | 'preexisting_charge_missing_earning_before_accrual'
  | 'preexisting_earning_missing_charge_before_accrual';

export function resolveRevenueAccrualLedgerRepairReason(input: {
  alreadyAccrued: boolean;
  chargeExists: boolean;
  chargeStatus: string;
  earningExists: boolean;
  earningStatus: string;
}): RevenueAccrualLedgerRepairReason | null {
  const chargeStatus = String(input.chargeStatus || '').trim().toLowerCase();
  const earningStatus = String(input.earningStatus || '').trim().toLowerCase();
  if (
    (input.chargeExists && chargeStatus === 'void') ||
    (input.earningExists && earningStatus === 'void')
  ) {
    return 'void_ledger_requires_review';
  }
  if (input.alreadyAccrued || (!input.chargeExists && !input.earningExists)) return null;
  if (input.chargeExists && input.earningExists) {
    return 'preexisting_charge_and_earning_before_accrual';
  }
  return input.chargeExists
    ? 'preexisting_charge_missing_earning_before_accrual'
    : 'preexisting_earning_missing_charge_before_accrual';
}
