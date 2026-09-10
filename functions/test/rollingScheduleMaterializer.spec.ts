import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  MAX_ROLLING_WINDOW_OCCURRENCES,
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_SESSION_SOURCE,
  addDaysYmd,
  buildRollingMaterializationPlan,
  buildRollingScheduledSessionPayload,
  materializeRollingEnrollmentWithStore,
  normalizeRollingMaterializerSlots,
  rollingSessionId,
  type RollingScheduleMaterializationState,
  type RollingScheduleMaterializerStore,
} from '../src/scheduling/rollingScheduleMaterializer';

const baseEnrollment = (): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  studentId: 'kid-1',
  childId: 'kid-1',
  studentName: 'Aarav',
  kidName: 'Aarav',
  childName: 'Aarav',
  parentId: 'parent-1',
  parentIds: ['parent-1'],
  teacherId: 'teacher-1',
  teacherName: 'Teacher One',
  teacherEmail: 'teacher@example.com',
  courseId: 'course-1',
  courseName: 'Phonics Foundations',
  feePerClass: 400,
  ratePerSession: 400,
  teacherPayPerSession: 175,
  currency: 'INR',
  joinUrl: 'https://teams.example/class',
  classesStartDateYmd: '2026-09-01',
  schedule: {
    schemaVersion: 1,
    deliveryMode: 'rolling',
    timezone: 'Asia/Kolkata',
    revision: 3,
    weeklySlots: [
      {weekday: 1, time: '04:00', durationMinutes: 35},
      {weekday: 3, time: '04:00', durationMinutes: 35},
      {weekday: 5, time: '04:00', durationMinutes: 35},
    ],
  },
});

class MemoryStore implements RollingScheduleMaterializerStore {
  enrollment: Record<string, unknown> | null;
  sessions = new Map<string, Record<string, unknown>>();
  createCalls: string[] = [];
  metadataUpdates: RollingScheduleMaterializationState[] = [];
  raceIds = new Set<string>();

  constructor(enrollment: Record<string, unknown> | null) {
    this.enrollment = enrollment;
  }

  async getEnrollment(): Promise<Record<string, unknown> | null> {
    return this.enrollment;
  }

  async getSessionsByIds(sessionIds: string[]): Promise<Map<string, Record<string, unknown>>> {
    const result = new Map<string, Record<string, unknown>>();
    sessionIds.forEach((sessionId) => {
      const value = this.sessions.get(sessionId);
      if (value) result.set(sessionId, value);
    });
    return result;
  }

  async createSessionIfAbsent(
    sessionId: string,
    payload: Record<string, unknown>,
  ): Promise<'created' | 'already_exists'> {
    this.createCalls.push(sessionId);
    if (this.raceIds.has(sessionId) || this.sessions.has(sessionId)) {
      if (!this.sessions.has(sessionId)) this.sessions.set(sessionId, {source: 'concurrent_writer'});
      return 'already_exists';
    }
    this.sessions.set(sessionId, payload);
    return 'created';
  }

  async updateEnrollmentMaterialization(
    _enrollmentId: string,
    materialization: RollingScheduleMaterializationState,
  ): Promise<void> {
    this.metadataUpdates.push(materialization);
    if (this.enrollment) this.enrollment.scheduleMaterialization = {...materialization};
  }
}

