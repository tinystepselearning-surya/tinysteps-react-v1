import { describe, expect, it } from 'vitest';
import { buildParentPaymentBackfillDryRunReport } from '../../../functions/src/parentPaymentBackfillAudit';
import { createParentPaymentBackfillReportHash } from '../../../functions/src/parentPaymentBackfillHash';
import {
  buildParentPaymentBackfillWritePlan,
  validateParentPaymentBackfillParentIds,
} from '../../../functions/src/parentPaymentBackfillWrite';

const NOW = new Date('2026-06-14T12:00:00+05:30');

const charge = (
  id: string,
  monthKey: string,
  amount: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  data: {
    parentId: 'parent-1',
    monthKey,
    amount,
    date: `${monthKey}-10`,
    createdAt: `${monthKey}-01T10:00:00.000Z`,
    status: 'unpaid',
    ...overrides,
  } as Record<string, unknown>,
});

const payment = (
  id: string,
  amount: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  data: {
    parentId: 'parent-1',
    amount,
    paidAt: '2026-06-20T09:00:00.000Z',
    createdAt: '2026-06-20T09:00:00.000Z',
    allocationModeUsed: 'wallet_only',
    walletTransactionId: `tx-${id}`,
    reference: `ref-${id}`,
    ...overrides,
  },
});

const wallet = (currentBalance: number) => ({
  parentId: 'parent-1',
  data: { currentBalance },
});

const walletTx = (id: string, signedAmount: number) => ({
  id,
  parentId: 'parent-1',
  data: {
    transactionId: id,
    signedAmount,
    createdAt: '2026-06-20T09:00:00.000Z',
  },
});

function buildReport(overrides: Partial<Parameters<typeof buildParentPaymentBackfillDryRunReport>[0]> = {}) {
  return buildParentPaymentBackfillDryRunReport({
    mode: 'dry_run',
    now: NOW,
    payments: [],
    charges: [],
    wallets: [wallet(0)],
    walletTransactions: [],
    monthlyReadModels: [],
    parentProfiles: [{ parentId: 'parent-1', parentName: 'Parent One' }],
    ...overrides,
  });
}

function buildWritePlan(
  overrides: Partial<Parameters<typeof buildParentPaymentBackfillWritePlan>[0]> = {}
) {
  return buildParentPaymentBackfillWritePlan({
    mode: 'write',
    now: NOW,
    parentIds: ['parent-1'],
    maxParents: 5,
    maxPaymentsPerParent: 50,
    payments: [],
    charges: [],
    wallets: [wallet(0)],
    walletTransactions: [],
    monthlyReadModels: [],
    parentProfiles: [{ parentId: 'parent-1', parentName: 'Parent One' }],
    ...overrides,
  });
}

function getParent(report: ReturnType<typeof buildParentPaymentBackfillDryRunReport>) {
  const parent = report.parents.find((item) => item.summary.parentId === 'parent-1');
  expect(parent).toBeTruthy();
  return parent!;
}

function getMonth(
  report: ReturnType<typeof buildParentPaymentBackfillDryRunReport>,
  monthKey: string
) {
  const month = getParent(report).months.find((item) => item.monthKey === monthKey);
  expect(month).toBeTruthy();
  return month!;
}

function applyWritePlanToFixture(
  input: Parameters<typeof buildParentPaymentBackfillWritePlan>[0],
  plan: ReturnType<typeof buildParentPaymentBackfillWritePlan>
) {
  const payments = input.payments.map((item) => ({
    id: item.id,
    data: { ...(item.data || {}) },
    allocationDocs: Array.isArray(item.allocationDocs)
      ? item.allocationDocs.map((doc) => ({ id: doc.id, data: { ...(doc.data || {}) } }))
      : [],
  }));
  const charges = input.charges.map((item) => ({
    id: item.id,
    data: { ...(item.data || {}) },
  }));

  plan.parentPlans.forEach((parentPlan) => {
    parentPlan.paymentPatches.forEach((paymentPatch) => {
      const payment = payments.find((item) => item.id === paymentPatch.paymentId);
      if (!payment) return;
      payment.data = { ...payment.data, ...paymentPatch.data };
      payment.allocationDocs = parentPlan.allocationDocPatches
        .filter((allocation) => allocation.paymentId === paymentPatch.paymentId)
        .map((allocation) => ({
          id: allocation.allocationDocId,
          data: { ...allocation.data },
        }));
    });
    parentPlan.chargePatches.forEach((chargePatch) => {
      const charge = charges.find((item) => item.id === chargePatch.chargeId);
      if (!charge) return;
      charge.data = {
        ...charge.data,
        ...chargePatch.data,
        lastAllocatedAt: chargePatch.lastAllocatedAtIso,
      };
      if (chargePatch.clearPaidAt) delete charge.data.paidAt;
      else charge.data.paidAt = chargePatch.paidAtIso;
    });
  });

  return {
    ...input,
    payments,
    charges,
  };
}

