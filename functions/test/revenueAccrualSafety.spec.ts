import { describe, expect, it } from 'vitest';
import {
  resolveRevenueAccrualLedgerRepairReason,
  shouldPersistRevenueRepairMarker,
} from '../src/helpers/revenueAccrualSafety';

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

describe('revenue repair marker recursion guard', () => {
  it('writes once for a zero-fee condition and performs no write on the same retrigger', () => {
    const reason = 'zero_or_unresolved_session_fee';
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: false,
      existingRepairReason: null,
      nextRepairReason: reason,
    })).toBe(true);
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: true,
      existingRepairReason: reason,
      nextRepairReason: reason,
    })).toBe(false);
  });

  it('writes once for a void-ledger condition and performs no write on the same retrigger', () => {
    const reason = 'void_ledger_requires_review';
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: false,
      existingRepairReason: '',
      nextRepairReason: reason,
    })).toBe(true);
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: true,
      existingRepairReason: reason,
      nextRepairReason: reason,
    })).toBe(false);
  });

  it('does not rewrite an already-accrued missing-ledger marker on retrigger', () => {
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: true,
      existingRepairReason: 'missing_teacher_earning_doc',
      nextRepairReason: 'missing_teacher_earning_doc',
    })).toBe(false);
  });

  it('allows one marker update when the unresolved reason genuinely changes', () => {
    expect(shouldPersistRevenueRepairMarker({
      existingRepairRequired: true,
      existingRepairReason: 'zero_or_unresolved_session_fee',
      nextRepairReason: 'void_ledger_requires_review',
    })).toBe(true);
  });
});
