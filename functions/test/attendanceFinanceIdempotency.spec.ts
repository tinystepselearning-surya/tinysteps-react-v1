import { describe, expect, it } from 'vitest';
import { resolvePresentFinanceReplayPlan } from '../src/helpers/attendanceFinanceIdempotency';

describe('attendance correction finance idempotency', () => {
  it('performs no ledger writes for present to present with existing open canonical records', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: true,
      chargeStatus: 'open',
      earningExists: true,
      earningStatus: 'unpaid',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: null });
  });

  it('performs no ledger writes for present to present with a settled charge', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: true,
      chargeStatus: 'paid',
      earningExists: true,
      earningStatus: 'paid',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: null });
  });

  it('fails closed instead of repairing a missing charge during present replay', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: false,
      chargeStatus: '',
      earningExists: true,
      earningStatus: 'unpaid',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_charge' });
  });

  it('defers absent to present ledger creation to the canonical revenue transaction', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: false,
      alreadyAccrued: false,
      chargeExists: false,
      chargeStatus: '',
      earningExists: false,
      earningStatus: '',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: true, conflict: null });
  });

  it('fails closed instead of reactivating a void financial record during present replay', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: true,
      chargeStatus: 'void',
      earningExists: true,
      earningStatus: 'unpaid',
    }).conflict).toBe('charge_void');
  });

  it('fails closed without resurrecting a void charge even for absent to present', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: false,
      alreadyAccrued: false,
      chargeExists: true,
      chargeStatus: 'void',
      earningExists: true,
      earningStatus: 'void',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'charge_void' });
  });

  it('fails closed when a paid charge exists but its teacher earning is missing', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: true,
      chargeStatus: 'paid',
      earningExists: false,
      earningStatus: '',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_earning' });
  });

  it('fails closed when both ledger records are missing for already-present attendance', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: true,
      alreadyAccrued: true,
      chargeExists: false,
      chargeStatus: '',
      earningExists: false,
      earningStatus: '',
    })).toEqual({ shouldWriteCharge: false, shouldWriteEarning: false, deferToRevenueAccrual: false, conflict: 'missing_charge_and_earning' });
  });

  it('fails closed if non-billable attendance already has both ledger records', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: false,
      alreadyAccrued: false,
      chargeExists: true,
      chargeStatus: 'open',
      earningExists: true,
      earningStatus: 'unpaid',
    }).conflict).toBe('preexisting_ledger_for_non_billable_attendance');
  });

  it('fails closed when an absent to present correction finds prior accrual without ledger documents', () => {
    expect(resolvePresentFinanceReplayPlan({
      wasBillable: false,
      alreadyAccrued: true,
      chargeExists: false,
      chargeStatus: '',
      earningExists: false,
      earningStatus: '',
    }).conflict).toBe('already_accrued_without_ledger');
  });
});