describe('buildParentPaymentBackfillDryRunReport', () => {
  it('replays an old wallet_only payment into the oldest dues first without mutating source data', () => {
    const sourceCharge = charge('may-charge', '2026-05', 12000);
    const report = buildReport({
      payments: [payment('payment-1', 16000)],
      charges: [sourceCharge, charge('june-charge', '2026-06', 4000)],
      wallets: [wallet(16000)],
      walletTransactions: [walletTx('tx-payment-1', 16000)],
    });

    expect(getMonth(report, '2026-05')).toMatchObject({
      dryRunSettledAmount: 12000,
      dryRunDueAmount: 0,
    });
    expect(getMonth(report, '2026-06')).toMatchObject({
      dryRunSettledAmount: 4000,
      dryRunDueAmount: 0,
    });
    expect(getParent(report).payments[0].allocationRows).toHaveLength(2);
    expect(sourceCharge.data.paidAmount).toBeUndefined();
    expect(sourceCharge.data.outstandingAmount).toBeUndefined();
  });

  it('keeps residual due on a partial old wallet_only payment', () => {
    const report = buildReport({
      payments: [payment('payment-1', 10000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(10000)],
      walletTransactions: [walletTx('tx-payment-1', 10000)],
    });

    expect(getMonth(report, '2026-05')).toMatchObject({
      dryRunSettledAmount: 10000,
      dryRunDueAmount: 2000,
    });
  });

  it('keeps excess replayed money as advance when payment exceeds outstanding dues', () => {
    const report = buildReport({
      payments: [payment('payment-1', 15000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(15000)],
      walletTransactions: [walletTx('tx-payment-1', 15000)],
    });

    expect(getParent(report).summary.totalWouldAllocate).toBe(12000);
    expect(getParent(report).summary.totalWouldRemainAdvance).toBe(3000);
    expect(getParent(report).payments[0].dryRunAdvanceAmount).toBe(3000);
  });

  it('classifies an already allocated FIFO payment and does not replay it', () => {
    const report = buildReport({
      payments: [
        payment('payment-1', 12000, {
          allocationModeUsed: 'fifo_then_wallet',
          allocatedAmount: 12000,
          allocations: [{ chargeId: 'may-charge', amount: 12000, monthKey: '2026-05' }],
        }),
      ],
      charges: [charge('may-charge', '2026-05', 12000, { paidAmount: 12000, status: 'paid' })],
      wallets: [wallet(0)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    expect(getParent(report).payments[0].classification).toBe('new_fifo_allocated');
    expect(getParent(report).payments[0].dryRunAllocatedAmount).toBe(12000);
    expect(getParent(report).summary.totalWouldAllocate).toBe(0);
  });

  it('classifies legacy applied payments without blindly replaying them', () => {
    const report = buildReport({
      payments: [
        payment('payment-1', 12000, {
          allocationModeUsed: null,
          appliedAmount: 12000,
          appliedChargeIds: ['may-charge'],
          appliedAllocations: [{ chargeId: 'may-charge', amount: 12000 }],
        }),
      ],
      charges: [charge('may-charge', '2026-05', 12000, { paidAmount: 12000, status: 'paid' })],
      wallets: [wallet(0)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    expect(getParent(report).payments[0].classification).toBe('legacy_allocated');
    expect(getParent(report).summary.totalWouldAllocate).toBe(0);
  });

  it('ignores archived and voided charges during replay allocation', () => {
    const report = buildReport({
      payments: [payment('payment-1', 5000)],
      charges: [
        charge('void-charge', '2026-05', 5000, { status: 'void' }),
        charge('archived-charge', '2026-05', 5000, { archived: true }),
        charge('active-charge', '2026-05', 5000),
      ],
      wallets: [wallet(5000)],
      walletTransactions: [walletTx('tx-payment-1', 5000)],
    });

    expect(getParent(report).payments[0].allocationRows).toEqual([
      {
        chargeId: 'active-charge',
        chargeMonthKey: '2026-05',
        previousPaidAmount: 0,
        allocationAmount: 5000,
        remainingDueAfter: 0,
      },
    ]);
  });

  it('flags duplicate suspect payments', () => {
    const report = buildReport({
      payments: [
        payment('payment-1', 5000, {
          paidAt: '2026-06-20T09:00:00.000Z',
          reference: 'same-ref',
        }),
        payment('payment-2', 5000, {
          paidAt: '2026-06-20T10:00:00.000Z',
          reference: 'same-ref',
        }),
      ],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(10000)],
      walletTransactions: [walletTx('tx-payment-1', 5000), walletTx('tx-payment-2', 5000)],
    });

    expect(getParent(report).payments.map((item) => item.classification)).toEqual([
      'duplicate_suspect',
      'duplicate_suspect',
    ]);
  });

  it('flags impossible charge states', () => {
    const report = buildReport({
      charges: [
        charge('bad-charge', '2026-05', 12000, {
          paidAmount: 13000,
          outstandingAmount: 0,
          status: 'paid',
        }),
      ],
    });

    expect(getParent(report).anomalies.some((item) => item.code === 'CHARGE_OVERPAID')).toBe(true);
    expect(getParent(report).summary.recommendedAction).toBe('blocked_due_to_drift');
  });

  it('blocks backfill when wallet ledger drift exists', () => {
    const report = buildReport({
      payments: [payment('payment-1', 5000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(5000)],
      walletTransactions: [walletTx('tx-payment-1', 4000)],
    });

    expect(getParent(report).summary.walletDrift).toBe(1000);
    expect(getParent(report).summary.recommendedAction).toBe('blocked_due_to_drift');
  });
});

describe('buildParentPaymentBackfillWritePlan', () => {
  it('builds a safe full backfill without changing wallet balances or wallet transactions', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 16000)],
      charges: [charge('may-charge', '2026-05', 12000), charge('june-charge', '2026-06', 4000)],
      wallets: [wallet(16000)],
      walletTransactions: [walletTx('tx-payment-1', 16000)],
    });

    const parentPlan = plan.parentPlans[0];
    expect(parentPlan.status).toBe('apply');
    expect(parentPlan.paymentPatches[0].data.allocatedAmount).toBe(16000);
    expect(parentPlan.paymentPatches[0].data.unallocatedAmount).toBe(0);
    expect(parentPlan.allocationDocPatches).toHaveLength(2);
    expect(parentPlan.chargePatches.map((item) => item.data.paidAmount)).toEqual([4000, 12000]);
    expect(plan.writeSafety.changesWalletBalances).toBe(false);
    expect(plan.writeSafety.createsWalletTransactions).toBe(false);
  });

  it('builds a partial backfill target and leaves the remaining due on the charge', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 10000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(10000)],
      walletTransactions: [walletTx('tx-payment-1', 10000)],
    });

    expect(plan.parentPlans[0].paymentPatches[0].data.allocatedAmount).toBe(10000);
    expect(plan.parentPlans[0].chargePatches[0]).toMatchObject({
      chargeId: 'may-charge',
      data: {
        paidAmount: 10000,
        outstandingAmount: 2000,
        status: 'partial',
      },
      clearPaidAt: true,
    });
  });

  it('keeps overpayment as advance without changing wallet state', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 15000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(15000)],
      walletTransactions: [walletTx('tx-payment-1', 15000)],
    });

    expect(plan.parentPlans[0].paymentPatches[0].data.allocatedAmount).toBe(12000);
    expect(plan.parentPlans[0].paymentPatches[0].data.advanceAmount).toBe(3000);
    expect(plan.beforeReport.parents[0].summary.existingWalletBalance).toBe(15000);
    expect(plan.afterReport.parents[0].summary.existingWalletBalance).toBe(15000);
  });

  it('is idempotent on rerun after applying the first write plan', () => {
    const firstInput = {
      mode: 'write' as const,
      now: NOW,
      parentIds: ['parent-1'],
      maxParents: 5,
      maxPaymentsPerParent: 50,
      payments: [payment('payment-1', 16000)],
      charges: [charge('may-charge', '2026-05', 12000), charge('june-charge', '2026-06', 4000)],
      wallets: [wallet(16000)],
      walletTransactions: [walletTx('tx-payment-1', 16000)],
      monthlyReadModels: [],
      parentProfiles: [{ parentId: 'parent-1', parentName: 'Parent One' }],
    };
    const firstPlan = buildParentPaymentBackfillWritePlan(firstInput);
    const secondInput = applyWritePlanToFixture(firstInput, firstPlan);
    const secondPlan = buildParentPaymentBackfillWritePlan(secondInput);

    expect(secondPlan.parentPlans[0].status).toBe('skip');
    expect(secondPlan.parentPlans[0].paymentPatches).toHaveLength(0);
    expect(secondPlan.parentPlans[0].chargePatches).toHaveLength(0);
    expect(secondPlan.beforeReport.parents[0].summary.recommendedAction).toBe('already_current');
  });

  it('blocks unsafe parents with wallet drift before any writes are planned', () => {
    expect(() =>
      buildWritePlan({
        payments: [payment('payment-1', 5000)],
        charges: [charge('may-charge', '2026-05', 12000)],
        wallets: [wallet(5000)],
        walletTransactions: [walletTx('tx-payment-1', 4000)],
      })
    ).toThrow(/wallet drift/i);
  });

  it('blocks duplicate suspect parents before writes', () => {
    expect(() =>
      buildWritePlan({
        payments: [
          payment('payment-1', 5000, {
            paidAt: '2026-06-20T09:00:00.000Z',
            reference: 'same-ref',
          }),
          payment('payment-2', 5000, {
            paidAt: '2026-06-20T10:00:00.000Z',
            reference: 'same-ref',
          }),
        ],
        charges: [charge('may-charge', '2026-05', 12000)],
        wallets: [wallet(10000)],
        walletTransactions: [walletTx('tx-payment-1', 5000), walletTx('tx-payment-2', 5000)],
      })
    ).toThrow(/blocked payment|duplicate_suspect/i);
  });

  it('blocks mixed-schema parents before writes', () => {
    expect(() =>
      buildWritePlan({
        payments: [
          payment('payment-1', 12000, {
            allocationModeUsed: 'fifo_then_wallet',
            allocatedAmount: 5000,
          }),
        ],
        charges: [charge('may-charge', '2026-05', 12000)],
        wallets: [wallet(12000)],
        walletTransactions: [walletTx('tx-payment-1', 12000)],
      })
    ).toThrow(/anomalies|blocked payment|not safe to backfill/i);
  });

  it('skips already current parents without rewriting them', () => {
    const plan = buildWritePlan({
      payments: [
        payment('payment-1', 12000, {
          allocationModeUsed: 'fifo_then_wallet',
          allocatedAmount: 12000,
          allocations: [{ chargeId: 'may-charge', amount: 12000, monthKey: '2026-05' }],
        }),
      ],
      charges: [charge('may-charge', '2026-05', 12000, { paidAmount: 12000, status: 'paid' })],
      wallets: [wallet(12000)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    expect(plan.parentPlans[0].status).toBe('skip');
    expect(plan.parentPlans[0].paymentPatches).toHaveLength(0);
  });

  it('updates the impacted service-month read-model outcome after backfill', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 12000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(12000)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    const beforeMonth = getMonth(plan.beforeReport, '2026-05');
    const afterMonth = getMonth(plan.afterReport, '2026-05');

    expect(beforeMonth.statusBefore).toBe('in_grace');
    expect(afterMonth.statusBefore).toBe('advance');
    expect(afterMonth.existingSettledAmount).toBe(12000);
    expect(afterMonth.existingDueAmount).toBe(0);
  });

  it('keeps before and after summaries needed for run logging', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 12000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(12000)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    expect(plan.writeSafety).toMatchObject({
      changesWalletBalances: false,
      createsWalletTransactions: false,
    });
    expect(plan.beforeReport.parents[0].summary.totalWouldAllocate).toBe(12000);
    expect(plan.afterReport.parents[0].summary.recommendedAction).toBe('already_current');
    expect(plan.parentPlans[0].paymentsBackfilled).toEqual(['payment-1']);
  });

  it('normalizes report hashes deterministically across generated timestamps and array order', () => {
    const report = buildReport({
      payments: [payment('payment-2', 4000), payment('payment-1', 8000)],
      charges: [charge('june-charge', '2026-06', 4000), charge('may-charge', '2026-05', 8000)],
      wallets: [wallet(12000)],
      walletTransactions: [walletTx('tx-payment-1', 8000), walletTx('tx-payment-2', 4000)],
    });

    const reordered = {
      ...report,
      generatedAtMs: report.generatedAtMs + 9999,
      parents: [...report.parents].reverse().map((parent) => ({
        ...parent,
        months: [...parent.months].reverse(),
        payments: [...parent.payments].reverse(),
      })),
    };

    expect(createParentPaymentBackfillReportHash(reordered)).toBe(
      createParentPaymentBackfillReportHash(report)
    );
  });

  it('validates parent ids before write mode planning', () => {
    expect(validateParentPaymentBackfillParentIds([' parent-1 ', 'parent-1'])).toEqual([
      'parent-1',
    ]);
    expect(() => validateParentPaymentBackfillParentIds(['bad/id'])).toThrow(/invalid parentid/i);
  });

  it('captures source verification snapshots for transaction-time rechecks', () => {
    const plan = buildWritePlan({
      payments: [payment('payment-1', 12000)],
      charges: [charge('may-charge', '2026-05', 12000)],
      wallets: [wallet(12000)],
      walletTransactions: [walletTx('tx-payment-1', 12000)],
    });

    expect(plan.parentPlans[0].paymentPatches[0].sourceVerification).toMatchObject({
      parentId: 'parent-1',
      amount: 12000,
      allocationModeUsed: 'wallet_only',
    });
    expect(plan.parentPlans[0].chargePatches[0].sourceVerification).toMatchObject({
      parentId: 'parent-1',
      amount: 12000,
      monthKey: '2026-05',
      status: 'unpaid',
    });
  });
});
