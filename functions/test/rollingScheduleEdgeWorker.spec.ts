import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  MAX_ROLLING_EDGE_DATES_PER_ENROLLMENT_RUN,
  MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN,
  buildRollingScheduleDueEdgePlan,
  materializeRollingDueEdgesWithStore,
  type RollingScheduleEdgeWorkerStore,
} from '../src/scheduling/rollingScheduleEdgeWorker';
import {
  ROLLING_SCHEDULE_HORIZON_DAYS,
  ROLLING_SCHEDULE_SESSION_SOURCE,
  type RollingScheduleMaterializationState,
} from '../src/scheduling/rollingScheduleMaterializer';
import {
  MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN,
  MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN,
  ROLLING_EDGE_REPLENISHER_SCHEDULE,
  resolveRollingEdgeWorkerTodayYmd,
} from '../src/scheduled/rollingScheduleEdgeReplenisher';

const baseEnrollment = (): Record<string, unknown> => ({
  status: 'active',
  kidId: 'kid-1',
  kidIds: ['kid-1'],
  studentId: 'kid-1',
  childId: 'kid-1',
  studentName: 'Aarav',
  parentId: 'parent-1',
  parentIds: ['parent-1'],
  teacherId: 'teacher-1',
  teacherName: 'Teacher One',
  teacherEmail: 'teacher@example.com',
  courseId: 'course-1',
  courseName: 'Phonics Foundations',
  feePerClass: 400,
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
  scheduleMaterialization: {
    schemaVersion: 1,
    horizonDays: 14,
    scheduleRevision: 3,
    materializedThroughYmd: '2026-09-24',
    nextOccurrenceYmd: '2026-09-25',
    nextMaterializationDueYmd: '2026-09-11',
  },
});

class MemoryStore implements RollingScheduleEdgeWorkerStore {
  sessions = new Map<string, Record<string, unknown>>();
  createCalls: string[] = [];
  metadataUpdates: RollingScheduleMaterializationState[] = [];
  raceIds = new Set<string>();

  async getSessionsByIds(sessionIds: string[]): Promise<Map<string, Record<string, unknown>>> {
    const found = new Map<string, Record<string, unknown>>();
    sessionIds.forEach((sessionId) => {
      const session = this.sessions.get(sessionId);
      if (session) found.set(sessionId, session);
    });
    return found;
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
    this.metadataUpdates.push({...materialization});
  }
}

function enrollmentWithTwoFridaySlots(): Record<string, unknown> {
  const enrollment = baseEnrollment();
  enrollment.schedule = {
    schemaVersion: 1,
    deliveryMode: 'rolling',
    timezone: 'Asia/Kolkata',
    revision: 3,
    weeklySlots: [
      {weekday: 1, time: '04:00', durationMinutes: 35},
      {weekday: 3, time: '04:00', durationMinutes: 35},
      {weekday: 5, time: '04:00', durationMinutes: 35},
      {weekday: 5, time: '05:15', durationMinutes: 40},
    ],
  };
  return enrollment;
}

