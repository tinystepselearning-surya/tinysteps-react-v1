import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  buildRollingMaterializationPlan,
  rollingSessionId,
} from '../src/scheduling/rollingScheduleMaterializer';
import {
  isOperationalEnrollmentForRollingRepair,
} from '../src/scheduling/rollingScheduleRepair';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const repairSource = source('functions/src/scheduling/rollingScheduleRepair.ts');

const legacyActiveEnrollment = (): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  parentId: 'parent-1',
  teacherId: 'teacher-1',
  courseId: 'course-1',
  courseName: 'Phonics',
  studentName: 'Kid One',
  teacherName: 'Teacher One',
  feePerClass: 400,
  teacherPayPerSession: 175,
  currency: 'INR',
  classesStartDateYmd: '2026-09-01',
  schedule: {
    timezone: 'Asia/Kolkata',
    revision: 1,
    weeklySlots: [
      {weekday: 0, time: '14:45', durationMinutes: 35},
      {weekday: 3, time: '14:45', durationMinutes: 35},
    ],
  },
  // Deliberately no scheduleMaterialization: this is the legacy production condition
  // that the steady-state due-pointer worker cannot discover on its own.
});

describe('rolling schedule repair', () => {
  it('treats an active legacy enrollment without materialization metadata as repairable', () => {
    const enrollment = legacyActiveEnrollment();
    expect(isOperationalEnrollmentForRollingRepair(enrollment)).toBe(true);

    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'legacy-enrollment',
      enrollment,
      anchorYmd: '2026-09-12',
    });

    expect(plan.materialization.horizonDays).toBe(14);
    expect(plan.materialization.materializedThroughYmd).toBe('2026-09-26');
    expect(plan.revisionResetRequired).toBe(false);
    expect(plan.occurrences.some((row) => row.weekday === 0)).toBe(true);
    expect(plan.occurrences.map((row) => row.sessionId)).toContain(
      rollingSessionId('legacy-enrollment', '2026-09-13', '14:45'),
    );
  });

  it('keeps Sunday weekday zero valid instead of treating it as falsy', () => {
    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'sunday-enrollment',
      enrollment: legacyActiveEnrollment(),
      anchorYmd: '2026-09-12',
    });
    const sundays = plan.occurrences.filter((row) => row.weekday === 0);
    expect(sundays.map((row) => row.date)).toEqual(['2026-09-13', '2026-09-20']);
  });

  it('excludes paused or archived enrollments from repair', () => {
    expect(isOperationalEnrollmentForRollingRepair({...legacyActiveEnrollment(), status: 'paused'})).toBe(false);
    expect(isOperationalEnrollmentForRollingRepair({...legacyActiveEnrollment(), archived: true})).toBe(false);
  });

  it('is protected, dry-run first, deterministic, create-only, and never deletes sessions', () => {
    expect(repairSource).toContain('await ensureAdmin(request.auth)');
    expect(repairSource).toContain("const apply = input.apply === true");
    expect(repairSource).toContain('expectedMissingCount');
    expect(repairSource).toContain('ROLLING_SCHEDULE_REPAIR_CONFIRMATION');
    expect(repairSource).toContain("tx.create(db.collection('classSessions').doc(occurrence.sessionId), payload)");
    expect(repairSource).toContain('buildRollingMaterializationPlan');
    expect(repairSource).not.toContain('.delete(');
    expect(repairSource).not.toContain("collection('classSessions').where");
  });
});
