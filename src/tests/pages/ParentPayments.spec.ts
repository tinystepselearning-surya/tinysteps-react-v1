import { describe, expect, it } from 'vitest';
import {
  buildParentPaymentsReportingRow,
  buildParentPaymentsSummaryCards,
  resolveParentPaymentSettlementSummary,
  type ParentPaymentsReportingRowInput,
} from '../../pages/admin/parentPaymentsReporting';

const REPORT_NOW = new Date('2026-06-14T12:00:00+05:30');

const createRow = (overrides: Partial<ParentPaymentsReportingRowInput> = {}) =>
  buildParentPaymentsReportingRow({
    parentId: 'parent-1',
    parentName: 'Parent One',
    studentNames: ['Student One'],
    chargesCount: 4,
    classCharges: 12000,
    settledFromCharges: 0,
    dueFromCharges: 12000,
    receiptMonthPaymentsReceived: 0,
    walletBalance: 0,
    monthlyReadModel: null,
    selectedMonth: '2026-05',
    now: REPORT_NOW,
    ...overrides,
  });

describe('ParentPayments reporting helpers', () => {
  it('keeps wallet balances visible for each parent row', () => {
    const paidRow = createRow({
      parentId: 'parent-a',
      parentName: 'Parent A',
      walletBalance: 2500,
      monthlyReadModel: {
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 12000,
          dueAmount: 0,
        },
      },
    });
    const partialRow = createRow({
      parentId: 'parent-b',
      parentName: 'Parent B',
      walletBalance: -1800,
      monthlyReadModel: {
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 4000,
          dueAmount: 8000,
        },
      },
    });

    expect(paidRow.overallWalletBalance).toBe(2500);
    expect(paidRow.advanceAmount).toBe(2500);
    expect(partialRow.overallWalletBalance).toBe(-1800);
    expect(partialRow.walletDeficitAmount).toBe(1800);
  });

  it('does not treat receipt-month payments as selected-month settlement without allocation data', () => {
    const row = createRow({
      selectedMonth: '2026-05',
      receiptMonthPaymentsReceived: 12000,
      monthlyReadModel: null,
      settledFromCharges: 0,
      dueFromCharges: 12000,
    });

    expect(row.selectedMonthSettled).toBe(0);
    expect(row.selectedMonthDue).toBe(12000);
    expect(row.statusLabel).toBe('In Grace');
  });

  it('marks a fully settled read-model month as paid', () => {
    const row = createRow({
      monthlyReadModel: {
        status: 'paid',
        lastSettlementAtMs: Date.parse('2026-06-10T09:00:00.000Z'),
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 12000,
          dueAmount: 0,
        },
      },
    });

    expect(row.selectedMonthCharges).toBe(12000);
    expect(row.selectedMonthSettled).toBe(12000);
    expect(row.selectedMonthDue).toBe(0);
    expect(row.statusLabel).toBe('Paid');
    expect(row.lastPaymentAtMs).toBe(Date.parse('2026-06-10T09:00:00.000Z'));
  });

  it('marks a partially settled read-model month as partial', () => {
    const row = createRow({
      monthlyReadModel: {
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 4000,
          dueAmount: 8000,
        },
      },
    });

    expect(row.selectedMonthSettled).toBe(4000);
    expect(row.selectedMonthDue).toBe(8000);
    expect(row.statusLabel).toBe('Partial');
    expect(row.followUpPriority).toBe('Medium');
  });

  it('uses fallback grace-period status labels when the read model is missing', () => {
    const currentRow = createRow({
      selectedMonth: '2026-06',
      monthlyReadModel: null,
    });
    const inGraceRow = createRow({
      selectedMonth: '2026-05',
      monthlyReadModel: null,
    });
    const overdueRow = createRow({
      selectedMonth: '2026-04',
      monthlyReadModel: null,
    });

    expect(currentRow.statusLabel).toBe('Current');
    expect(currentRow.followUpPriority).toBe('Low');
    expect(inGraceRow.statusLabel).toBe('In Grace');
    expect(inGraceRow.followUpPriority).toBe('Medium');
    expect(overdueRow.statusLabel).toBe('Overdue');
    expect(overdueRow.followUpPriority).toBe('High');
  });

  it('keeps fallback safe when the read model is missing', () => {
    const row = createRow({
      monthlyReadModel: null,
      receiptMonthPaymentsReceived: 12000,
      settledFromCharges: 4000,
      dueFromCharges: 8000,
    });

    expect(row.selectedMonthSettled).toBe(4000);
    expect(row.selectedMonthDue).toBe(8000);
    expect(row.statusLabel).toBe('Partial');
  });

  it('does not trust read-model paid or advance labels when numeric due remains positive', () => {
    const paidButDueRow = createRow({
      monthlyReadModel: {
        status: 'paid',
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 4000,
          dueAmount: 8000,
        },
      },
    });
    const advanceButDueRow = createRow({
      monthlyReadModel: {
        status: 'advance',
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 0,
          dueAmount: 12000,
        },
      },
    });

    expect(paidButDueRow.statusLabel).toBe('Partial');
    expect(advanceButDueRow.statusLabel).toBe('In Grace');
  });

  it('builds service-month settlement summaries from read models first, then charge fallback', () => {
    const readModelSummary = resolveParentPaymentSettlementSummary({
      chargesCount: 4,
      classCharges: 12000,
      settledFromCharges: 0,
      dueFromCharges: 12000,
      monthlyReadModel: {
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 10000,
          dueAmount: 2000,
        },
      },
    });
    const fallbackSummary = resolveParentPaymentSettlementSummary({
      chargesCount: 4,
      classCharges: 12000,
      settledFromCharges: 4000,
      dueFromCharges: 8000,
      monthlyReadModel: null,
    });

    expect(readModelSummary.selectedMonthSettled).toBe(10000);
    expect(readModelSummary.selectedMonthDue).toBe(2000);
    expect(readModelSummary.settlementSourceLabel).toBe('Monthly read model');
    expect(fallbackSummary.selectedMonthSettled).toBe(4000);
    expect(fallbackSummary.selectedMonthDue).toBe(8000);
    expect(fallbackSummary.settlementSourceLabel).toBe('Charge docs fallback');
  });

  it('builds summary cards from read-model settlement instead of receipt-month payments', () => {
    const partialReadModelRow = createRow({
      parentId: 'parent-a',
      parentName: 'Parent A',
      receiptMonthPaymentsReceived: 12000,
      monthlyReadModel: {
        totals: {
          chargesCount: 4,
          billedAmount: 12000,
          paidAmountFromCharges: 4000,
          dueAmount: 8000,
        },
      },
    });
    const paidReadModelRow = createRow({
      parentId: 'parent-b',
      parentName: 'Parent B',
      receiptMonthPaymentsReceived: 5000,
      monthlyReadModel: {
        totals: {
          chargesCount: 2,
          billedAmount: 6000,
          paidAmountFromCharges: 6000,
          dueAmount: 0,
        },
      },
    });

    const summary = buildParentPaymentsSummaryCards([partialReadModelRow, paidReadModelRow]);

    expect(summary.selectedMonthBilled).toBe(18000);
    expect(summary.selectedMonthSettled).toBe(10000);
    expect(summary.selectedMonthOutstanding).toBe(8000);
    expect(summary.paidParents).toBe(1);
    expect(summary.partialParents).toBe(1);
    expect(summary.followUpParents).toBe(1);
  });
});
