import { describe, expect, it } from 'vitest';
import { assertParentLedgerAccountV3 } from '../../pages/admin/parentPaymentsV3Account';

const sample = {
  schemaVersion: 3,
  complete: true,
  parentId: 'parent_123456',
  parentName: 'Test Parent',
  cutoverRunId: 'migration_20261019_run01',
  source: 'firestore_billing_charges_and_v3_receipts',
  generatedAt: '2026-10-19T16:00:00Z',
  asOfDate: null,
  chargeCount: 2,
  receiptCount: 2,
  totalBilled: 1500,
  totalReceived: 1600,
  totalApplied: 1500,
  availableAdvance: 100,
  outstandingDue: 0,
  netDue: -100,
  months: [{ monthKey: '2026-10', classes: 2, billed: 1500, applied: 1500, due: 0 }],
  classDetails: [],
  receiptDetails: [],
} as const;

describe('Parent Payments V3 account integrity', () => {
  it('accepts a fully balanced server account', () => {
    expect(() => assertParentLedgerAccountV3(sample, 'parent_123456')).not.toThrow();
  });

  it('rejects incomplete and cross-parent snapshots', () => {
    expect(() => assertParentLedgerAccountV3({ ...sample, complete: false }, sample.parentId)).toThrow(/incomplete/);
    expect(() => assertParentLedgerAccountV3(sample, 'another_parent_123')).toThrow(/mismatched/);
    expect(() => assertParentLedgerAccountV3({ ...sample, months: null }, sample.parentId)).toThrow(/incomplete/);
  });

  it('rejects silently mismatched receipts, advances and class charges', () => {
    expect(() => assertParentLedgerAccountV3({ ...sample, totalReceived: 1700 }, sample.parentId)).toThrow(/not balanced/);
    expect(() => assertParentLedgerAccountV3({ ...sample, outstandingDue: 200 }, sample.parentId)).toThrow(/not balanced/);
    expect(() => assertParentLedgerAccountV3({ ...sample, netDue: Number.NaN }, sample.parentId)).toThrow(/invalid/);
  });
});
