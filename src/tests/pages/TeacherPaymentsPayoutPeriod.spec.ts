import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(join(process.cwd(), 'src/pages/admin/TeacherPayments.tsx'), 'utf8');

describe('Brick 5 Teacher Payments payout periods', () => {
  it('uses the versioned payout callable and never fabricates the payment date from earning month', () => {
    expect(source).toContain("httpsCallable(functions, 'recordTeacherPayoutV2')");
    expect(source).toContain('buildTeacherPayoutV2Request');
    expect(source).not.toContain('const paidAt = `${payoutMonth}-01`;');
  });

  it('shows separate earning month and actual payment date inputs', () => {
    expect(source).toContain('Earning Month');
    expect(source).toContain('Earning month');
    expect(source).toContain('Actual payment date');
    expect(source).toContain('type="date"');
    expect(source).toContain('Cash date is recorded separately and does not change the earning month.');
  });

  it('renders Brick 4 net entitlement rather than stale raw settled earning amounts', () => {
    expect(source).toContain('resolveTeacherNetEntitlementAmount(earning)');
    expect(source).toContain('resolveTeacherPaymentStatusLabel');
    expect(source).toContain('Net Entitlement');
    expect(source).toContain('Net entitlement');
  });

  it('renders entitlement, carry, actual cash, and pending separately', () => {
    expect(source).toContain('Carry Applied');
    expect(source).toContain('Cash Paid');
    expect(source).toContain('Actual cash amount (₹)');
    expect(source).toContain('resolveTeacherOffsetAppliedAmount');
  });
});
