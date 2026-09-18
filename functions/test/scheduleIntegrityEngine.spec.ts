import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  classifyScheduleIntegrityOccurrence,
  runScheduleIntegrityEngineWithStore,
  type ScheduleIntegrityStore,
} from '../src/scheduling/scheduleIntegrityEngine';
import {
  buildRollingMaterializationPlan,
  type RollingMaterializationOccurrence,
} from '../src/scheduling/rollingScheduleMaterializer';

const baseEnrollment = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  studentId: 'kid-1',
  childId: 'kid-1',
  parentId: 'parent-1',
  teacherId: 'teacher-1',
  courseId: 'course-1',
  feePerClass: 400,
  teacherPayPerSession: 175,
  currency: 'INR',
  classesStartDateYmd: '2026-09-01',
  schedule: {
    timezone: 'Asia/Kolkata',
    revision: 1,
    weeklySlots: [
      {weekday: 5, time: '10:00', durationMinutes: 35},
    ],
  },
  ...overrides,
});

const planFor = (
  enrollmentId: string,
  enrollment: Record<string, unknown>,
) => buildRollingMaterializationPlan({
  enrollmentId,
  enrollment,
  anchorYmd: '2026-09-18',
});

const healthySession = (
  enrollmentId: string,
  enrollment: Record<string, unknown>,
  occurrence: RollingMaterializationOccurrence,
): Record<string, unknown> => ({
  enrollmentId,
  courseId: enrollment.courseId,
  teacherId: enrollment.teacherId,
  kidId: enrollment.kidId,
  kidIds: enrollment.kidIds,
  date: occurrence.date,
  startTime: occurrence.startTime,
  durationMinutes: occurrence.durationMinutes,
  status: 'scheduled',
  scheduleRevision: 1,
});

class MemoryStore implements ScheduleIntegrityStore {
  enrollments: Array<{id: string; data: Record<string, unknown>}>;
  sessions = new Map<string, Record<string, unknown>>();

  constructor(
    enrollments: Array<{id: string; data: Record<string, unknown>}>,
  ) {
    this.enrollments = enrollments;
  }

  async listEnrollments() {
    return this.enrollments;
  }

  async getSessionsByIds(sessionIds: string[]) {
    const result = new Map<string, Record<string, unknown>>();
    sessionIds.forEach((sessionId) => {
      const session = this.sessions.get(sessionId);
      if (session) result.set(sessionId, session);
    });
    return result;
  }

  async listSessionsInWindow() {
    return new Map(this.sessions);
  }
}

