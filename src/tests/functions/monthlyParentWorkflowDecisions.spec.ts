import { describe, expect, it } from 'vitest';
import {
  alreadyReviewedCurrentBilling,
  alreadySentCurrentInvoice,
} from '../../../functions/src/attendanceValidation/monthlyParentWorkflowDecisions';

describe('monthly close workflow idempotency', () => {
  const fingerprint = 'v1:current';

  it('does not repeat an identical billing review mutation', () => {
    expect(alreadyReviewedCurrentBilling({ billingReviewedAt: '2026-10-02', billingReviewedFingerprint: fingerprint }, fingerprint)).toBe(true);
    expect(alreadyReviewedCurrentBilling({ billingReviewedAt: '2026-10-02', billingReviewedFingerprint: 'v1:old' }, fingerprint)).toBe(false);
  });

  it('does not repeat an identical invoice sent mutation', () => {
    expect(alreadySentCurrentInvoice({ invoiceSentAt: '2026-10-02', sentBillingFingerprint: fingerprint }, fingerprint)).toBe(true);
    expect(alreadySentCurrentInvoice({ invoiceSentAt: '2026-10-02', sentBillingFingerprint: 'v1:old' }, fingerprint)).toBe(false);
  });
});
