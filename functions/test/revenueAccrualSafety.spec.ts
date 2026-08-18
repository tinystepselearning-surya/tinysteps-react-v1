import { describe, expect, it } from 'vitest';
import { resolveRevenueAccrualLedgerRepairReason } from '../src/helpers/revenueAccrualSafety';

describe('revenue accrual ledger safety', () => {
  it('allows a first accrual only when both canonical ledger documents are absent', () => {
    expect(resolveRevenueAccrualLedgerRepairReason({
      alreadyAccrued: false,
      chargeExists: false,
      chargeStatus: '',
      earningExists: false,
      earningStatus: '',
    })).toBeNull();
  });

  it('fails closed rather than resurrecting a void billing charge', () => {
    expect(resolveRevenueAccrualLedgerRepairReason({
      alreadyAccrued: false,
      chargeExists: true,
      chargeStatus: 'void',
      earningExists: true,
      earningStatus: 'unpaid',
    })).toBe('void_ledger_requires_review');
  });

  it('fails closed when a paid charge exists without a teacher earning', () => {
    expect(resolveRevenueAccrualLedgerRepairReason({
      alreadyAccrued: false,
      chargeExists: true,
      chargeStatus: 'paid',
      earningExists: false,
      earningStatus: '',
    })).toBe('preexisting_charge_missing_earning_before_accrual');
  });

  it('does not ask the accrual path to repair missing documents after accrual', () => {
    expect(resolveRevenueAccrualLedgerRepairReason({
      alreadyAccrued: true,
      chargeExists: true,
      chargeStatus: 'paid',
      earningExists: false,
      earningStatus: '',
    })).toBeNull();
  });
});