describe('rolling schedule Brick 4 due-edge worker', () => {
  it('does nothing before the due pointer and performs zero session reads/writes through the store', async () => {
    const enrollment = baseEnrollment();
    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-10',
    });
    expect(plan.isDue).toBe(false);
    expect(plan.occurrences).toEqual([]);

    const store = new MemoryStore();
    const result = await materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-10',
    });
    expect(result.isDue).toBe(false);
    expect(store.createCalls).toEqual([]);
    expect(store.metadataUpdates).toEqual([]);
  });

  it('replenishes only the single new far-edge date in healthy daily operation', () => {
    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      todayYmd: '2026-09-11',
    });

    expect(ROLLING_SCHEDULE_HORIZON_DAYS).toBe(14);
    expect(plan.edgeDates).toEqual(['2026-09-25']);
    expect(plan.occurrences.map((row) => `${row.date} ${row.startTime}`)).toEqual([
      '2026-09-25 04:00',
    ]);
    expect(plan.finalMaterialization).toEqual({
      schemaVersion: 1,
      horizonDays: 14,
      scheduleRevision: 3,
      materializedThroughYmd: '2026-09-25',
      nextOccurrenceYmd: '2026-09-28',
      nextMaterializationDueYmd: '2026-09-14',
    });
    expect(plan.backlogRemaining).toBe(false);
  });

  it('materializes every recurring slot on the one target calendar date, not the intervening window', async () => {
    const enrollment = enrollmentWithTwoFridaySlots();
    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    });
    expect(plan.edgeDates).toEqual(['2026-09-25']);
    expect(plan.occurrences.map((row) => row.sessionId)).toEqual([
      'enrollment-1_20260925_0400',
      'enrollment-1_20260925_0515',
    ]);

    const store = new MemoryStore();
    const result = await materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    });
    expect(result.createdCount).toBe(2);
    expect(store.sessions.size).toBe(2);
    expect([...store.sessions.values()].every((row) => row.date === '2026-09-25')).toBe(true);
    expect([...store.sessions.values()].every((row) => row.source === ROLLING_SCHEDULE_SESSION_SOURCE)).toBe(true);
  });

  it('catches up a short worker outage in one bounded run without rebuilding prior dates', () => {
    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      todayYmd: '2026-09-18',
    });

    expect(plan.edgeDates).toEqual([
      '2026-09-25',
      '2026-09-28',
      '2026-09-30',
      '2026-10-02',
    ]);
    expect(plan.occurrences.map((row) => row.date)).toEqual(plan.edgeDates);
    expect(plan.backlogRemaining).toBe(false);
    expect(plan.finalMaterialization.nextOccurrenceYmd).toBe('2026-10-05');
    expect(plan.finalMaterialization.nextMaterializationDueYmd).toBe('2026-09-21');
  });

  it('caps catch-up dates and leaves the next pointer overdue instead of causing a write spike', () => {
    const plan = buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      todayYmd: '2026-09-21',
    });

    expect(MAX_ROLLING_EDGE_DATES_PER_ENROLLMENT_RUN).toBe(4);
    expect(plan.edgeDates).toHaveLength(4);
    expect(plan.backlogRemaining).toBe(true);
    expect(plan.finalMaterialization.nextOccurrenceYmd).toBe('2026-10-05');
    expect(plan.finalMaterialization.nextMaterializationDueYmd).toBe('2026-09-21');
  });

  it('preserves existing deterministic documents byte-for-byte and creates only missing edge sessions', async () => {
    const enrollment = enrollmentWithTwoFridaySlots();
    const store = new MemoryStore();
    const existingId = 'enrollment-1_20260925_0400';
    const existing = {
      enrollmentId: 'enrollment-1',
      date: '2026-09-25',
      startTime: '04:00',
      status: 'cancelled',
      source: 'manual_one_off',
      note: 'protected exception',
    };
    store.sessions.set(existingId, existing);

    const result = await materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    });

    expect(result.existingCount).toBe(1);
    expect(result.createdCount).toBe(1);
    expect(result.preservedExistingSessionIds).toEqual([existingId]);
    expect(store.sessions.get(existingId)).toEqual(existing);
    expect(store.createCalls).not.toContain(existingId);
    expect(store.metadataUpdates).toHaveLength(1);
  });

  it('treats concurrent deterministic creates as occupied and advances the pointer without overwrite', async () => {
    const store = new MemoryStore();
    const raceId = 'enrollment-1_20260925_0400';
    store.raceIds.add(raceId);

    const result = await materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      todayYmd: '2026-09-11',
    });

    expect(result.createdCount).toBe(0);
    expect(result.raceAlreadyExistsCount).toBe(1);
    expect(store.sessions.get(raceId)).toEqual({source: 'concurrent_writer'});
    expect(store.metadataUpdates).toHaveLength(1);
  });

  it('supports dry-run visibility with point reads but no session or pointer writes', async () => {
    const store = new MemoryStore();
    const result = await materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment: baseEnrollment(),
      todayYmd: '2026-09-11',
      dryRun: true,
    });

    expect(result.wouldCreateCount).toBe(1);
    expect(result.createdCount).toBe(0);
    expect(result.metadataUpdated).toBe(false);
    expect(store.createCalls).toEqual([]);
    expect(store.metadataUpdates).toEqual([]);
  });

  it('fails closed before writes when the current recurrence revision no longer matches the pointer', async () => {
    const enrollment = baseEnrollment();
    enrollment.schedule = {
      ...(enrollment.schedule as Record<string, unknown>),
      revision: 4,
    };
    const store = new MemoryStore();

    await expect(materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    })).rejects.toThrow(/full 14-day rematerialization/i);
    expect(store.sessions.size).toBe(0);
    expect(store.metadataUpdates).toHaveLength(0);
  });

  it('fails closed on a drifted due pointer instead of guessing or widening the horizon', () => {
    const enrollment = baseEnrollment();
    enrollment.scheduleMaterialization = {
      ...(enrollment.scheduleMaterialization as Record<string, unknown>),
      nextMaterializationDueYmd: '2026-09-12',
    };

    expect(() => buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-12',
    })).toThrow(/aligned to the 14-day horizon/i);
  });

  it('refuses paused enrollments even when a stale due pointer is still present', () => {
    const enrollment = baseEnrollment();
    enrollment.status = 'paused';

    expect(() => buildRollingScheduleDueEdgePlan({
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    })).toThrow(/not operationally active/i);
  });

  it('builds all payloads before the first write so missing financial terms cannot partially advance a catch-up', async () => {
    const enrollment = enrollmentWithTwoFridaySlots();
    delete enrollment.feePerClass;
    const store = new MemoryStore();

    await expect(materializeRollingDueEdgesWithStore(store, {
      enrollmentId: 'enrollment-1',
      enrollment,
      todayYmd: '2026-09-11',
    })).rejects.toThrow(/positive billing rate/i);
    expect(store.createCalls).toEqual([]);
    expect(store.metadataUpdates).toEqual([]);
  });

  it('keeps per-enrollment and global work budgets deliberately bounded', () => {
    expect(MAX_ROLLING_EDGE_OCCURRENCES_PER_ENROLLMENT_RUN).toBe(32);
    expect(MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN).toBe(500);
    expect(MAX_ROLLING_EDGE_SESSION_CANDIDATES_PER_RUN).toBe(750);
  });

  it('resolves the scheduler processing day in IST', () => {
    expect(resolveRollingEdgeWorkerTodayYmd(new Date('2026-09-09T19:00:00.000Z'))).toBe('2026-09-10');
    expect(resolveRollingEdgeWorkerTodayYmd(new Date('2026-09-10T18:29:59.000Z'))).toBe('2026-09-10');
    expect(resolveRollingEdgeWorkerTodayYmd(new Date('2026-09-10T18:30:00.000Z'))).toBe('2026-09-11');
  });

  it('discovers work only through the due pointer and never scans classSessions or invokes the full-window materializer', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduled/rollingScheduleEdgeReplenisher.ts'),
      'utf8',
    );
    expect(source).toContain(".where('scheduleMaterialization.nextMaterializationDueYmd', '<=', todayYmd)");
    expect(source).toContain(".orderBy('scheduleMaterialization.nextMaterializationDueYmd', 'asc')");
    expect(source).toContain('.limit(MAX_ROLLING_EDGE_ENROLLMENTS_PER_RUN)');
    expect(source).not.toContain("collection('classSessions')");
    expect(source).not.toContain('materializeRollingEnrollmentWindowInternal');
    expect(source).not.toContain("where('enrollmentId'");
  });

  it('runs once daily without deploying any minute-level polling loop', () => {
    expect(ROLLING_EDGE_REPLENISHER_SCHEDULE).toBe('15 0 * * *');
    const source = readFileSync(
      resolve(process.cwd(), 'functions/src/scheduled/rollingScheduleEdgeReplenisher.ts'),
      'utf8',
    );
    expect(source).toContain("timeZone: ROLLING_EDGE_REPLENISHER_TIME_ZONE");
    expect(source).not.toContain('every 1 minutes');
    expect(source).not.toContain('every 5 minutes');
  });

  it('registers only the scheduled Brick 4 entry point and leaves the legacy finite scheduler untouched', () => {
    const indexSource = readFileSync(resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');
    const finiteSchedulerSource = readFileSync(
      resolve(process.cwd(), 'functions/src/createSessionsFromSchedule.ts'),
      'utf8',
    );
    expect(indexSource).toContain(
      'rollingScheduleEdgeReplenisherDaily',
    );
    expect(finiteSchedulerSource).toContain('saveEnrollmentScheduleAndGenerateSessions');
    expect(finiteSchedulerSource).toContain('plannedSessions');
    expect(finiteSchedulerSource).toContain('weeksAhead');
  });
});
