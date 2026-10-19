import { describe, it, expect } from 'vitest';
import {
  validateParentReceiptV3,
  parentReceiptV3MatchesExisting,
} from '../src/parentReceiptV3Contract';

const valid = {
  parentId: 'parent_123456',
  idempotencyKey: 'receipt_20261019_abc123',
  amount: 4000,
  receivedDate: '2026-10-19',
};

describe('parent receipts V3 immutable contract', () => {
  it('accepts only amount and receipt date; optional source is not mandatory', () => {
    const receipt = validateParentReceiptV3(valid, '2026-10-19');
    expect(receipt).toEqual({
      parentId: valid.parentId,
      idempotencyKey: valid.idempotencyKey,
      amountPaise: 400000,
      amount: 4000,
      receivedDate: '2026-10-19',
      receiptMonthKey: '2026-10',
      kind: 'regular',
      method: null,
      reference: null,
      note: null,
    });
    expect('billedAmount' in receipt).toBe(false);
  });

  it('preserves an explicitly dated advance without adding it as a second payment', () => {
    const receipt = validateParentReceiptV3({
      ...valid, amount: 1500.25, kind: 'advance', method: 'UPI',
    }, '2026-10-19');
    expect(receipt).toMatchObject({ amountPaise: 150025, amount: 1500.25, kind: 'advance', method: 'UPI' });
  });

  it('rejects invalid, imprecise, negative, zero or future receipts', () => {
    expect(() => validateParentReceiptV3({ ...valid, amount: -1 })).toThrow(/positive/);
    expect(() => validateParentReceiptV3({ ...valid, amount: 0 })).toThrow(/positive/);
    expect(() => validateParentReceiptV3({ ...valid, amount: '4000' })).toThrow(/positive/);
    expect(() => validateParentReceiptV3({ ...valid, amount: 2.345 })).toThrow(/decimal places/);
    expect(() => validateParentReceiptV3({ ...valid, amount: 1e12 })).toThrow(/within policy/);
    expect(() => validateParentReceiptV3({ ...valid, receivedDate: '2026-02-30' })).toThrow(/Invalid receipt date/);
    expect(() => validateParentReceiptV3({ ...valid, receivedDate: '2026-10-20' }, '2026-10-19')).toThrow(/future/);
    expect(() => validateParentReceiptV3({ ...valid, kind: 'refund' })).toThrow(/category/);
  });

  it('blocks ambiguous identifiers and overlong optional text', () => {
    expect(() => validateParentReceiptV3({ ...valid, parentId: 'parent/child' })).toThrow(/parent ID/);
    expect(() => validateParentReceiptV3({ ...valid, idempotencyKey: '../' })).toThrow(/idempotency/);
    expect(() => validateParentReceiptV3({ ...valid, reference: 'a'.repeat(151) })).toThrow(/too long/);
  });

  it('permits exact idempotent replay but not a conflicting reuse of key', () => {
    const normalized = validateParentReceiptV3(valid);
    const stored: Record<string, unknown> = {
      ...normalized,
      schemaVersion: 3,
      status: 'recorded',
      createdBy: 'admin',
    };
    expect(parentReceiptV3MatchesExisting(normalized, stored)).toBe(true);
    expect(parentReceiptV3MatchesExisting(normalized, { ...stored, amountPaise: 200 })).toBe(false);
    expect(parentReceiptV3MatchesExisting(normalized, { ...stored, receivedDate: '2026-10-18' })).toBe(false);
    expect(parentReceiptV3MatchesExisting(normalized, { ...stored, status: 'reversed' })).toBe(false);
  });
});
