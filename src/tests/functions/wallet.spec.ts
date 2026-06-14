import * as admin from 'firebase-admin';
import { describe, expect, it } from 'vitest';
import { buildParentPaymentAllocationPlan } from '../../../functions/src/parentPaymentAllocator';
import {
  applyReceiveParentPaymentWithPreparedState,
  buildExistingReceiveParentPaymentReplayResult,
  prepareAppendWalletTransactionState,
  shouldSkipWalletChargeDeductionSync,
} from '../../../functions/src/wallet';

type SetCall = {
  path: string;
  data: Record<string, unknown>;
  options?: Record<string, unknown>;
};

const createDocRef = (path: string): any => {
  const segments = path.split('/');
  const id = segments[segments.length - 1];
  return {
    id,
    path,
    collection: (name: string) => ({
      doc: (nextId: string) => createDocRef(`${path}/${name}/${nextId}`),
    }),
  };
};

const createWriteOnlyTx = (calls: SetCall[]) =>
  ({
    set: (ref: { path: string }, data: Record<string, unknown>, options?: Record<string, unknown>) => {
      calls.push({ path: ref.path, data, options });
      return undefined;
    },
  }) as any;

const createChargeEntry = (
  id: string,
  monthKey: string,
  amount: number,
  overrides: Record<string, unknown> = {}
) => ({
  id,
  ref: createDocRef(`billingCharges/${id}`),
  data: {
    parentId: 'parent-1',
    monthKey,
    amount,
    createdAt: `${monthKey}-01T10:00:00.000Z`,
    date: `${monthKey}-10`,
    status: 'unpaid',
    ...overrides,
  } as Record<string, unknown>,
});

