import { describe, expect, it } from 'vitest';
import {
  buildParentMonthClassAttendanceProjection,
  type ParentMonthClassAttendanceProjection,
} from '../src/parentMonthlyClassAttendanceProjectionV3';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
  PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
  PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
  evaluateParentClassAttendanceIncrementalReplay,
  parentClassAttendanceIncrementalChangeSignature,
  parentClassAttendanceIncrementalMarkerId,
  planParentClassAttendanceIncrementalTransaction,
  type ParentClassAttendanceIncrementalBaseline,
} from '../src/helpers/parentClassAttendanceIncrementalProtocol';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

const project = (
  sessions: Array<Record<string, unknown>>,
  monthKey = '2026-09',
): ParentMonthClassAttendanceProjection =>
  buildParentMonthClassAttendanceProjection(sessions, monthKey, NOW);

const baseline = (input: {
  parentId?: string;
  monthKey?: string;
  sessions?: Array<Record<string, unknown>>;
  projection?: ParentMonthClassAttendanceProjection;
  revision?: number;
  attendanceOverrides?: Record<string, unknown>;
  readModelOverrides?: Record<string, unknown>;
} = {}): ParentClassAttendanceIncrementalBaseline => {
  const parentId = input.parentId ?? 'parent-1';
  const monthKey = input.monthKey ?? '2026-09';
  const projection = input.projection ?? project(input.sessions ?? [], monthKey);
  return {
    target: { parentId, monthKey },
    readModel: {
      parentId,
      monthKey,
      attendance: {
        schemaVersion: 3,
        modelType: 'class_attendance_v3',
        incrementalProtocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
        incrementalTransactionFence: PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
        incrementalRecomputeState: PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
        incrementalRevision: input.revision ?? 7,
        sourceSessionCount: projection.sourceSessionRecords,
        unassignedSessionRecords: projection.unassignedSessionRecords,
        legacyKidAliasOnlySessionRecords: projection.legacyKidAliasOnlySessionRecords,
        totals: projection.totals,
        byKid: projection.byKid,
        ...input.attendanceOverrides,
      },
      ...input.readModelOverrides,
    },
  };
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

describe('parent class-attendance incremental transaction protocol', () => {
  it('builds a stable opaque marker id from CloudEvent identity', () => {
    const first = parentClassAttendanceIncrementalMarkerId('event-123');
    const second = parentClassAttendanceIncrementalMarkerId('event-123');
    const other = parentClassAttendanceIncrementalMarkerId('event-456');

    expect(first).toBe(second);
    expect(first).toMatch(/^pca1_[a-f0-9]{40}$/);
    expect(other).not.toBe(first);
    expect(first).not.toContain('event-123');
  });

  it('builds a deterministic change signature across object key order and timestamp shapes', () => {
    const beforeA = {
      parentId: 'parent-1',
      date: '2026-09-03',
      startAt: { seconds: 1_788_441_000, nanoseconds: 123_000_000 },
      kidId: 'kid-1',
      attendance: { 'kid-1': { status: 'present', markedBy: 'teacher-1' } },
    };
    const beforeB = {
      attendance: { 'kid-1': { markedBy: 'teacher-1', status: 'present' } },
      kidId: 'kid-1',
      startAt: { nanoseconds: 123_000_000, seconds: 1_788_441_000 },
      date: '2026-09-03',
      parentId: 'parent-1',
    };

    const a = parentClassAttendanceIncrementalChangeSignature({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: beforeA,
      after: null,
    });
    const b = parentClassAttendanceIncrementalChangeSignature({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: beforeB,
      after: null,
    });

    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails closed when CloudEvent or session identity is missing', () => {
    expect(
      planParentClassAttendanceIncrementalTransaction({
        eventId: '',
        sessionId: 'session-1',
        before: scheduled,
        after: completed,
        baselines: [baseline({ sessions: [scheduled] })],
        nowMs: NOW,
      }),
    ).toEqual({ mode: 'fallback', reason: 'missing_event_identity' });

    expect(
      planParentClassAttendanceIncrementalTransaction({
        eventId: 'event-1',
        sessionId: '',
        before: scheduled,
        after: completed,
        baselines: [baseline({ sessions: [scheduled] })],
        nowMs: NOW,
      }),
    ).toEqual({ mode: 'fallback', reason: 'missing_event_identity' });
  });

  it('returns noop for a projection-equivalent metadata-only write without requiring a baseline', () => {
    const after = { ...scheduled, teacherRemark: 'great class', meetingUrl: 'https://example.test' };
    expect(
      planParentClassAttendanceIncrementalTransaction({
        eventId: 'event-1',
        sessionId: 'session-1',
        before: scheduled,
        after,
        baselines: [],
        nowMs: NOW,
      }),
    ).toEqual({ mode: 'noop', reason: 'planner_noop' });
  });

  it('fails closed when the exact delta planner cannot resolve a target', () => {
    const unresolved = { status: 'scheduled', kidId: 'kid-1' };
    const decision = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: unresolved,
      after: { ...unresolved, status: 'completed' },
      baselines: [],
      nowMs: NOW,
    });

    expect(decision.mode).toBe('fallback');
    if (decision.mode === 'fallback') expect(decision.reason).toContain('planner_');
  });

  it('produces a one-target candidate with exact next projection and revision', () => {
    const unchanged = {
      parentId: 'parent-1',
      date: '2026-09-04',
      startAt: '2026-09-04T17:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-1',
    };
    const decision = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [baseline({ sessions: [scheduled, unchanged], revision: 11 })],
      nowMs: NOW,
    });

    expect(decision.mode).toBe('candidate');
    if (decision.mode !== 'candidate') return;
    expect(decision.protocolVersion).toBe(PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION);
    expect(decision.mutations).toHaveLength(1);
    expect(decision.mutations[0].revisionBefore).toBe(11);
    expect(decision.mutations[0].revisionAfter).toBe(12);
    expect(decision.mutations[0].nextProjection).toEqual(project([completed, unchanged]));
  });

  it('produces one atomic candidate containing both targets for a parent/month move', () => {
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

    const decision = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-move',
      sessionId: 'session-move',
      before,
      after,
      baselines: [
        baseline({ parentId: 'parent-1', monthKey: '2026-09', sessions: [before, oldUnchanged], revision: 2 }),
        baseline({ parentId: 'parent-2', monthKey: '2026-10', projection: project([newUnchanged], '2026-10'), revision: 9 }),
      ],
      nowMs: NOW,
    });

    expect(decision.mode).toBe('candidate');
    if (decision.mode !== 'candidate') return;
    expect(decision.mutations).toHaveLength(2);

    const oldMutation = decision.mutations.find((entry) => entry.target.parentId === 'parent-1');
    const newMutation = decision.mutations.find((entry) => entry.target.parentId === 'parent-2');
    expect(oldMutation?.nextProjection).toEqual(project([oldUnchanged], '2026-09'));
    expect(newMutation?.nextProjection).toEqual(project([after, newUnchanged], '2026-10'));
    expect(oldMutation?.revisionAfter).toBe(3);
    expect(newMutation?.revisionAfter).toBe(10);
  });

  it('fails closed when baseline targets are missing, extra, or duplicated', () => {
    const missing = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [],
      nowMs: NOW,
    });
    expect(missing).toEqual({ mode: 'fallback', reason: 'baseline_target_set_mismatch' });

    const duplicateBaseline = baseline({ sessions: [scheduled] });
    const duplicate = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [duplicateBaseline, duplicateBaseline],
      nowMs: NOW,
    });
    expect(duplicate).toEqual({ mode: 'fallback', reason: 'duplicate_baseline_target' });
  });

  it('requires an authoritative V3 transaction-coordinated idle baseline with an integer revision', () => {
    const cases: Array<[Record<string, unknown>, string]> = [
      [{ schemaVersion: 2 }, 'attendance_projection_not_authoritative_v3'],
      [{ incrementalTransactionFence: 'wrong' }, 'baseline_not_transaction_coordinated'],
      [{ incrementalProtocolVersion: 0 }, 'baseline_not_transaction_coordinated'],
      [{ incrementalRevision: 1.5 }, 'baseline_not_transaction_coordinated'],
      [{ incrementalRecomputeState: 'running' }, 'recompute_in_progress'],
    ];

    for (const [attendanceOverrides, reason] of cases) {
      const decision = planParentClassAttendanceIncrementalTransaction({
        eventId: `event-${reason}`,
        sessionId: 'session-1',
        before: scheduled,
        after: completed,
        baselines: [baseline({ sessions: [scheduled], attendanceOverrides })],
        nowMs: NOW,
      });
      expect(decision).toEqual({ mode: 'fallback', reason });
    }
  });

  it('fails closed when a stale baseline cannot safely subtract the before contribution', () => {
    const decision = planParentClassAttendanceIncrementalTransaction({
      eventId: 'event-stale',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [baseline({ sessions: [] })],
      nowMs: NOW,
    });

    expect(decision).toEqual({
      mode: 'fallback',
      reason: 'delta_would_violate_projection_invariants',
    });
  });

  it('accepts only an exact marker signature/protocol replay and rejects conflicts', () => {
    const markerId = parentClassAttendanceIncrementalMarkerId('event-1');
    const changeSignature = parentClassAttendanceIncrementalChangeSignature({
      eventId: 'event-1',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
    });
    expect(markerId).not.toBeNull();
    expect(changeSignature).not.toBeNull();
    if (!markerId || !changeSignature) return;

    expect(
      evaluateParentClassAttendanceIncrementalReplay({
        markerId,
        changeSignature,
        existingMarker: {
          changeSignature,
          protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
        },
      }),
    ).toEqual({ mode: 'replay', markerId });

    expect(
      evaluateParentClassAttendanceIncrementalReplay({
        markerId,
        changeSignature,
        existingMarker: {
          changeSignature: 'different',
          protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
        },
      }),
    ).toEqual({ mode: 'conflict', reason: 'idempotency_marker_mismatch' });

    expect(
      evaluateParentClassAttendanceIncrementalReplay({
        markerId,
        changeSignature,
        existingMarker: {
          changeSignature,
          protocolVersion: PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION + 1,
        },
      }),
    ).toEqual({ mode: 'conflict', reason: 'idempotency_marker_mismatch' });
  });
});