describe('Brick 2 schedule integrity engine', () => {
  it('scans active enrollments without depending on scheduleMaterialization pointers', async () => {
    const enrollment = baseEnrollment();
    const plan = planFor('enr-1', enrollment);
    expect(plan.occurrences.map((item) => item.date)).toEqual([
      '2026-09-18',
      '2026-09-25',
      '2026-10-02',
    ]);

    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);
    const first = plan.occurrences[0];
    store.sessions.set(
      first.sessionId,
      healthySession('enr-1', enrollment, first),
    );

    const summary = await runScheduleIntegrityEngineWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.mode).toBe('READ_ONLY');
    expect(summary.pointerIndependentScan).toBe(true);
    expect(summary.operationalEnrollments).toBe(1);
    expect(summary.eligibleEnrollments).toBe(1);
    expect(summary.expectedOccurrences).toBe(3);
    expect(summary.healthyOccurrences).toBe(1);
    expect(summary.missingOccurrences).toBe(2);
    expect(summary.missingToday).toBe(0);
    expect(summary.affectedEnrollments).toBe(1);
    expect(summary.enrollmentsMissingMaterializationMetadata).toBe(1);
  });

  it('treats cancelled or paused deterministic occurrences as explicit schedule exceptions', async () => {
    const enrollment = baseEnrollment({
      scheduleMaterialization: {materializedThroughYmd: '2026-10-02'},
    });
    const plan = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    plan.occurrences.forEach((occurrence, index) => {
      store.sessions.set(
        occurrence.sessionId,
        index === 0 ?
          {
            ...healthySession('enr-1', enrollment, occurrence),
            status: 'cancelled',
          } :
          healthySession('enr-1', enrollment, occurrence),
      );
    });

    const summary = await runScheduleIntegrityEngineWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.scheduleExceptions).toBe(1);
    expect(summary.healthyOccurrences).toBe(2);
    expect(summary.missingOccurrences).toBe(0);
    expect(summary.affectedEnrollments).toBe(0);
  });

  it('recognizes a linked makeup/reschedule replacement when the deterministic source row is absent', async () => {
    const enrollment = baseEnrollment();
    const plan = planFor('enr-1', enrollment);
    const store = new MemoryStore([{id: 'enr-1', data: enrollment}]);

    plan.occurrences.slice(1).forEach((occurrence) => {
      store.sessions.set(
        occurrence.sessionId,
        healthySession('enr-1', enrollment, occurrence),
      );
    });

    const original = plan.occurrences[0];
    store.sessions.set('makeup-1', {
      enrollmentId: 'enr-1',
      courseId: 'course-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      date: '2026-09-20',
      startTime: '11:00',
      durationMinutes: 35,
      status: 'scheduled',
      source: 'teacher_makeup_from_reschedule',
      isMakeup: true,
      makeupForSessionId: original.sessionId,
    });

    const summary = await runScheduleIntegrityEngineWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.scheduleExceptions).toBe(1);
    expect(summary.healthyOccurrences).toBe(2);
    expect(summary.missingOccurrences).toBe(0);
  });

  it('distinguishes identity, schedule, and stale-revision defects', () => {
    const enrollment = baseEnrollment();
    const occurrence = planFor('enr-1', enrollment).occurrences[0];
    const valid = healthySession('enr-1', enrollment, occurrence);

    expect(classifyScheduleIntegrityOccurrence({
      enrollmentId: 'enr-1',
      enrollment,
      occurrence,
      scheduleRevision: 1,
      existingSession: {...valid, teacherId: 'wrong-teacher'},
    }).state).toBe('identity_mismatch');

    expect(classifyScheduleIntegrityOccurrence({
      enrollmentId: 'enr-1',
      enrollment,
      occurrence,
      scheduleRevision: 1,
      existingSession: {...valid, startTime: '10:30'},
    }).state).toBe('schedule_mismatch');

    expect(classifyScheduleIntegrityOccurrence({
      enrollmentId: 'enr-1',
      enrollment,
      occurrence,
      scheduleRevision: 2,
      existingSession: {...valid, scheduleRevision: 1},
    }).state).toBe('stale_revision');

    expect(classifyScheduleIntegrityOccurrence({
      enrollmentId: 'enr-1',
      enrollment,
      occurrence,
      scheduleRevision: 1,
      existingSession: valid,
    }).state).toBe('healthy');
  });

  it('reports invalid active enrollment source data separately instead of inventing sessions', async () => {
    const store = new MemoryStore([
      {
        id: 'missing-teacher',
        data: baseEnrollment({teacherId: ''}),
      },
      {
        id: 'invalid-schedule',
        data: baseEnrollment({schedule: {weeklySlots: []}}),
      },
      {
        id: 'paused',
        data: baseEnrollment({status: 'paused'}),
      },
    ]);

    const summary = await runScheduleIntegrityEngineWithStore(store, {
      anchorYmd: '2026-09-18',
    });

    expect(summary.operationalEnrollments).toBe(2);
    expect(summary.eligibleEnrollments).toBe(0);
    expect(summary.invalidEnrollments).toBe(2);
    expect(summary.invalidByReason.missing_teacher).toBe(1);
    expect(summary.invalidByReason.invalid_schedule).toBe(1);
    expect(summary.expectedOccurrences).toBe(0);
  });

  it('contains no Firestore write path or schedule-materialization discovery query', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/scheduleIntegrityEngine.ts'),
      'utf8',
    );

    expect(source).toContain("collection('enrollments').get()");
    expect(source).not.toContain('nextMaterializationDueYmd');
    expect(source).not.toContain('.runTransaction(');
    expect(source).not.toContain('.create(');
    expect(source).not.toContain('.delete(');
    expect(source).not.toContain('.update(');
    expect(source).not.toContain('.set(');
  });
});
