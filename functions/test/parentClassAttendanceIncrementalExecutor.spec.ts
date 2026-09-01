import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type * as admin from 'firebase-admin';
import {
  buildParentMonthClassAttendanceProjection,
} from '../src/parentMonthlyClassAttendanceProjectionV3';
import {
  buildParentClassAttendanceCertifiedBaseline,
  type ParentClassAttendanceBaselineBatchTransactionResult,
} from '../src/helpers/parentClassAttendanceAuthoritativeBaseline';
import {
  executeParentClassAttendanceGuardedEvent,
  isParentClassAttendanceIncrementalCutoverEnabled,
  tryApplyParentClassAttendanceIncrementalEvent,
} from '../src/helpers/parentClassAttendanceIncrementalExecutor';
import {
  parentClassAttendanceIncrementalChangeSignature,
  parentClassAttendanceIncrementalMarkerId,
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
} from '../src/helpers/parentClassAttendanceIncrementalProtocol';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

class FakeRef {
  constructor(public readonly path: string) {}
  collection(name: string) {
    return new FakeCollection(`${this.path}/${name}`);
  }
}

class FakeCollection {
  constructor(private readonly path: string) {}
  doc(id: string) {
    return new FakeRef(`${this.path}/${id}`);
  }
}

const snapshot = (data: Record<string, unknown> | null) => ({
  exists: Boolean(data),
  data: () => data,
});

const buildFakeDb = (initial: Record<string, Record<string, unknown> | null>) => {
  const reads: string[] = [];
  const writes: Array<{
    path: string;
    data: Record<string, unknown>;
    options: unknown;
  }> = [];
  const operations: string[] = [];

  const db = {
    collection(name: string) {
      return new FakeCollection(name);
    },
    async runTransaction<T>(handler: (tx: unknown) => Promise<T>): Promise<T> {
      const tx = {
        async get(ref: FakeRef) {
          reads.push(ref.path);
          operations.push(`read:${ref.path}`);
          return snapshot(initial[ref.path] ?? null);
        },
        set(ref: FakeRef, data: Record<string, unknown>, options: unknown) {
          writes.push({ path: ref.path, data, options });
          operations.push(`write:${ref.path}`);
        },
      };
      return handler(tx);
    },
  } as unknown as admin.firestore.Firestore;

  return { db, reads, writes, operations };
};

const scheduled = {
  parentId: 'parent-1',
  date: '2026-09-03',
  startAt: '2026-09-03T17:00:00+05:30',
  status: 'scheduled',
  kidId: 'kid-1',
};

const completed = {
  ...scheduled,
  status: 'completed',
  attendance: { 'kid-1': { status: 'present' } },
};

const readModelPath = (parentId: string, monthKey: string) =>
  `parentMonthlyReadModels/${parentId}/months/${monthKey}`;

const certifiedReadModel = (input: {
  parentId?: string;
  monthKey?: string;
  sessions: Array<Record<string, unknown>>;
  commitMs?: number;
  eventId?: string;
}): Record<string, unknown> => {
  const parentId = input.parentId ?? 'parent-1';
  const monthKey = input.monthKey ?? '2026-09';
  const built = buildParentClassAttendanceCertifiedBaseline({
    target: { parentId, monthKey },
    sessions: input.sessions,
    previousReadModel: null,
    authoritativeEventId: input.eventId ?? 'baseline-event',
    generatedAtMs: NOW,
  });
  expect(built.mode).toBe('certified');
  if (built.mode !== 'certified') throw new Error(built.reason);
  return {
    ...built.readModelPatch,
    attendance: {
      ...(built.readModelPatch.attendance as Record<string, unknown>),
      incrementalAuthoritativeCommittedAt: {
        toMillis: () => input.commitMs ?? 1_000,
      },
    },
  };
};

