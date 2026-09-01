import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';
import {
  buildParentMonthClassAttendanceProjection,
} from '../src/parentMonthlyClassAttendanceProjectionV3';
import {
  buildParentClassAttendanceCertifiedBaseline,
} from '../src/helpers/parentClassAttendanceAuthoritativeBaseline';
import {
  inspectParentClassAttendanceShadowReadiness,
  processParentClassAttendanceV4Write,
} from '../src/parentMonthlyClassAttendanceProjectionV4';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

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

const certifiedReadModel = (input: {
  sessions: Array<Record<string, unknown>>;
  commitMs?: number;
}): Record<string, unknown> => {
  const built = buildParentClassAttendanceCertifiedBaseline({
    target: { parentId: 'parent-1', monthKey: '2026-09' },
    sessions: input.sessions,
    previousReadModel: null,
    authoritativeEventId: 'baseline-event',
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

class FakeRef {
  constructor(
    public readonly path: string,
    private readonly dataByPath: Record<string, Record<string, unknown> | null>,
    private readonly reads: string[],
  ) {}

  collection(name: string) {
    return new FakeCollection(`${this.path}/${name}`, this.dataByPath, this.reads);
  }

  async get() {
    this.reads.push(this.path);
    const data = this.dataByPath[this.path] ?? null;
    return {
      exists: Boolean(data),
      data: () => data,
    };
  }
}

class FakeCollection {
  constructor(
    private readonly path: string,
    private readonly dataByPath: Record<string, Record<string, unknown> | null>,
    private readonly reads: string[],
  ) {}

  doc(id: string) {
    return new FakeRef(`${this.path}/${id}`, this.dataByPath, this.reads);
  }
}

const buildReadOnlyDb = (dataByPath: Record<string, Record<string, unknown> | null>) => {
  const reads: string[] = [];
  const db = {
    collection(name: string) {
      return new FakeCollection(name, dataByPath, reads);
    },
  } as unknown as admin.firestore.Firestore;
  return { db, reads };
};

const readModelPath = 'parentMonthlyReadModels/parent-1/months/2026-09';

const noOpTelemetry = async () => undefined;

const noOpV3Recompute = async () => ({
  sourceSessionCount: 1,
  sourceDocumentsRead: 1,
  queryMode: 'parentId_date_month_bounded' as const,
  childRowCount: 1,
});

describe('parent class-attendance Brick 1E V4 wiring', () => {
  it('keeps production on V3 when both gates are disabled', async () => {
    const v3Targets: string[] = [];
    const telemetry: Array<{ liveOutcome: string; shadowOutcome: string }> = [];
    let guardedCalls = 0;

    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-disabled',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: false,
      shadowEnabled: false,
      nowMs: NOW,
      dependencies: {
        guardedExecute: async () => {
          guardedCalls += 1;
          return { mode: 'noop', reason: 'unexpected' };
        },
        v3RecomputeTarget: async ({ target }) => {
          v3Targets.push(`${target.parentId}__${target.monthKey}`);
          return noOpV3Recompute();
        },
        recordTelemetry: async ({ result: row }) => {
          telemetry.push({
            liveOutcome: row.liveOutcome,
            shadowOutcome: row.shadowOutcome,
          });
        },
      },
    });

    expect(guardedCalls).toBe(0);
    expect(v3Targets).toEqual(['parent-1__2026-09']);
    expect(result).toMatchObject({
      liveOutcome: 'delegate_v3',
      liveReason: 'incremental_cutover_disabled',
      shadowOutcome: 'skipped',
      shadowReason: 'shadow_disabled',
    });
    expect(telemetry).toEqual([{ liveOutcome: 'delegate_v3', shadowOutcome: 'skipped' }]);
  });

  it('routes an enabled cutover event through Brick 1D and does not rescan on applied', async () => {
    let v3Calls = 0;
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-applied',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: true,
      shadowEnabled: true,
      nowMs: NOW,
      dependencies: {
        guardedExecute: async () => ({
          mode: 'applied',
          markerId: 'marker-1',
          targets: [{
            parentId: 'parent-1',
            monthKey: '2026-09',
            revisionBefore: 1,
            revisionAfter: 2,
          }],
        }),
        v3RecomputeTarget: async () => {
          v3Calls += 1;
          return noOpV3Recompute();
        },
        recordTelemetry: noOpTelemetry,
      },
    });

    expect(v3Calls).toBe(0);
    expect(result).toMatchObject({
      liveOutcome: 'applied',
      rawMode: 'applied',
      shadowOutcome: 'skipped',
      shadowReason: 'incremental_cutover_enabled',
    });
  });

  it('preserves V3 compatibility fallback when the guarded executor delegates', async () => {
    let v3Calls = 0;
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-delegate',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: true,
      shadowEnabled: false,
      nowMs: NOW,
      dependencies: {
        guardedExecute: async () => ({
          mode: 'delegate_v3',
          reason: 'incremental_baseline_missing_compatibility_target',
        }),
        v3RecomputeTarget: async () => {
          v3Calls += 1;
          return noOpV3Recompute();
        },
        recordTelemetry: noOpTelemetry,
      },
    });

    expect(v3Calls).toBe(1);
    expect(result).toMatchObject({
      liveOutcome: 'delegate_v3',
      liveReason: 'incremental_baseline_missing_compatibility_target',
      rawMode: 'delegate_v3',
    });
  });

  it('uses the authoritative Brick 1C recompute as shadow truth and records exact parity', async () => {
    const baseline = certifiedReadModel({ sessions: [scheduled], commitMs: 1_000 });
    const authoritativeProjection = buildParentMonthClassAttendanceProjection(
      [completed],
      '2026-09',
      NOW,
    );
    let v3Calls = 0;
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-shadow-match',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: false,
      shadowEnabled: true,
      nowMs: NOW,
      dependencies: {
        shadowPreview: async () => ({
          mode: 'candidate',
          baselines: [{
            target: { parentId: 'parent-1', monthKey: '2026-09' },
            readModel: baseline,
          }],
        }),
        authoritativeRecompute: async () => ({
          mode: 'certified',
          baselines: [{
            target: { parentId: 'parent-1', monthKey: '2026-09' },
            projection: authoritativeProjection,
            revisionAfter: 2,
            baselineEpochAfter: 2,
            sourceDocumentsRead: 1,
          }],
        }),
        v3RecomputeTarget: async () => {
          v3Calls += 1;
          return noOpV3Recompute();
        },
        recordTelemetry: noOpTelemetry,
      },
    });

    expect(v3Calls).toBe(0);
    expect(result).toMatchObject({
      liveOutcome: 'delegate_v3',
      liveReason: 'incremental_cutover_disabled_shadow_authoritative',
      shadowOutcome: 'match',
      shadowReason: 'parity_match_1',
    });
  });

  it('certifies a first shadow baseline even when the prior baseline is not yet evaluable', async () => {
    let authoritativeCalls = 0;
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-first-shadow',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: false,
      shadowEnabled: true,
      nowMs: NOW,
      dependencies: {
        shadowPreview: async () => ({ mode: 'not_evaluable', reason: 'baseline_missing' }),
        authoritativeRecompute: async () => {
          authoritativeCalls += 1;
          return {
            mode: 'certified',
            baselines: [{
              target: { parentId: 'parent-1', monthKey: '2026-09' },
              projection: buildParentMonthClassAttendanceProjection([completed], '2026-09', NOW),
              revisionAfter: 1,
              baselineEpochAfter: 1,
              sourceDocumentsRead: 1,
            }],
          };
        },
        v3RecomputeTarget: async () => noOpV3Recompute(),
        recordTelemetry: noOpTelemetry,
      },
    });

    expect(authoritativeCalls).toBe(1);
    expect(result).toMatchObject({
      liveOutcome: 'delegate_v3',
      shadowOutcome: 'not_evaluable',
      shadowReason: 'baseline_missing',
    });
  });

  it('falls back to the existing V3 recompute if shadow certification itself cannot run', async () => {
    let v3Calls = 0;
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-shadow-fallback',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      incrementalEnabled: false,
      shadowEnabled: true,
      nowMs: NOW,
      dependencies: {
        shadowPreview: async () => ({ mode: 'not_evaluable', reason: 'baseline_missing' }),
        authoritativeRecompute: async () => ({
          mode: 'fallback',
          reason: 'authoritative_query_requires_index',
        }),
        v3RecomputeTarget: async () => {
          v3Calls += 1;
          return noOpV3Recompute();
        },
        recordTelemetry: noOpTelemetry,
      },
    });

    expect(v3Calls).toBe(1);
    expect(result).toMatchObject({
      liveOutcome: 'delegate_v3',
      liveReason: 'shadow_authoritative_authoritative_query_requires_index_delegate_v3',
      shadowOutcome: 'not_evaluable',
      shadowReason: 'authoritative_authoritative_query_requires_index',
    });
  });

  it('terminates metadata-only writes before V3, shadow, or telemetry work', async () => {
    let calls = 0;
    const after = { ...scheduled, internalNote: 'metadata only' };
    const result = await processParentClassAttendanceV4Write({
      db: {} as admin.firestore.Firestore,
      eventId: 'event-metadata',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after,
      incrementalEnabled: true,
      shadowEnabled: true,
      dependencies: {
        guardedExecute: async () => {
          calls += 1;
          return { mode: 'noop', reason: 'unexpected' };
        },
        shadowPreview: async () => {
          calls += 1;
          return { mode: 'not_evaluable', reason: 'unexpected' };
        },
        v3RecomputeTarget: async () => {
          calls += 1;
          return noOpV3Recompute();
        },
        recordTelemetry: async () => {
          calls += 1;
        },
      },
    });

    expect(calls).toBe(0);
    expect(result).toMatchObject({
      liveOutcome: 'noop',
      liveReason: 'projection_irrelevant_change',
      targetCount: 0,
    });
  });
});

