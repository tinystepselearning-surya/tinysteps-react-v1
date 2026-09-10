import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARENT_UPCOMING_CLASS_DAYS,
  resolveParentClassSessionDateBounds,
} from '../../pages/parent/parentClassSessionReadPolicy';
import {
  doesSessionMatchEnrollmentSchedule,
  isEnrollmentOperationallyActive,
  isScheduleExceptionSession,
  isSessionCanonicalForEnrollment,
  normalizeEnrollmentScheduleSlots,
} from '../../lib/sessionScheduleIntegrity';

const historicalCorrectionSource = readFileSync(
  join(process.cwd(), 'functions/src/createAdminHistoricalAttendanceSession.ts'),
  'utf8',
);
const makeupSource = readFileSync(
  join(process.cwd(), 'functions/src/createMakeupSessionFromCredit.ts'),
  'utf8',
);
const revenueSource = readFileSync(
  join(process.cwd(), 'functions/src/sessionRevenue.ts'),
  'utf8',
);
const financialRatesSource = readFileSync(
  join(process.cwd(), 'functions/src/helpers/sessionFinancialRates.ts'),
  'utf8',
);

describe('rolling schedule Brick 0 compatibility contract', () => {
  it('keeps the parent operational horizon at exactly 14 days while preserving full-month calendar reads', () => {
    expect(PARENT_UPCOMING_CLASS_DAYS).toBe(14);

    const now = new Date(2026, 8, 10, 12, 0, 0);
    expect(
      resolveParentClassSessionDateBounds({
        activeTab: 'dashboard',
        classesView: 'today',
        now,
      }),
    ).toEqual({ startKey: '2026-09-01', endKey: '2026-09-24' });

    expect(
      resolveParentClassSessionDateBounds({
        activeTab: 'classes',
        classesView: 'calendar',
        now,
        calendarMonth: new Date(2026, 8, 1),
      }),
    ).toEqual({ startKey: '2026-09-01', endKey: '2026-09-30' });

    expect(
      resolveParentClassSessionDateBounds({
        activeTab: 'classes',
        classesView: 'completed',
        now,
      }),
    ).toBeNull();
  });

  it('preserves weekly recurrence as the canonical schedule shape and retains legacy schedule compatibility', () => {
    expect(
      normalizeEnrollmentScheduleSlots({
        weeklySlots: [
          { weekday: 5, time: '18:30', durationMinutes: 35 },
          { weekday: 1, time: '17:00', durationMinutes: 35 },
          { weekday: 3, time: '17:00', durationMinutes: 35 },
        ],
      }),
    ).toEqual([
      { weekday: 1, time: '17:00', durationMinutes: 35 },
      { weekday: 3, time: '17:00', durationMinutes: 35 },
      { weekday: 5, time: '18:30', durationMinutes: 35 },
    ]);

    expect(
      normalizeEnrollmentScheduleSlots({
        weekdays: [5, 1, 3],
        timeHHmm: '17:00',
        durationMins: 35,
      }),
    ).toEqual([
      { weekday: 1, time: '17:00', durationMinutes: 35 },
      { weekday: 3, time: '17:00', durationMinutes: 35 },
      { weekday: 5, time: '17:00', durationMinutes: 35 },
    ]);
  });

  it('keeps paused enrollments operationally hidden while active and trial enrollments remain visible', () => {
    expect(isEnrollmentOperationallyActive({ status: 'active' })).toBe(true);
    expect(isEnrollmentOperationallyActive({ status: 'trial' })).toBe(true);
    expect(isEnrollmentOperationallyActive({ status: 'paused' })).toBe(false);
    expect(isEnrollmentOperationallyActive({ status: 'discontinued' })).toBe(false);
  });

  it('keeps ordinary recurring sessions schedule-validated and protects makeup/reschedule/manual exceptions', () => {
    const enrollment = {
      id: 'enrollment-1',
      status: 'active',
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      teacherId: 'teacher-1',
      courseId: 'course-1',
      schedule: {
        weeklySlots: [{ weekday: 1, time: '17:00', durationMinutes: 35 }],
      },
    };

    const recurring = {
      enrollmentId: 'enrollment-1',
      kidId: 'kid-1',
      kidIds: ['kid-1'],
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date: '2026-09-14',
      startTime: '17:00',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'enrollmentSchedule',
    };

    expect(isScheduleExceptionSession(recurring)).toBe(false);
    expect(doesSessionMatchEnrollmentSchedule(recurring, enrollment)).toBe(true);
    expect(isSessionCanonicalForEnrollment(recurring, enrollment)).toBe(true);
    expect(
      isSessionCanonicalForEnrollment({ ...recurring, startTime: '18:00' }, enrollment),
    ).toBe(false);

    const makeup = {
      ...recurring,
      date: '2026-09-15',
      startTime: '19:15',
      makeupCreditId: 'credit-1',
      source: 'makeup',
    };
    expect(isScheduleExceptionSession(makeup)).toBe(true);
    expect(isSessionCanonicalForEnrollment(makeup, enrollment)).toBe(true);

    const approvedManual = {
      ...recurring,
      date: '2026-09-16',
      startTime: '20:00',
      source: 'admin_manual_one_off',
      manualSessionState: 'approved',
      createdBy: 'admin-1',
      createdAt: '2026-09-10T00:00:00.000Z',
    };
    expect(isScheduleExceptionSession(approvedManual)).toBe(true);
    expect(isSessionCanonicalForEnrollment(approvedManual, enrollment)).toBe(true);
  });

  it('keeps historical attendance repair isolated from recurring schedule generation', () => {
    expect(historicalCorrectionSource).toContain('historicalCorrection: true');
    expect(historicalCorrectionSource).toContain("status: 'completed'");
    expect(historicalCorrectionSource).not.toContain('repairEnrollmentFutureSessionsFromSchedule');
    expect(historicalCorrectionSource).not.toContain('createSessionsFromSchedule');
  });

  it('keeps makeup creation as a separate reschedule-credit flow', () => {
    expect(makeupSource).toContain("db.collection('rescheduleCredits').doc(creditId)");
    expect(makeupSource).toContain('makeupCreditId');
    expect(makeupSource).toContain('sourceSessionId');
    expect(makeupSource).not.toContain('plannedSessionsTarget');
  });

  it('keeps revenue and immutable financial terms session-based', () => {
    expect(revenueSource).toContain("document: 'classSessions/{sessionId}'");
    expect(revenueSource).toContain('hasCompleteSessionFinancialTermsSnapshot');
    expect(revenueSource).toContain('ensureSessionFinancialTermsSnapshot');
    expect(financialRatesSource).toContain("export const BILLING_RATE_SNAPSHOT_FIELD = 'billingRateSnapshot'");
    expect(financialRatesSource).toContain("export const TEACHER_PAY_RATE_SNAPSHOT_FIELD = 'teacherPayRateSnapshot'");
    expect(financialRatesSource).toContain("export const FINANCIAL_TERMS_VERSION_FIELD = 'financialTermsSnapshotVersion'");
  });
});
