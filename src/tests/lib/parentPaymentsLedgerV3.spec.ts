import { describe, expect, it } from 'vitest';
import {
  projectParentLedger,
  type LedgerChargeInput,
  type LedgerReceiptInput,
} from '../../lib/parentPaymentsLedgerV3';

const charge = (id: string, date: string, amount: number): LedgerChargeInput => ({
  id, serviceDate: date, monthKey: date.slice(0, 7), amount,
});
const receipt = (id: string, date: string, amount: number, kind?: 'regular' | 'advance'): LedgerReceiptInput => ({
  id, receivedDate: date, amount, kind,
});

describe('Parent receipts ledger V3 (pure, non-production projection)', () => {
  it('settles oldest outstanding classes and moves only surplus to advance', () => {
    const result = projectParentLedger(
      [charge('may', '2026-05-10', 1500), charge('june', '2026-06-10', 2000)],
      [receipt('payment', '2026-06-20', 4000)],
    );
    expect(result).toMatchObject({
      totalBilled: 3500, totalReceived: 4000, totalApplied: 3500,
      availableAdvance: 500, outstandingDue: 0, netDue: -500,
    });
    expect(result.months).toEqual([
      { monthKey: '2026-05', billed: 1500, applied: 1500, due: 0, classes: 1 },
      { monthKey: '2026-06', billed: 2000, applied: 2000, due: 0, classes: 1 },
    ]);
  });

  it('keeps an explicit advance separate from already outstanding charges', () => {
    const result = projectParentLedger(
      [charge('older', '2026-07-02', 400), charge('future', '2026-07-12', 600)],
      [receipt('advance', '2026-07-07', 700, 'advance')],
    );
    expect(result.charges).toEqual([
      { id: 'older', serviceDate: '2026-07-02', monthKey: '2026-07', amount: 400, applied: 0, due: 400 },
      { id: 'future', serviceDate: '2026-07-12', monthKey: '2026-07', amount: 600, applied: 600, due: 0 },
    ]);
    expect(result.availableAdvance).toBe(100);
    expect(result.outstandingDue).toBe(400);
    expect(result.netDue).toBe(300);
  });

  it('automatically applies earlier overpayment to future charges without counting money twice', () => {
    const result = projectParentLedger(
      [charge('class', '2026-10-15', 375)],
      [receipt('earlier', '2026-10-01', 500)],
    );
    expect(result.totalReceived).toBe(500);
    expect(result.totalApplied).toBe(375);
    expect(result.availableAdvance).toBe(125);
    expect(result.outstandingDue).toBe(0);
  });

  it('excludes voided or archived charges without importing prior settlement fields', () => {
    const result = projectParentLedger([
      { ...charge('voided', '2026-10-01', 375), status: 'void' },
      { ...charge('archived', '2026-10-02', 400), archived: true },
      { ...charge('real', '2026-10-03', 375), status: 'unpaid' },
    ], []);
    expect(result.totalBilled).toBe(375);
    expect(result.outstandingDue).toBe(375);
    expect(result.charges).toHaveLength(1);
  });

  it('replays actual receipt dates; it never allocates a future receipt to an as-of snapshot', () => {
    const charges = [charge('class', '2026-07-03', 750)];
    const receipts = [receipt('paid-in-aug', '2026-08-10', 750)];
    expect(projectParentLedger(charges, receipts, '2026-07-31')).toMatchObject({
      totalBilled: 750, totalReceived: 0, outstandingDue: 750,
    });
    expect(projectParentLedger(charges, receipts, '2026-08-10')).toMatchObject({
      totalBilled: 750, totalReceived: 750, outstandingDue: 0,
    });
  });

  it('sorts receipts consistently independent of uploaded row order', () => {
    const charges = [charge('one', '2026-05-10', 1000), charge('two', '2026-05-20', 500)];
    const payments = [receipt('later', '2026-05-22', 700), receipt('earlier', '2026-05-15', 600)];
    expect(projectParentLedger(charges, payments)).toEqual(projectParentLedger(charges, payments.reverse()));
  });

  it('rejects invalid receipt dates, duplicate IDs, negative amounts and fractional paise', () => {
    expect(() => projectParentLedger([], [receipt('bad', '2026-02-30', 100)])).toThrow(/Invalid receipt date/);
    expect(() => projectParentLedger([], [receipt('a', '2026-10-01', 100), receipt('a', '2026-10-02', 100)])).toThrow(/duplicate receipt ID/);
    expect(() => projectParentLedger([], [receipt('negative', '2026-10-01', -20)])).toThrow(/Invalid receipt/);
    expect(() => projectParentLedger([], [receipt('precision', '2026-10-01', 12.345)])).toThrow(/precision/);
  });

  it('maintains exact currency conservation with small partial receipts', () => {
    const result = projectParentLedger(
      [charge('class', '2026-08-03', 0.30)],
      [receipt('r1', '2026-08-03', 0.10), receipt('r2', '2026-08-04', 0.25)],
    );
    expect(result).toMatchObject({
      totalBilled: 0.30,
      totalReceived: 0.35,
      totalApplied: 0.30,
      availableAdvance: 0.05,
      outstandingDue: 0,
    });
  });
});