describe('parent class-attendance Brick 1E shadow readiness reader', () => {
  it('reads only the certified parent-month baseline and produces an incremental candidate', async () => {
    const fake = buildReadOnlyDb({
      [readModelPath]: certifiedReadModel({ sessions: [scheduled], commitMs: 1_000 }),
    });
    const result = await inspectParentClassAttendanceShadowReadiness({
      db: fake.db,
      eventId: 'event-preview',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      targets: [{ parentId: 'parent-1', monthKey: '2026-09' }],
      nowMs: NOW,
    });

    expect(result.mode).toBe('candidate');
    expect(fake.reads).toEqual([readModelPath]);
    expect(fake.reads.some((path) => path.startsWith('classSessions'))).toBe(false);
  });

  it('classifies a delayed event as covered instead of trying to apply its delta', async () => {
    const fake = buildReadOnlyDb({
      [readModelPath]: certifiedReadModel({ sessions: [completed], commitMs: 3_000 }),
    });
    const result = await inspectParentClassAttendanceShadowReadiness({
      db: fake.db,
      eventId: 'event-covered',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      targets: [{ parentId: 'parent-1', monthKey: '2026-09' }],
      nowMs: NOW,
    });

    expect(result).toEqual({ mode: 'covered', targetCount: 1 });
  });

  it('fails closed on an uncertified baseline so the authoritative shadow recompute can certify it', async () => {
    const readModel = certifiedReadModel({ sessions: [scheduled], commitMs: 1_000 });
    const attendance = readModel.attendance as Record<string, unknown>;
    delete attendance.incrementalBaselineSource;
    const fake = buildReadOnlyDb({ [readModelPath]: readModel });

    const result = await inspectParentClassAttendanceShadowReadiness({
      db: fake.db,
      eventId: 'event-uncertified',
      sessionId: 'session-1',
      eventUpdateTime: 2_000,
      before: scheduled,
      after: completed,
      targets: [{ parentId: 'parent-1', monthKey: '2026-09' }],
      nowMs: NOW,
    });

    expect(result).toEqual({
      mode: 'not_evaluable',
      reason: 'baseline_not_authoritatively_certified',
    });
  });
});
