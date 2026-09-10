import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  buildRollingScheduleEditPlan,
  canPatchRollingScheduleSession,
  canRestoreReconciledRollingSession,
} from '../src/scheduling/rollingScheduleReconciliation';

function enrollment(args: {
  revision?: number;
  weeklySlots?: Array<{weekday: number; time: string; durationMinutes: number}>;
  classesStartDateYmd?: string;
} = {}): Record<string, unknown> {
  return {
    id: 'enrollment-1',
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
    classesStartDateYmd: args.classesStartDateYmd || '2026-09-01',
    schedule: {
      schemaVersion: 1,
      deliveryMode: 'rolling',
      timezone: 'Asia/Kolkata',
      revision: args.revision || 4,
      weeklySlots: args.weeklySlots || [
        {weekday: 1, time: '17:30', durationMinutes: 35},
        {weekday: 3, time: '17:30', durationMinutes: 35},
        {weekday: 5, time: '17:30', durationMinutes: 35},
      ],
    },
    scheduleMaterialization: {
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: args.revision || 4,
      materializedThroughYmd: '2026-09-24',
    },
  };
}

describe('Brick 6 rolling timetable reconciliation', () => {
  it('reconciles only the union of old and new occurrences inside the exact 14-day horizon', () => {
    const previous = enrollment();
    const next = enrollment({
      revision: 5,
      weeklySlots: [
        {weekday: 2, time: '17:30', durationMinutes: 35},
        {weekday: 4, time: '17:30', durationMinutes: 35},
      ],
    });
    const plan = buildRollingScheduleEditPlan({
      enrollmentId: 'enrollment-1',
      previousEnrollment: previous,
      nextEnrollment: next,
      anchorYmd: '2026-09-10',
    });

    expect(plan.horizonEndYmd).toBe('2026-09-24');
    expect(plan.fromRevision).toBe(4);
    expect(plan.toRevision).toBe(5);
    expect(plan.previousOccurrenceIds).toHaveLength(6);
    expect(plan.nextOccurrenceIds).toHaveLength(5);
    expect(plan.staleOccurrenceIds).toHaveLength(6);
    expect(plan.addedOccurrenceIds).toHaveLength(5);
    expect(plan.retainedOccurrenceIds).toHaveLength(0);
    expect([...plan.previousOccurrenceIds, ...plan.nextOccurrenceIds].every((id) => {
      const ymd = id.split('_')[1];
      return ymd >= '20260910' && ymd <= '20260924';
    })).toBe(true);
  });

  it('keeps deterministic identities when only duration changes so safe sessions can be patched in place', () => {
    const previous = enrollment();
    const next = enrollment({
      revision: 5,
      weeklySlots: [
        {weekday: 1, time: '17:30', durationMinutes: 40},
        {weekday: 3, time: '17:30', durationMinutes: 40},
        {weekday: 5, time: '17:30', durationMinutes: 40},
      ],
    });
    const plan = buildRollingScheduleEditPlan({
      enrollmentId: 'enrollment-1',
      previousEnrollment: previous,
      nextEnrollment: next,
      anchorYmd: '2026-09-10',
    });

    expect(plan.staleOccurrenceIds).toHaveLength(0);
    expect(plan.addedOccurrenceIds).toHaveLength(0);
    expect(plan.retainedOccurrenceIds).toEqual(plan.nextOccurrenceIds);
    const first = plan.nextOccurrencesById.get(plan.retainedOccurrenceIds[0]);
    expect(first?.durationMinutes).toBe(40);
  });

  it('treats a later classes-start boundary as a bounded removal, never a historical rewrite', () => {
    const previous = enrollment({classesStartDateYmd: '2026-09-01'});
    const next = enrollment({revision: 5, classesStartDateYmd: '2026-09-18'});
    const plan = buildRollingScheduleEditPlan({
      enrollmentId: 'enrollment-1',
      previousEnrollment: previous,
      nextEnrollment: next,
      anchorYmd: '2026-09-10',
    });

    expect(plan.previousOccurrenceIds.some((id) => id.includes('20260911'))).toBe(true);
    expect(plan.nextOccurrenceIds.some((id) => id.includes('20260911'))).toBe(false);
    expect(plan.staleOccurrenceIds.some((id) => id.includes('20260911'))).toBe(true);
    expect(plan.previousOccurrenceIds.every((id) => !id.includes('20260909'))).toBe(true);
  });

  it('patches only untouched future regular sessions', () => {
    const nowMs = Date.now();
    const common = {
      enrollmentId: 'enrollment-1',
      occurrenceStartAtUtcMs: nowMs + 60_000,
      nowMs,
      externallyFinanceLinked: false,
    };

    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'enrollment-1', status: 'scheduled', source: 'enrollmentSchedule'},
      ...common,
    })).toBe(true);
    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'other', status: 'scheduled'},
      ...common,
    })).toBe(false);
    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'enrollment-1', status: 'scheduled', attendance: 'present'},
      ...common,
    })).toBe(false);
    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'enrollment-1', status: 'scheduled', source: 'makeup_credit'},
      ...common,
    })).toBe(false);
    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'enrollment-1', status: 'scheduled'},
      ...common,
      externallyFinanceLinked: true,
    })).toBe(false);
    expect(canPatchRollingScheduleSession({
      session: {enrollmentId: 'enrollment-1', status: 'scheduled'},
      ...common,
      occurrenceStartAtUtcMs: nowMs - 1,
    })).toBe(false);
  });

  it('restores only a safe future session cancelled by an earlier rolling reconciliation', () => {
    const nowMs = Date.now();
    const common = {
      enrollmentId: 'enrollment-1',
      occurrenceStartAtUtcMs: nowMs + 60_000,
      nowMs,
      externallyFinanceLinked: false,
    };
    const reconciledCancellation = {
      enrollmentId: 'enrollment-1',
      status: 'cancelled',
      rollingScheduleReconciliationCancellation: {
        source: 'rolling_schedule_reconciliation',
        fromScheduleRevision: 3,
        toScheduleRevision: 4,
      },
    };

    expect(canRestoreReconciledRollingSession({session: reconciledCancellation, ...common})).toBe(true);
    expect(canRestoreReconciledRollingSession({
      session: {
        enrollmentId: 'enrollment-1',
        status: 'cancelled',
        rollingLifecycleCancellation: {source: 'rolling_schedule_lifecycle', reason: 'enrollment_paused'},
      },
      ...common,
    })).toBe(false);
    expect(canRestoreReconciledRollingSession({
      session: {...reconciledCancellation, source: 'manual_one_off'},
      ...common,
    })).toBe(false);
    expect(canRestoreReconciledRollingSession({
      session: reconciledCancellation,
      ...common,
      externallyFinanceLinked: true,
    })).toBe(false);
  });

  it('keeps immutable finance fields out of mutable timetable patches by source contract', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleReconciliation.ts'),
      'utf8',
    );
    const mutablePatchStart = source.indexOf('function buildMutableSchedulePatch');
    const mutablePatchEnd = source.indexOf('function buildPreviousEnrollmentFromMarker');
    const mutablePatch = source.slice(mutablePatchStart, mutablePatchEnd);

    expect(mutablePatch).not.toContain('billingRateSnapshot');
    expect(mutablePatch).not.toContain('teacherPayRateSnapshot');
    expect(mutablePatch).not.toContain('financialTermsSnapshotVersion');
    expect(mutablePatch).not.toContain('financialTermsCurrency');
  });

  it('uses deterministic point reads and never broad-scans classSessions during timetable edits', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleReconciliation.ts'),
      'utf8',
    );

    expect(source).not.toContain("collection('classSessions').where");
    expect(source).not.toContain('repairEnrollmentFutureSessionsFromScheduleInternal');
    expect(source).not.toContain('generateSessionsFromScheduleInternal');
    expect(source).toContain("collection('classSessions').doc(id)");
    expect(source).toContain("'scheduleMaterialization.nextMaterializationDueYmd': null");
    expect(source).toContain("'schedule.weeksAhead': FieldValue.delete()");
    expect(source).toContain("'schedule.plannedSessions': FieldValue.delete()");
    expect(source).toContain("'schedule.endDateYmd': FieldValue.delete()");
  });
});
