import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  buildCanonicalRollingScheduleDefinition,
  buildRollingLifecycleOccurrenceIdentities,
  buildSuspendedRollingMaterializationState,
  canCancelRollingLifecycleSession,
  canRestorePausedRollingSession,
  isCanonicalRollingEnrollment,
  isRollingScheduleExceptionSession,
  normalizeRollingLifecycleTarget,
  resolveRollingLifecycleTodayYmd,
} from '../src/scheduling/rollingScheduleLifecycle';
import {ROLLING_SCHEDULE_HORIZON_DAYS} from '../src/scheduling/rollingScheduleMaterializer';

function baseEnrollment(): Record<string, unknown> {
  return {
    status: 'active',
    kidId: 'kid-1',
    kidIds: ['kid-1'],
    studentId: 'kid-1',
    childId: 'kid-1',
    teacherId: 'teacher-1',
    courseId: 'course-1',
    feePerClass: 400,
    teacherPayPerSession: 175,
    currency: 'INR',
    classesStartDateYmd: '2026-09-01',
    schedule: {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 4,
      weeklySlots: [
        {weekday: 1, time: '04:00', durationMinutes: 35},
        {weekday: 3, time: '04:00', durationMinutes: 35},
        {weekday: 5, time: '04:00', durationMinutes: 35},
      ],
    },
  };
}

