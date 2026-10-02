import { describe, expect, it } from 'vitest';
import {
  buildParentMonthCloseBillingFingerprint,
  deriveParentMonthCloseNextAction,
  parentMonthCloseBillingSnapshot,
  parentMonthClosePaymentLabel,
} from '../../lib/parentMonthClose';

describe('Parent Month Close derived workflow', () => {
  const billing = parentMonthCloseBillingSnapshot({
    parentId: 'parent-1',
    monthKey: '2026-09',
    attendance: {
      sourceSessionCount: 17,
      totals: { totalSessions: 17 },
    },
    billedClassCount: 3,
    billedAmount: 1125,
    settledAmount: 0,
    dueAmount: 1125,
    chargeIds: ['charge-3', 'charge-1', 'charge-2'],
  });

  it('derives billing and payment facts from the canonical parent-month read model', () => {
    expect(billing).toMatchObject({
      parentId: 'parent-1',
      monthKey: '2026-09',
      sessionCount: 17,
      billedClassCount: 3,
      billedAmount: 1125,
      settledAmount: 0,
      dueAmount: 1125,
      chargeIds: ['charge-1', 'charge-2', 'charge-3'],
    });
    expect(parentMonthClosePaymentLabel(billing)).toBe('Unpaid');
  });

  it('keeps billing fingerprints stable across charge-id ordering and payment changes', () => {
    const left = buildParentMonthCloseBillingFingerprint({
      billedClassCount: 3,
      billedAmount: 1125,
      chargeIds: ['charge-3', 'charge-1', 'charge-2'],
    });
    const right = buildParentMonthCloseBillingFingerprint({
      billedClassCount: 3,
      billedAmount: 1125,
      chargeIds: ['charge-2', 'charge-3', 'charge-1'],
    });
    expect(left).toBe(right);
    expect(left).toBe(billing.fingerprint);
    expect(parentMonthCloseBillingSnapshot({ ...billing, settledAmount: 500, dueAmount: 625 }).fingerprint).toBe(left);
    expect(buildParentMonthCloseBillingFingerprint({ billedClassCount: 3, billedAmount: 1125, chargeIds: ['charge-1', 'charge-2', 'charge-4'] })).not.toBe(left);
  });

  it('requires only the essential human workflow decisions', () => {
    expect(deriveParentMonthCloseNextAction({
      progress: { status: 'not_started' },
      billing,
    })).toBe('review_attendance');

    expect(deriveParentMonthCloseNextAction({
      progress: { status: 'in_progress' },
      billing,
    })).toBe('continue_attendance');

    expect(deriveParentMonthCloseNextAction({
      progress: { status: 'completed' },
      billing,
    })).toBe('review_billing');

    expect(deriveParentMonthCloseNextAction({
      progress: {
        status: 'completed',
        billingReviewedAt: '2026-10-02T08:00:00.000Z',
        billingReviewedFingerprint: billing.fingerprint,
      },
      billing,
    })).toBe('send_invoice');

    expect(deriveParentMonthCloseNextAction({
      progress: {
        status: 'completed',
        billingReviewedAt: '2026-10-02T08:00:00.000Z',
        billingReviewedFingerprint: billing.fingerprint,
        invoiceSentAt: '2026-10-02T09:00:00.000Z',
        sentBillingFingerprint: billing.fingerprint,
      },
      billing,
    })).toBe('await_payment');
  });

  it('derives partial, paid and stale-invoice states without additional workflow writes', () => {
    const partial = { ...billing, settledAmount: 500, dueAmount: 625 };
    const paid = { ...billing, settledAmount: 1125, dueAmount: 0 };
    const progress = {
      status: 'completed' as const,
      billingReviewedAt: '2026-10-02T08:00:00.000Z',
      billingReviewedFingerprint: billing.fingerprint,
      invoiceSentAt: '2026-10-02T09:00:00.000Z',
      sentBillingFingerprint: billing.fingerprint,
    };

    expect(deriveParentMonthCloseNextAction({ progress, billing: partial }))
      .toBe('partial_payment');
    expect(parentMonthClosePaymentLabel(partial)).toBe('Partial');

    expect(deriveParentMonthCloseNextAction({ progress, billing: paid }))
      .toBe('closed');
    expect(parentMonthClosePaymentLabel(paid)).toBe('Paid');

    const changedBilling = {
      ...billing,
      billedClassCount: 2,
      billedAmount: 750,
      dueAmount: 750,
      fingerprint: buildParentMonthCloseBillingFingerprint({
        billedClassCount: 2,
        billedAmount: 750,
        chargeIds: ['charge-1', 'charge-2'],
      }),
    };
    expect(deriveParentMonthCloseNextAction({
      progress: {
        ...progress,
        billingReviewedFingerprint: changedBilling.fingerprint,
      },
      billing: changedBilling,
    })).toBe('send_revised_invoice');
  });

  it('closes a reviewed zero-charge month without an invoice or payment write', () => {
    const noCharge = {
      ...billing,
      billedClassCount: 0,
      billedAmount: 0,
      settledAmount: 0,
      dueAmount: 0,
      fingerprint: buildParentMonthCloseBillingFingerprint({
        billedClassCount: 0,
        billedAmount: 0,
        chargeIds: [],
      }),
    };
    expect(deriveParentMonthCloseNextAction({
      progress: {
        status: 'completed',
        billingReviewedAt: '2026-10-02T08:00:00.000Z',
        billingReviewedFingerprint: noCharge.fingerprint,
      },
      billing: noCharge,
    })).toBe('closed_no_charge');
  });
});
