import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockLines, mockSave } = vi.hoisted(() => ({
  mockLines: [] as string[],
  mockSave: vi.fn(),
}));

vi.mock('jspdf', () => ({
  default: class FakePdf {
    internal = { pageSize: { getWidth: () => 595 } };
    addPage = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setDrawColor = vi.fn();
    line = vi.fn();
    splitTextToSize = (text: string) => [text];
    text = (value: string | string[]) => {
      if (Array.isArray(value)) mockLines.push(...value);
      else mockLines.push(value);
    };
    save = mockSave;
  },
}));

import { downloadParentLedgerV3Invoice } from '../../pages/admin/parentPaymentsV3Invoice';
import type { ParentLedgerAccountV3 } from '../../pages/admin/parentPaymentsV3Account';

const example: ParentLedgerAccountV3 = {
  schemaVersion: 3,
  complete: true,
  parentId: 'parent_123456',
  parentName: 'Example Parent',
  cutoverRunId: 'migration_20261019_run01',
  asOfDate: '2026-10-19',
  generatedAt: '2026-10-19T12:00:00.000Z',
  source: 'firestore_billing_charges_and_v3_receipts',
  chargeCount: 2,
  receiptCount: 1,
  totalBilled: 1000,
  totalReceived: 1200,
  totalApplied: 1000,
  availableAdvance: 200,
  outstandingDue: 0,
  netDue: -200,
  months: [{ monthKey: '2026-10', billed: 1000, applied: 1000, due: 0, classes: 2 }],
  classDetails: [
    { id: 'one', serviceDate: '2026-10-03', monthKey: '2026-10', studentName: 'Example Child', courseName: 'Grammar',
      attendance: 'Present', amount: 500, applied: 500, due: 0 },
    { id: 'two', serviceDate: '2026-10-09', monthKey: '2026-10', studentName: 'Example Child', courseName: 'Phonics',
      attendance: 'Not verified', amount: 500, applied: 500, due: 0 },
  ],
  receiptDetails: [{ id: 'receipt1', receivedDate: '2026-10-10', kind: 'regular',
    amount: 1200, method: 'UPI', reference: 'REF-1' }],
};

describe('Parent V3 cumulative statement PDF', () => {
  beforeEach(() => { mockLines.length = 0; mockSave.mockClear(); });

  it('includes parent name, month summary, dated classes, attendance and receipt history', () => {
    const file = downloadParentLedgerV3Invoice(example);
    expect(file).toContain('Example_Parent');
    expect(mockSave).toHaveBeenCalledOnce();
    const text = mockLines.join(' | ');
    expect(text).toContain('Parent Fee Statement');
    expect(text).toContain('Example Parent');
    expect(text).toContain('Month-wise class');
    expect(text).toContain('Grammar');
    expect(text).toContain('Phonics');
    expect(text).toContain('Present');
    expect(text).toContain('Not verified');
    expect(text).toContain('UPI');
    expect(text).toContain('REF-1');
    expect(text).toContain('Available advance credit');
  });

  it('blocks PDF generation if the receipt and billing ledger is unbalanced', () => {
    expect(() => downloadParentLedgerV3Invoice({
      ...example,
      totalBilled: 1400,
    })).toThrow(/not balanced/);
    expect(mockSave).not.toHaveBeenCalled();
  });
});
