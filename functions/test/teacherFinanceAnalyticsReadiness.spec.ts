import { describe, expect, it } from 'vitest';
import { checkTeacherFinanceAnalyticsReadinessRow } from '../src/helpers/teacherFinanceAnalyticsReadiness';

describe('B6 Brick 6B1 teacher finance analytics readiness guard', () => {
  it('accepts canonical session earnings', () => {
    const result = checkTeacherFinanceAnalyticsReadinessRow('session-1', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      sessionId: 'session-1',
      source: 'session_present_completed',
      status: 'unpaid',
    });

    expect(result).toEqual({
      relevant: true,
      safe: true,
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      reasons: [],
    });
  });

  it('accepts standalone demo earnings', () => {
    const result = checkTeacherFinanceAnalyticsReadinessRow('demo-1', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      source: 'demo_completed',
      status: 'unpaid',
    });

    expect(result.safe).toBe(true);
  });

  it('rejects noncanonical or malformed session earnings', () => {
    const noncanonical = checkTeacherFinanceAnalyticsReadinessRow('legacy-row', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      sessionId: 'session-1',
      source: 'session_present_completed',
      status: 'unpaid',
    });
    expect(noncanonical.safe).toBe(false);
    expect(noncanonical.reasons).toContain('noncanonical_session_earning_id');

    const missingSessionId = checkTeacherFinanceAnalyticsReadinessRow('session-2', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      source: 'session_present_completed',
      status: 'unpaid',
    });
    expect(missingSessionId.reasons).toContain('session_source_missing_session_id');
  });

  it('rejects unclassified, conflicting, or missing identity/month rows', () => {
    const unclassified = checkTeacherFinanceAnalyticsReadinessRow('manual-1', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      source: 'manual_adjustment',
      status: 'unpaid',
    });
    expect(unclassified.reasons).toContain('unclassified_earning_source');

    const conflict = checkTeacherFinanceAnalyticsReadinessRow('demo-1', {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      sessionId: 'demo-1',
      source: 'demo_completed',
      status: 'unpaid',
    });
    expect(conflict.reasons).toContain('demo_session_classification_conflict');

    const missingIdentity = checkTeacherFinanceAnalyticsReadinessRow('session-3', {
      earnedAt: new Date('2026-08-10T10:00:00+05:30'),
      sessionId: 'session-3',
      source: 'session_present_completed',
      status: 'unpaid',
    });
    expect(missingIdentity.teacherId).toBe('');
    expect(missingIdentity.monthKey).toBe('2026-08');
    expect(missingIdentity.reasons).toContain('missing_teacher_id');
    expect(missingIdentity.reasons).toContain('missing_or_invalid_month_key');
  });

  it('does not invalidate readiness for archived or void rows', () => {
    const archived = checkTeacherFinanceAnalyticsReadinessRow('legacy', {
      source: 'manual_adjustment',
      archived: true,
    });
    expect(archived.relevant).toBe(false);
    expect(archived.safe).toBe(true);

    const voided = checkTeacherFinanceAnalyticsReadinessRow('legacy', {
      source: 'manual_adjustment',
      status: 'void',
    });
    expect(voided.relevant).toBe(false);
    expect(voided.safe).toBe(true);
  });
});
