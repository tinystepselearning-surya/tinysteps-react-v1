import { describe, expect, it } from 'vitest';
import { diagnosePresentSessionBilling } from '../src/financeReconciliationReport';

describe('present session billing diagnostics', () => {
  it('reports a completed present session with valid linkage and fee but no charge as billable', () => {
    const diagnostic = diagnosePresentSessionBilling({
      sessionId: 'anaisha-2026-07-17',
      session: {
        status: 'completed',
        date: '2026-07-17',
        enrollmentId: 'enrollment-1',
        kidId: 'anaisha',
        attendance: { anaisha: { status: 'present' } },
      },
      enrollment: { parentId: 'parent-1', feePerSession: 900 },
      enrollmentExists: true,
      activeChargeExists: false,
    });

    expect(diagnostic).toMatchObject({
      sessionId: 'anaisha-2026-07-17',
      serviceDate: '2026-07-17',
      fee: 900,
      billable: true,
      reasons: ['charge_missing_or_void'],
    });
  });

  it('explains why a present session cannot safely be billed', () => {
    const diagnostic = diagnosePresentSessionBilling({
      sessionId: 'session-1',
      session: {
        status: 'completed',
        date: '2026-07-17',
        kidId: 'kid-1',
        attendance: { 'kid-1': 'present' },
        revenueSuppressed: true,
      },
      enrollment: null,
      enrollmentExists: false,
      activeChargeExists: false,
    });

    expect(diagnostic?.reasons).toEqual([
      'suppressed_revenue',
      'missing_enrollment',
      'missing_parent',
      'zero_or_unresolved_fee',
      'charge_missing_or_void',
    ]);
    expect(diagnostic?.billable).toBe(false);
  });

  it('ignores non-completed or non-present sessions', () => {
    expect(diagnosePresentSessionBilling({
      sessionId: 'session-1',
      session: { status: 'scheduled', attendance: { kid: 'present' } },
      enrollment: { parentId: 'parent-1', feePerSession: 900 },
      enrollmentExists: true,
      activeChargeExists: false,
    })).toBeNull();
  });
});