const markerPathFor = (eventId: string): string => {
  const markerId = parentClassAttendanceIncrementalMarkerId(eventId);
  expect(markerId).toBeTruthy();
  return `adminStats/parentClassAttendanceIncremental/events/${markerId}`;
};

describe('parent class-attendance Brick 1D transactional executor', () => {
  it('atomically applies one exact target delta and writes one global marker', async () => {
    const eventId = 'event-apply-1';
    const modelPath = readModelPath('parent-1', '2026-09');
    const fake = buildFakeDb({
      [modelPath]: certifiedReadModel({ sessions: [scheduled], commitMs: 1_000 }),
    });

    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId,
      sessionId: 'session-1',
      eventUpdateTime: { toMillis: () => 2_000 },
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });

    expect(result.mode).toBe('applied');
    expect(fake.reads).toEqual([markerPathFor(eventId), modelPath]);
    expect(fake.writes).toHaveLength(2);
    expect(fake.operations.slice(0, 2).every((entry) => entry.startsWith('read:'))).toBe(true);
    expect(fake.operations.slice(2).every((entry) => entry.startsWith('write:'))).toBe(true);

    const modelWrite = fake.writes.find((write) => write.path === modelPath);
    const attendance = modelWrite?.data.attendance as Record<string, unknown>;
    const expected = buildParentMonthClassAttendanceProjection([completed], '2026-09', NOW);
    expect(attendance.totals).toEqual(expected.totals);
    expect(attendance.byKid).toEqual(expected.byKid);
    expect(attendance.sourceSessionCount).toBe(1);
    expect(attendance.incrementalRevision).toBe(2);
    expect(attendance.incrementalLastEventId).toBe(eventId);
    expect(attendance.incrementalBaselineEpoch).toBe(1);
    expect(attendance.incrementalAuthoritativeCommittedAt).toBeTruthy();

    const markerWrite = fake.writes.find((write) => write.path === markerPathFor(eventId));
    expect(markerWrite?.data).toMatchObject({
      eventId,
      sessionId: 'session-1',
      outcome: 'applied',
      protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
      targetKeys: ['parent-1__2026-09'],
    });
  });

  it('records a delayed already-covered event without trying to subtract its before state', async () => {
    const eventId = 'event-covered-1';
    const modelPath = readModelPath('parent-1', '2026-09');
    const fake = buildFakeDb({
      // Baseline already contains AFTER. A delta from scheduled -> completed would not be safe here;
      // coverage must therefore be classified before delta application.
      [modelPath]: certifiedReadModel({ sessions: [completed], commitMs: 2_000 }),
    });

    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId,
      sessionId: 'session-1',
      eventUpdateTime: { toMillis: () => 1_000 },
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });

    expect(result).toEqual({
      mode: 'covered',
      markerId: parentClassAttendanceIncrementalMarkerId(eventId),
      targetCount: 1,
    });
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0].path).toBe(markerPathFor(eventId));
    expect(fake.writes[0].data).toMatchObject({ outcome: 'covered' });
  });

  it('treats an exact global marker as a replay and a mismatched marker as a hard conflict', async () => {
    const eventId = 'event-replay-1';
    const markerId = parentClassAttendanceIncrementalMarkerId(eventId);
    const signature = parentClassAttendanceIncrementalChangeSignature({
      eventId,
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
    });
    expect(markerId).toBeTruthy();
    expect(signature).toBeTruthy();
    if (!markerId || !signature) return;

    const modelPath = readModelPath('parent-1', '2026-09');
    const base = certifiedReadModel({ sessions: [scheduled] });
    const replay = buildFakeDb({
      [modelPath]: base,
      [markerPathFor(eventId)]: {
        changeSignature: signature,
        protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
        outcome: 'applied',
      },
    });
    const replayResult = await tryApplyParentClassAttendanceIncrementalEvent({
      db: replay.db,
      eventId,
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });
    expect(replayResult).toEqual({
      mode: 'replay',
      markerId,
      previousOutcome: 'applied',
    });
    expect(replay.writes).toHaveLength(0);

    const conflict = buildFakeDb({
      [modelPath]: base,
      [markerPathFor(eventId)]: {
        changeSignature: 'different',
        protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
      },
    });
    const conflictResult = await tryApplyParentClassAttendanceIncrementalEvent({
      db: conflict.db,
      eventId,
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });
    expect(conflictResult).toEqual({
      mode: 'conflict',
      reason: 'idempotency_marker_mismatch',
    });
    expect(conflict.writes).toHaveLength(0);
  });

  it('updates both parent/month targets and one marker in the same transaction for a move', async () => {
    const eventId = 'event-move-1';
    const before = {
      parentId: 'parent-1',
      date: '2026-09-30',
      startAt: '2026-09-30T18:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const after = {
      ...before,
      parentId: 'parent-2',
      date: '2026-10-01',
      startAt: '2026-10-01T18:00:00+05:30',
    };
    const oldUnchanged = {
      parentId: 'parent-1',
      date: '2026-09-20',
      status: 'completed',
      kidId: 'kid-old',
    };
    const newUnchanged = {
      parentId: 'parent-2',
      date: '2026-10-02',
      status: 'completed',
      kidId: 'kid-new',
    };
    const oldPath = readModelPath('parent-1', '2026-09');
    const newPath = readModelPath('parent-2', '2026-10');
    const fake = buildFakeDb({
      [oldPath]: certifiedReadModel({
        parentId: 'parent-1',
        monthKey: '2026-09',
        sessions: [before, oldUnchanged],
      }),
      [newPath]: certifiedReadModel({
        parentId: 'parent-2',
        monthKey: '2026-10',
        sessions: [newUnchanged],
      }),
    });

    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId,
      sessionId: 'session-move',
      eventUpdateTime: { toMillis: () => 2_000 },
      before,
      after,
      nowMs: NOW,
    });

    expect(result.mode).toBe('applied');
    expect(fake.reads).toEqual([markerPathFor(eventId), oldPath, newPath]);
    expect(fake.writes).toHaveLength(3);
    expect(fake.operations.slice(0, 3).every((entry) => entry.startsWith('read:'))).toBe(true);
    expect(fake.operations.slice(3).every((entry) => entry.startsWith('write:'))).toBe(true);

    const oldAttendance = fake.writes.find((write) => write.path === oldPath)?.data
      .attendance as Record<string, unknown>;
    const newAttendance = fake.writes.find((write) => write.path === newPath)?.data
      .attendance as Record<string, unknown>;
    expect(oldAttendance.totals).toEqual(
      buildParentMonthClassAttendanceProjection([oldUnchanged], '2026-09', NOW).totals,
    );
    expect(newAttendance.totals).toEqual(
      buildParentMonthClassAttendanceProjection([after, newUnchanged], '2026-10', NOW).totals,
    );
    expect(oldAttendance.incrementalRevision).toBe(2);
    expect(newAttendance.incrementalRevision).toBe(2);
  });

  it('fails closed on mixed authoritative coverage without writing either target', async () => {
    const before = {
      parentId: 'parent-1',
      date: '2026-09-30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const after = {
      ...before,
      parentId: 'parent-2',
      date: '2026-10-01',
    };
    const oldPath = readModelPath('parent-1', '2026-09');
    const newPath = readModelPath('parent-2', '2026-10');
    const fake = buildFakeDb({
      [oldPath]: certifiedReadModel({
        parentId: 'parent-1',
        monthKey: '2026-09',
        sessions: [before],
        commitMs: 3_000,
      }),
      [newPath]: certifiedReadModel({
        parentId: 'parent-2',
        monthKey: '2026-10',
        sessions: [],
        commitMs: 1_000,
      }),
    });

    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId: 'event-mixed',
      sessionId: 'session-move',
      eventUpdateTime: 2_000,
      before,
      after,
      nowMs: NOW,
    });
    expect(result).toEqual({ mode: 'fallback', reason: 'mixed_authoritative_coverage' });
    expect(fake.writes).toHaveLength(0);
  });

  it('requires a Brick 1C-certified baseline and refuses legacy/no-date targets', async () => {
    const modelPath = readModelPath('parent-1', '2026-09');
    const uncertified = certifiedReadModel({ sessions: [scheduled] });
    const attendance = uncertified.attendance as Record<string, unknown>;
    delete attendance.incrementalBaselineSource;
    const fake = buildFakeDb({ [modelPath]: uncertified });
    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId: 'event-uncertified',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });
    expect(result).toEqual({
      mode: 'fallback',
      reason: 'baseline_not_authoritatively_certified',
    });
    expect(fake.writes).toHaveLength(0);

    const legacyBefore = {
      parentId: 'parent-1',
      startAt: '2026-09-03T17:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const legacy = buildFakeDb({});
    const legacyResult = await tryApplyParentClassAttendanceIncrementalEvent({
      db: legacy.db,
      eventId: 'event-legacy',
      sessionId: 'session-legacy',
      eventUpdateTime: 2_000,
      before: legacyBefore,
      after: { ...legacyBefore, status: 'completed' },
      nowMs: NOW,
    });
    expect(legacyResult).toEqual({
      mode: 'fallback',
      reason: 'legacy_or_mismatched_target_requires_authoritative',
    });
    expect(legacy.reads).toHaveLength(0);
  });

  it('keeps delete delivery fail-closed for the guarded authoritative fallback', async () => {
    const modelPath = readModelPath('parent-1', '2026-09');
    const fake = buildFakeDb({
      [modelPath]: certifiedReadModel({ sessions: [scheduled] }),
    });
    const result = await tryApplyParentClassAttendanceIncrementalEvent({
      db: fake.db,
      eventId: 'event-delete',
      sessionId: 'session-1',
      eventUpdateTime: null,
      before: scheduled,
      after: null,
      nowMs: NOW,
    });
    expect(result).toEqual({
      mode: 'fallback',
      reason: 'delete_event_requires_authoritative_recompute',
    });
    expect(fake.writes).toHaveLength(0);
  });

  it('contains no classSessions query in the incremental executor', () => {
    const source = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'functions/src/helpers/parentClassAttendanceIncrementalExecutor.ts',
      ),
      'utf8',
    );
    const fastPathSection = source.split('export const isParentClassAttendanceIncrementalCutoverEnabled')[0];
    expect(fastPathSection).toContain('runTransaction');
    expect(fastPathSection).toContain(".doc('parentClassAttendanceIncremental')");
    expect(fastPathSection).toContain(".collection('parentMonthlyReadModels')");
    expect(fastPathSection).not.toContain("collection('classSessions')");
  });
});

