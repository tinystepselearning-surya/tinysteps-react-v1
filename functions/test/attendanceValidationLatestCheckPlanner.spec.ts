import { describe, expect, it } from 'vitest';
import {
  AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS,
  normalizeAvsLatestCheckRange,
  planAvsLatestCheck,
} from '../src/attendanceValidation/latestCheckPlanner';

describe('AVS latest-check planner', () => {
  it('accepts one calendar month while enforcing the permanent lower bound', () => {
    expect(normalizeAvsLatestCheckRange('2026-09-01', '2026-09-30')).toEqual({
      fromDate: '2026-09-01',
      toDate: '2026-09-30',
    });
    expect(() =>
      normalizeAvsLatestCheckRange('2026-08-31', '2026-09-01'),
    ).toThrow('cannot be before 2026-09-01');
  });

  it('caps a latest-check range at 31 calendar days', () => {
    expect(normalizeAvsLatestCheckRange('2026-10-01', '2026-10-31')).toEqual({
      fromDate: '2026-10-01',
      toDate: '2026-10-31',
    });
    expect(() =>
      normalizeAvsLatestCheckRange('2026-09-01', '2026-10-02'),
    ).toThrow('at most 31 calendar days');
  });

  it('rejects malformed or backwards dates', () => {
    expect(() => normalizeAvsLatestCheckRange('2026-09-31', '2026-10-01'))
      .toThrow('real calendar date');
    expect(() => normalizeAvsLatestCheckRange('2026-09-10', '2026-09-01'))
      .toThrow('cannot be before fromDate');
  });

  it('revalidates only dirty sessions that already have cached evidence', () => {
    expect(planAvsLatestCheck(
      [
        { sessionId: 'session-a', serviceDateYmd: '2026-09-10' },
        { sessionId: 'session-b', serviceDateYmd: '2026-09-10' },
        { sessionId: 'session-c', serviceDateYmd: '2026-09-10' },
      ],
      [
        { sessionId: 'session-a', caseExists: true, evidenceId: 'evidence-a' },
        { sessionId: 'session-b', caseExists: true, evidenceId: null },
        { sessionId: 'session-c', caseExists: false, evidenceId: null },
      ],
    )).toEqual({
      workItems: [
        { classSessionId: 'session-a', evidenceId: 'evidence-a' },
      ],
      baselineRequiredSessionIds: ['session-b', 'session-c'],
    });
  });

  it('keeps the dirty-session batch cap at 100', () => {
    expect(AVS_LATEST_CHECK_MAX_DIRTY_SESSIONS).toBe(100);
  });
});