describe('Brick 5 rolling lifecycle contracts', () => {
  it('normalizes only the intended Active / Pause / Resume / Discontinue lifecycle actions', () => {
    expect(normalizeRollingLifecycleTarget('active')).toBe('active');
    expect(normalizeRollingLifecycleTarget('resume')).toBe('active');
    expect(normalizeRollingLifecycleTarget('pause')).toBe('paused');
    expect(normalizeRollingLifecycleTarget('paused')).toBe('paused');
    expect(normalizeRollingLifecycleTarget('discontinue')).toBe('discontinued');
    expect(normalizeRollingLifecycleTarget('discontinued')).toBe('discontinued');
    expect(normalizeRollingLifecycleTarget('completed')).toBeNull();
    expect(normalizeRollingLifecycleTarget('cancelled')).toBeNull();
  });

  it('recognizes only explicit canonical rolling schedules', () => {
    expect(isCanonicalRollingEnrollment(baseEnrollment())).toBe(true);
    expect(isCanonicalRollingEnrollment({schedule: {weekdays: [1], timeHHmm: '04:00'}})).toBe(false);
    expect(isCanonicalRollingEnrollment({
      schedule: {schemaVersion: 1, deliveryMode: 'rolling', timezone: 'UTC'},
    })).toBe(false);
  });

  it('converts a legacy recurrence to canonical rolling without finite stop controls', () => {
    const legacy = {
      status: 'active',
      classesStartDateYmd: '2026-09-01',
      schedule: {
        weekdays: [1, 3, 5],
        timeHHmm: '04:00',
        durationMins: 35,
        weeksAhead: 20,
        plannedSessions: 60,
        endDateYmd: '2027-01-31',
      },
    } as Record<string, unknown>;

    const result = buildCanonicalRollingScheduleDefinition({
      existingEnrollment: legacy,
      classesStartDateYmd: '2026-09-01',
      weeklySlots: [
        {weekday: 1, time: '04:00', durationMinutes: 35},
        {weekday: 3, time: '04:00', durationMinutes: 35},
        {weekday: 5, time: '04:00', durationMinutes: 35},
      ],
    });

    expect(result.recurrenceChanged).toBe(true);
    expect(result.schedule.deliveryMode).toBe('rolling');
    expect(result.schedule.timezone).toBe('Asia/Kolkata');
    expect(result.schedule.revision).toBe(1);
    expect(result.schedule.weeklySlots).toHaveLength(3);
    expect(result.schedule).not.toHaveProperty('weeksAhead');
    expect(result.schedule).not.toHaveProperty('plannedSessions');
    expect(result.schedule).not.toHaveProperty('endDateYmd');
  });

  it('keeps the revision stable for an idempotent re-save of the same recurrence', () => {
    const enrollment = baseEnrollment();
    const result = buildCanonicalRollingScheduleDefinition({
      existingEnrollment: enrollment,
      classesStartDateYmd: '2026-09-01',
      weeklySlots: [
        {weekday: 1, time: '04:00', durationMinutes: 35},
        {weekday: 3, time: '04:00', durationMinutes: 35},
        {weekday: 5, time: '04:00', durationMinutes: 35},
      ],
    });
    expect(result.recurrenceChanged).toBe(false);
    expect(result.schedule.revision).toBe(4);
  });

  it('detects a recurrence edit instead of silently leaving stale future sessions', () => {
    const enrollment = baseEnrollment();
    const result = buildCanonicalRollingScheduleDefinition({
      existingEnrollment: enrollment,
      classesStartDateYmd: '2026-09-01',
      weeklySlots: [
        {weekday: 2, time: '05:00', durationMinutes: 35},
        {weekday: 4, time: '05:00', durationMinutes: 35},
      ],
    });
    expect(result.recurrenceChanged).toBe(true);
    expect(result.schedule.revision).toBe(5);
  });

  it('enumerates lifecycle work only inside the same 14-day operational horizon', () => {
    const enrollment = baseEnrollment();
    const occurrences = buildRollingLifecycleOccurrenceIdentities({
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-10',
    });
    expect(ROLLING_SCHEDULE_HORIZON_DAYS).toBe(14);
    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences.every((row) => row.date >= '2026-09-10')).toBe(true);
    expect(occurrences.every((row) => row.date <= '2026-09-24')).toBe(true);
    expect(occurrences.every((row) => row.sessionId.startsWith('enrollment-1_'))).toBe(true);
  });

  it('handles multiple slots on the same day without expanding beyond the window', () => {
    const enrollment = baseEnrollment();
    enrollment.schedule = {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: 1,
      weeklySlots: [
        {weekday: 4, time: '04:00', durationMinutes: 35},
        {weekday: 4, time: '06:00', durationMinutes: 35},
      ],
    };
    const occurrences = buildRollingLifecycleOccurrenceIdentities({
      enrollmentId: 'enrollment-2',
      enrollment,
      todayYmd: '2026-09-10',
    });
    const firstDay = occurrences.filter((row) => row.date === '2026-09-10');
    expect(firstDay.map((row) => row.startTime)).toEqual(['04:00', '06:00']);
    expect(new Set(firstDay.map((row) => row.sessionId)).size).toBe(2);
  });

  it('permits cancellation only for untouched future regular sessions', () => {
    const common = {
      occurrenceStartAtUtcMs: Date.now() + 60_000,
      nowMs: Date.now(),
      externallyFinanceLinked: false,
    };
    expect(canCancelRollingLifecycleSession({session: {status: 'scheduled'}, ...common})).toBe(true);
    expect(canCancelRollingLifecycleSession({session: {status: 'completed'}, ...common})).toBe(false);
    expect(canCancelRollingLifecycleSession({session: {status: 'scheduled', attendance: 'present'}, ...common})).toBe(false);
    expect(canCancelRollingLifecycleSession({session: {status: 'scheduled', source: 'makeup_credit'}, ...common})).toBe(false);
    expect(canCancelRollingLifecycleSession({session: {status: 'scheduled', historicalCorrection: true}, ...common})).toBe(false);
    expect(canCancelRollingLifecycleSession({session: {status: 'scheduled'}, ...common, externallyFinanceLinked: true})).toBe(false);
    expect(canCancelRollingLifecycleSession({
      session: {status: 'scheduled'},
      occurrenceStartAtUtcMs: Date.now() - 60_000,
      nowMs: Date.now(),
      externallyFinanceLinked: false,
    })).toBe(false);
  });

  it('restores only sessions cancelled by rolling Pause, never manual or terminal cancellations', () => {
    const common = {
      occurrenceStartAtUtcMs: Date.now() + 60_000,
      nowMs: Date.now(),
      externallyFinanceLinked: false,
    };
    const paused = {
      status: 'cancelled',
      rollingLifecycleCancellation: {
        source: 'rolling_schedule_lifecycle',
        reason: 'enrollment_paused',
      },
    };
    expect(canRestorePausedRollingSession({session: paused, ...common})).toBe(true);
    expect(canRestorePausedRollingSession({
      session: {
        ...paused,
        rollingLifecycleCancellation: {
          source: 'rolling_schedule_lifecycle',
          reason: 'enrollment_discontinued',
        },
      },
      ...common,
    })).toBe(false);
    expect(canRestorePausedRollingSession({session: {...paused, source: 'manual_one_off'}, ...common})).toBe(false);
    expect(canRestorePausedRollingSession({session: paused, ...common, externallyFinanceLinked: true})).toBe(false);
  });

  it('recognizes all protected schedule exception families', () => {
    expect(isRollingScheduleExceptionSession({source: 'makeup'})).toBe(true);
    expect(isRollingScheduleExceptionSession({source: 'approved_request'})).toBe(true);
    expect(isRollingScheduleExceptionSession({isAdHoc: true})).toBe(true);
    expect(isRollingScheduleExceptionSession({historicalCorrection: true})).toBe(true);
    expect(isRollingScheduleExceptionSession({manualSessionState: 'approved'})).toBe(true);
    expect(isRollingScheduleExceptionSession({source: 'rolling_schedule'})).toBe(false);
  });

  it('suspends the edge-worker pointers without changing historical materialization evidence', () => {
    const state = buildSuspendedRollingMaterializationState({
      materialization: {
        schemaVersion: 1,
        horizonDays: 14,
        scheduleRevision: 4,
        materializedThroughYmd: '2026-09-24',
        nextOccurrenceYmd: '2026-09-25',
        nextMaterializationDueYmd: '2026-09-11',
      },
    });
    expect(state.materializedThroughYmd).toBe('2026-09-24');
    expect(state.nextOccurrenceYmd).toBeNull();
    expect(state.nextMaterializationDueYmd).toBeNull();
  });

  it('resolves the IST lifecycle date deterministically', () => {
    expect(resolveRollingLifecycleTodayYmd(new Date('2026-09-09T20:00:00.000Z'))).toBe('2026-09-10');
  });

  it('keeps Brick 5 lifecycle work bounded and isolated from the legacy finite generator', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleLifecycle.ts'),
      'utf8',
    );
    const edgeSource = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduled/rollingScheduleEdgeReplenisher.ts'),
      'utf8',
    );

    expect(source).not.toContain("collection('classSessions').where");
    expect(source).not.toContain('generateSessionsFromScheduleInternal');
    expect(source).not.toContain('repairEnrollmentFutureSessionsFromScheduleInternal');
    expect(source).toContain("store.getSessionsByIds(sessionIds)");
    expect(source).toContain("'schedule.weeksAhead': FieldValue.delete()");
    expect(source).toContain("'schedule.plannedSessions': FieldValue.delete()");
    expect(source).toContain("'schedule.endDateYmd': FieldValue.delete()");
    expect(edgeSource).toContain('db.runTransaction(async (tx) =>');
    expect(edgeSource).toContain('const enrollmentSnap = await tx.get(enrollmentRef)');
    expect(edgeSource).toContain("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    expect(edgeSource).toContain('tx.update(enrollmentRef, buildMaterializationPatch(plan.finalMaterialization))');
  });
});