describe('parent class-attendance Brick 1D guarded cutover', () => {
  it('is disabled by default and only accepts an explicit true gate', () => {
    expect(isParentClassAttendanceIncrementalCutoverEnabled(undefined)).toBe(false);
    expect(isParentClassAttendanceIncrementalCutoverEnabled(false)).toBe(false);
    expect(isParentClassAttendanceIncrementalCutoverEnabled('false')).toBe(false);
    expect(isParentClassAttendanceIncrementalCutoverEnabled('true')).toBe(true);
    expect(isParentClassAttendanceIncrementalCutoverEnabled(true)).toBe(true);
  });

  it('delegates immediately to V3 while the cutover gate is disabled', async () => {
    const fake = buildFakeDb({});
    const result = await executeParentClassAttendanceGuardedEvent({
      db: fake.db,
      incrementalEnabled: false,
      eventId: 'event-disabled',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      nowMs: NOW,
    });
    expect(result).toEqual({ mode: 'delegate_v3', reason: 'incremental_cutover_disabled' });
    expect(fake.reads).toHaveLength(0);
    expect(fake.writes).toHaveLength(0);
  });

  it('routes an ambiguous canonical event to Brick 1C authoritative recompute', async () => {
    const modelPath = readModelPath('parent-1', '2026-09');
    const fake = buildFakeDb({
      [modelPath]: certifiedReadModel({ sessions: [scheduled], commitMs: 2_000 }),
    });
    const calls: Array<{ targetCount: number; eventId: unknown }> = [];
    const authoritativeRecompute = async (input: {
      targets: Array<{ parentId: string; monthKey: string }>;
      authoritativeEventId: unknown;
    }): Promise<ParentClassAttendanceBaselineBatchTransactionResult> => {
      calls.push({ targetCount: input.targets.length, eventId: input.authoritativeEventId });
      return {
        mode: 'certified',
        baselines: input.targets.map((target) => ({
          target,
          projection: buildParentMonthClassAttendanceProjection([completed], target.monthKey, NOW),
          revisionAfter: 2,
          baselineEpochAfter: 2,
          sourceDocumentsRead: 1,
        })),
      };
    };

    const result = await executeParentClassAttendanceGuardedEvent({
      db: fake.db,
      incrementalEnabled: true,
      eventId: 'event-ambiguous',
      sessionId: 'session-1',
      // Equal to the authoritative commit watermark => ambiguous by design.
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      nowMs: NOW,
      authoritativeRecompute: authoritativeRecompute as never,
    });

    expect(result).toEqual({
      mode: 'authoritative_recomputed',
      reason: 'incremental_fallback_authoritative_watermark_ambiguous',
      targetCount: 1,
    });
    expect(calls).toEqual([{ targetCount: 1, eventId: 'event-ambiguous' }]);
  });

  it('routes delete events to Brick 1C and legacy targets back to V3', async () => {
    const modelPath = readModelPath('parent-1', '2026-09');
    const fake = buildFakeDb({
      [modelPath]: certifiedReadModel({ sessions: [scheduled] }),
    });
    let recomputeCalls = 0;
    const authoritativeRecompute = async (input: {
      targets: Array<{ parentId: string; monthKey: string }>;
    }): Promise<ParentClassAttendanceBaselineBatchTransactionResult> => {
      recomputeCalls += 1;
      return {
        mode: 'certified',
        baselines: input.targets.map((target) => ({
          target,
          projection: buildParentMonthClassAttendanceProjection([], target.monthKey, NOW),
          revisionAfter: 2,
          baselineEpochAfter: 2,
          sourceDocumentsRead: 0,
        })),
      };
    };
    const deletion = await executeParentClassAttendanceGuardedEvent({
      db: fake.db,
      incrementalEnabled: true,
      eventId: 'event-delete-guarded',
      sessionId: 'session-1',
      eventUpdateTime: null,
      before: scheduled,
      after: null,
      nowMs: NOW,
      authoritativeRecompute: authoritativeRecompute as never,
    });
    expect(deletion).toEqual({
      mode: 'authoritative_recomputed',
      reason: 'incremental_fallback_delete_event_requires_authoritative_recompute',
      targetCount: 1,
    });
    expect(recomputeCalls).toBe(1);

    const legacyBefore = {
      parentId: 'parent-1',
      startAt: '2026-09-03T17:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const legacyFake = buildFakeDb({});
    const legacy = await executeParentClassAttendanceGuardedEvent({
      db: legacyFake.db,
      incrementalEnabled: true,
      eventId: 'event-legacy-guarded',
      sessionId: 'session-legacy',
      eventUpdateTime: 2_000,
      before: legacyBefore,
      after: { ...legacyBefore, status: 'completed' },
      nowMs: NOW,
      authoritativeRecompute: authoritativeRecompute as never,
    });
    expect(legacy.mode).toBe('delegate_v3');
    expect(recomputeCalls).toBe(1);
  });
});