describe('rolling schedule materializer', () => {
  it('uses the same exact 14-day future boundary as the parent operational policy', () => {
    expect(ROLLING_SCHEDULE_HORIZON_DAYS).toBe(14);
    expect(addDaysYmd('2026-09-10', ROLLING_SCHEDULE_HORIZON_DAYS)).toBe('2026-09-24');

    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      anchorYmd: '2026-09-10',
    });

    expect(plan.horizonEndYmd).toBe('2026-09-24');
    expect(plan.occurrences.map((item) => item.date)).toEqual([
      '2026-09-11',
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      '2026-09-21',
      '2026-09-23',
    ]);
    expect(plan.materialization.nextOccurrenceYmd).toBe('2026-09-25');
    expect(plan.materialization.nextMaterializationDueYmd).toBe('2026-09-11');
  });

  it('keeps deterministic IDs and exact IST timestamps', () => {
    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      anchorYmd: '2026-09-10',
    });
    const first = plan.occurrences[0];

    expect(first.sessionId).toBe('enrollment-1_20260911_0400');
    expect(rollingSessionId('enrollment-1', '2026-09-11', '04:00')).toBe(first.sessionId);
    expect(new Date(first.startAtUtcMs).toISOString()).toBe('2026-09-10T22:30:00.000Z');
    expect(new Date(first.endAtUtcMs).toISOString()).toBe('2026-09-10T23:05:00.000Z');
  });

  it('reads legacy schedule shape but ignores finite legacy stopping fields', () => {
    const enrollment = baseEnrollment();
    enrollment.schedule = {
      timezone: 'Asia/Kolkata',
      weekdays: [1, 3, 5],
      timeHHmm: '04:00',
      durationMins: 35,
      weeksAhead: 1,
      plannedSessions: 1,
      endDateYmd: '2026-09-12',
    };

    const slots = normalizeRollingMaterializerSlots(enrollment.schedule);
    expect(slots).toHaveLength(3);

    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      anchorYmd: '2026-09-10',
    });
    expect(plan.occurrences.map((item) => item.date)).toEqual([
      '2026-09-11',
      '2026-09-14',
      '2026-09-16',
      '2026-09-18',
      '2026-09-21',
      '2026-09-23',
    ]);
  });

  it('enforces classesStartDate without creating anything before it', () => {
    const enrollment = baseEnrollment();
    enrollment.classesStartDateYmd = '2026-09-18';
    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      anchorYmd: '2026-09-10',
    });
    expect(plan.occurrences.map((item) => item.date)).toEqual([
      '2026-09-18',
      '2026-09-21',
      '2026-09-23',
    ]);
  });

  it('fails closed for paused enrollments and missing canonical teachers', () => {
    const paused = baseEnrollment();
    paused.status = 'paused';
    expect(() => buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment: paused,
      anchorYmd: '2026-09-10',
    })).toThrow(/not operationally active/i);

    const noTeacher = baseEnrollment();
    delete noTeacher.teacherId;
    expect(() => buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment: noTeacher,
      anchorYmd: '2026-09-10',
    })).toThrow(/canonical teacher/i);
  });

  it('resets materialization bookkeeping when the schedule revision changed', () => {
    const enrollment = baseEnrollment();
    enrollment.scheduleMaterialization = {
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 2,
      materializedThroughYmd: '2026-10-31',
      nextOccurrenceYmd: '2026-11-02',
      nextMaterializationDueYmd: '2026-10-19',
    };

    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      anchorYmd: '2026-09-10',
    });
    expect(plan.revisionResetRequired).toBe(true);
    expect(plan.scheduleRevision).toBe(3);
    expect(plan.materialization).toMatchObject({
      horizonDays: 14,
      scheduleRevision: 3,
      materializedThroughYmd: '2026-09-24',
      nextOccurrenceYmd: '2026-09-25',
      nextMaterializationDueYmd: '2026-09-11',
    });
  });

  it('creates only missing deterministic sessions and never rewrites an existing exception', async () => {
    const enrollment = baseEnrollment();
    const store = new MemoryStore(enrollment);
    const protectedId = 'enrollment-1_20260911_0400';
    const protectedSession = {
      enrollmentId: 'enrollment-1',
      date: '2026-09-11',
      startTime: '04:00',
      source: 'manual_one_off',
      status: 'scheduled',
      note: 'keep me',
    };
    store.sessions.set(protectedId, protectedSession);

    const result = await materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
      actorId: 'system:test',
    });

    expect(result.expectedCount).toBe(6);
    expect(result.existingCount).toBe(1);
    expect(result.createdCount).toBe(5);
    expect(result.preservedExistingSessionIds).toEqual([protectedId]);
    expect(store.sessions.get(protectedId)).toEqual(protectedSession);
    expect(store.createCalls).not.toContain(protectedId);
    expect(store.metadataUpdates).toHaveLength(1);
  });

  it('is idempotent on retry and performs no duplicate session writes', async () => {
    const store = new MemoryStore(baseEnrollment());
    const first = await materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
    });
    expect(first.createdCount).toBe(6);
    const createCallsAfterFirstRun = store.createCalls.length;

    const second = await materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
    });
    expect(second.createdCount).toBe(0);
    expect(second.existingCount).toBe(6);
    expect(store.createCalls).toHaveLength(createCallsAfterFirstRun);
  });

  it('handles a concurrent create race without overwriting the winning document', async () => {
    const store = new MemoryStore(baseEnrollment());
    store.raceIds.add('enrollment-1_20260911_0400');

    const result = await materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
    });

    expect(result.createdCount).toBe(5);
    expect(result.raceAlreadyExistsCount).toBe(1);
    expect(store.sessions.get('enrollment-1_20260911_0400')).toEqual({source: 'concurrent_writer'});
  });

  it('supports dry-run planning with zero writes', async () => {
    const store = new MemoryStore(baseEnrollment());
    const result = await materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
      dryRun: true,
    });

    expect(result.wouldCreateCount).toBe(6);
    expect(result.createdCount).toBe(0);
    expect(result.metadataUpdated).toBe(false);
    expect(store.createCalls).toHaveLength(0);
    expect(store.metadataUpdates).toHaveLength(0);
    expect(store.sessions.size).toBe(0);
  });

  it('writes the complete immutable financial snapshot on initial session creation', () => {
    const enrollment = baseEnrollment();
    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      anchorYmd: '2026-09-10',
    });
    const payload = buildRollingScheduledSessionPayload({
      enrollmentId: 'enrollment-1',
      enrollment,
      occurrence: plan.occurrences[0],
      scheduleRevision: plan.scheduleRevision,
      actorId: 'system:test',
    });

    expect(payload).toMatchObject({
      enrollmentId: 'enrollment-1',
      kidId: 'kid-1',
      teacherId: 'teacher-1',
      courseId: 'course-1',
      date: '2026-09-11',
      startTime: '04:00',
      durationMinutes: 35,
      status: 'scheduled',
      feeAmount: 400,
      feePerClass: 400,
      teacherPayPerSession: 175,
      currency: 'INR',
      financialTermsSnapshotVersion: 1,
      billingRateSnapshot: 400,
      teacherPayRateSnapshot: 175,
      financialTermsCurrency: 'INR',
      source: ROLLING_SCHEDULE_SESSION_SOURCE,
      scheduleDeliveryMode: 'rolling',
      scheduleRevision: 3,
      scheduleMaterializationVersion: 1,
    });
  });

  it('fails before any write when the billing rate is not resolvable', async () => {
    const enrollment = baseEnrollment();
    delete enrollment.feePerClass;
    delete enrollment.ratePerSession;
    const store = new MemoryStore(enrollment);

    await expect(materializeRollingEnrollmentWithStore(store, {
      enrollmentId: 'enrollment-1',
      anchorYmd: '2026-09-10',
    })).rejects.toThrow(/positive billing rate/i);
    expect(store.sessions.size).toBe(0);
    expect(store.metadataUpdates).toHaveLength(0);
  });

  it('fails closed before a pathological per-enrollment write fanout', () => {
    const enrollment = baseEnrollment();
    enrollment.schedule = {
      timezone: 'Asia/Kolkata',
      revision: 1,
      weeklySlots: Array.from({length: 35}, (_, index) => ({
        weekday: index % 7,
        time: `${String(Math.floor(index / 7)).padStart(2, '0')}:00`,
        durationMinutes: 35,
      })),
    };
    const plan = buildRollingMaterializationPlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      anchorYmd: '2026-09-10',
    });
    expect(plan.occurrences.length).toBeLessThanOrEqual(MAX_ROLLING_WINDOW_OCCURRENCES);
  });

  it('keeps the Firestore adapter point-read only and never scans/deletes existing sessions', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleMaterializer.ts'),
      'utf8',
    );
    expect(source).toContain("db.getAll(...refs)");
    expect(source).toContain(".doc(sessionId).create(payload)");
    expect(source).not.toContain("where('enrollmentId'");
    expect(source).not.toContain('where("enrollmentId"');
    expect(source).not.toContain('.delete(');
    expect(source).not.toContain('db.batch(');
    expect(source).not.toContain("collection('kids')");
    expect(source).not.toContain("collection('courses')");
    expect(source).not.toContain("collection('users')");
  });
});
