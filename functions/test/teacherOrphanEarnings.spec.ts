import { describe, expect, it } from 'vitest';
import { evaluateTeacherOrphanEarning } from '../src/helpers/teacherOrphanEarnings';

describe('B6 Brick 4 teacher orphan earning safety', () => {
  it('keeps completed present sessions billable', () => {
    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'session-1', kidId: 'kid-1', amount: 175, status: 'unpaid' },
        sessionExists: true,
        sessionData: {
          status: 'completed',
          attendance: { 'kid-1': { status: 'present' } },
        },
      }),
    ).toEqual({ orphan: false, voidable: false, skipReason: 'billable_session' });
  });

  it('marks a missing session earning as voidable only when unpaid', () => {
    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'missing-session', amount: 175, status: 'unpaid' },
        sessionExists: false,
        sessionData: null,
      }),
    ).toEqual({ orphan: true, voidable: true, skipReason: null });
  });

  it('never voids paid or settled orphan earnings', () => {
    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'missing-session', amount: 175, status: 'paid' },
        sessionExists: false,
        sessionData: null,
      }),
    ).toEqual({ orphan: true, voidable: false, skipReason: 'paid_or_settled' });

    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'missing-session', amount: 175, status: 'unpaid', paidAmount: 50 },
        sessionExists: false,
        sessionData: null,
      }),
    ).toEqual({ orphan: true, voidable: false, skipReason: 'paid_or_settled' });
  });

  it('preserves already-void and non-session-linked rows', () => {
    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'session-1', amount: 175, status: 'void' },
        sessionExists: false,
        sessionData: null,
      }),
    ).toEqual({ orphan: false, voidable: false, skipReason: 'already_void' });

    expect(
      evaluateTeacherOrphanEarning({
        earning: { source: 'demo_completed', amount: 100, status: 'unpaid' },
        sessionExists: false,
        sessionData: null,
      }),
    ).toEqual({ orphan: false, voidable: false, skipReason: 'not_session_linked' });
  });

  it('preserves the existing any-present attendance semantics for tracked attendance maps', () => {
    expect(
      evaluateTeacherOrphanEarning({
        earning: { sessionId: 'session-1', kidId: 'kid-1', amount: 175, status: 'unpaid' },
        sessionExists: true,
        sessionData: {
          status: 'completed',
          attendance: {
            'kid-1': { status: 'absent' },
            'kid-2': { status: 'present' },
          },
        },
      }),
    ).toEqual({ orphan: false, voidable: false, skipReason: 'billable_session' });
  });
});