describe('adminReceiveParentPayment write helpers', () => {
  it('applies preview-equivalent FIFO payment writes without performing transaction reads', () => {
    const calls: SetCall[] = [];
    const tx = createWriteOnlyTx(calls);
    const paymentRef = createDocRef('payments/payment-1');
    const rollupRef = createDocRef('adminStats/revenueMonthly/months/2026-06');
    const walletRef = createDocRef('parentWallets/parent-1');
    const walletTxRef = createDocRef(
      'parentWallets/parent-1/transactions/tx_receive_parent_payment_wallet_req_1'
    );
    const preparedWalletState = prepareAppendWalletTransactionState(
      walletRef,
      walletTxRef,
      { exists: false, data: () => undefined } as any,
      { exists: false, id: walletTxRef.id, data: () => undefined } as any
    );
    const chargeEntries = [
      createChargeEntry('charge-may', '2026-05', 6800),
      createChargeEntry('charge-june', '2026-06', 4000, { archived: true }),
    ];
    const plan = buildParentPaymentAllocationPlan(
      chargeEntries.map((entry) => ({ id: entry.id, data: entry.data })),
      6800
    );
    const stage = { current: 'start' };

    const result = applyReceiveParentPaymentWithPreparedState({
      tx,
      paymentRef,
      rollupRef,
      parentId: 'parent-1',
      amount: 6800,
      allocationModeUsed: 'fifo_then_wallet',
      paidAt: admin.firestore.Timestamp.fromDate(new Date('2026-06-03T00:00:00+05:30')),
      dateKey: '2026-06-03',
      monthKey: '2026-06',
      method: 'UPI',
      note: null,
      reference: 'ref-6800',
      idempotencyKey: 'req_1',
      createdBy: 'admin-1',
      migration: {
        walletRef,
        walletExists: false,
        walletCurrentBalance: 0,
        openingDeficit: 0,
        migratedByOpeningDeficit: false,
        openingDeficitTransactionFound: false,
        warnings: [],
      },
      warnings: [],
      chargeEntries,
      plan,
      preparedWalletState,
      walletTopupIdempotencyKey: 'receive_parent_payment_wallet_req_1',
      stage,
    });

    expect(result).toMatchObject({
      paymentId: 'payment-1',
      idempotentReplay: false,
      amountReceived: 6800,
      allocatedAmount: 6800,
      unallocatedAmount: 0,
      advanceAmount: 0,
      walletTransactionId: 'tx_receive_parent_payment_wallet_req_1',
      walletBalanceAfter: 6800,
    });
    expect(stage.current).toBe('complete');

    const chargeWrite = calls.find((call) => call.path === 'billingCharges/charge-may');
    expect(chargeWrite?.data).toMatchObject({
      paidAmount: 6800,
      outstandingAmount: 0,
      status: 'paid',
      lastPaymentId: 'payment-1',
      lastAllocationReceiptMonthKey: '2026-06',
    });

    const walletTransactionWrite = calls.find((call) => call.path === walletTxRef.path);
    expect(walletTransactionWrite?.data).toMatchObject({
      parentId: 'parent-1',
      type: 'topup',
      direction: 'credit',
      amount: 6800,
      idempotencyKey: 'receive_parent_payment_wallet_req_1',
      sourceSystem: 'admin_receive_parent_payment',
    });

    const paymentWrite = calls.find((call) => call.path === 'payments/payment-1');
    expect(paymentWrite?.data).toMatchObject({
      parentId: 'parent-1',
      amount: 6800,
      allocationModeUsed: 'fifo_then_wallet',
      allocatedAmount: 6800,
      unallocatedAmount: 0,
      advanceAmount: 0,
      walletCreditedAmount: 6800,
      walletTransactionId: 'tx_receive_parent_payment_wallet_req_1',
    });

    const allocationWrites = calls.filter((call) =>
      call.path.startsWith('payments/payment-1/allocations/')
    );
    expect(allocationWrites).toHaveLength(1);
    expect(allocationWrites[0].data).toMatchObject({
      parentId: 'parent-1',
      paymentId: 'payment-1',
      chargeId: 'charge-may',
      amount: 6800,
      source: 'adminReceiveParentPayment',
    });

    const rollupWrites = calls.filter((call) => call.path === rollupRef.path);
    expect(rollupWrites).toHaveLength(1);
  });

  it('replays an existing receive-parent-payment doc safely for the same idempotency key', () => {
    const replay = buildExistingReceiveParentPaymentReplayResult({
      existing: {
        parentId: 'parent-1',
        amount: 6800,
        idempotencyKey: 'req_1',
        sourceSystem: 'admin_receive_parent_payment',
        allocationModeUsed: 'fifo_then_wallet',
        allocatedAmount: 6800,
        unallocatedAmount: 0,
        chargesScanned: 30,
        chargesIncluded: 23,
        allocations: [
          {
            sequence: 1,
            chargeId: 'charge-may',
            monthKey: '2026-05',
            eventDateKey: '2026-05-10',
            chargeAmount: 6800,
            previousPaidAmount: 0,
            outstandingBefore: 6800,
            allocatedAmount: 6800,
            remainingDueAfter: 0,
            enrollmentId: null,
            kidId: null,
            courseId: null,
            studentName: null,
            classSessionId: null,
          },
        ],
        walletTransactionId: 'tx_receive_parent_payment_wallet_req_1',
        walletBalanceAfter: 6800,
      },
      parentId: 'parent-1',
      amount: 6800,
      idempotencyKey: 'req_1',
      allocationModeUsed: 'fifo_then_wallet',
      migration: {
        walletRef: createDocRef('parentWallets/parent-1'),
        walletExists: true,
        walletCurrentBalance: 6800,
        openingDeficit: 0,
        migratedByOpeningDeficit: false,
        openingDeficitTransactionFound: false,
        warnings: [],
      },
      warnings: [],
      paymentId: 'payment-1',
    });

    expect(replay).toMatchObject({
      paymentId: 'payment-1',
      idempotentReplay: true,
      amountReceived: 6800,
      allocatedAmount: 6800,
      unallocatedAmount: 0,
      walletTransactionId: 'tx_receive_parent_payment_wallet_req_1',
    });
  });

  it('rejects conflicting reuse of a receive-parent-payment idempotency key', () => {
    expect(() =>
      buildExistingReceiveParentPaymentReplayResult({
        existing: {
          parentId: 'parent-1',
          amount: 6800,
          idempotencyKey: 'req_1',
          sourceSystem: 'admin_receive_parent_payment',
        },
        parentId: 'parent-1',
        amount: 7000,
        idempotencyKey: 'req_1',
        allocationModeUsed: 'fifo_then_wallet',
        migration: {
          walletRef: createDocRef('parentWallets/parent-1'),
          walletExists: true,
          walletCurrentBalance: 6800,
          openingDeficit: 0,
          migratedByOpeningDeficit: false,
          openingDeficitTransactionFound: false,
          warnings: [],
        },
        warnings: [],
        paymentId: 'payment-1',
      })
    ).toThrow(/idempotencykey already used/i);
  });
});

describe('wallet billing charge trigger guards', () => {
  it('skips settlement-only billing charge updates', () => {
    expect(
      shouldSkipWalletChargeDeductionSync(
        {
          parentId: 'parent-1',
          amount: '12000',
          status: 'unpaid',
          monthKey: '2026-06',
          date: '2026-06-10',
          paidAmount: 0,
          outstandingAmount: 12000,
        },
        {
          parentId: 'parent-1',
          amount: '12000',
          status: 'unpaid',
          monthKey: '2026-06',
          date: '2026-06-10',
          paidAmount: '12000',
          outstandingAmount: '0',
          paidAt: '2026-06-20T09:00:00.000Z',
          lastPaymentId: 'payment-1',
          paymentIds: ['payment-1'],
          lastAllocationRef: 'payments/payment-1/allocations/0001',
        }
      )
    ).toBe(true);
  });

  it('does not skip new eligible charges or material fee changes', () => {
    expect(
      shouldSkipWalletChargeDeductionSync(null, {
        parentId: 'parent-1',
        amount: 12000,
        status: 'unpaid',
        monthKey: '2026-06',
        date: '2026-06-10',
      })
    ).toBe(false);

    expect(
      shouldSkipWalletChargeDeductionSync(
        {
          parentId: 'parent-1',
          amount: 12000,
          status: 'unpaid',
          monthKey: '2026-06',
          date: '2026-06-10',
        },
        {
          parentId: 'parent-1',
          amount: 14000,
          status: 'unpaid',
          monthKey: '2026-06',
          date: '2026-06-10',
        }
      )
    ).toBe(false);
  });
});
