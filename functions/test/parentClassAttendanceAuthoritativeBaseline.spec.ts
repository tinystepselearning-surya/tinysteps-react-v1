import { describe, expect, it } from 'vitest';
import {
  buildParentMonthClassAttendanceProjection,
  type ParentMonthClassAttendanceProjection,
} from '../src/parentMonthlyClassAttendanceProjectionV3';
import {
  PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE,
  buildParentClassAttendanceCertifiedBaseline,
  classifyParentClassAttendanceEventAgainstBaseline,
} from '../src/helpers/parentClassAttendanceAuthoritativeBaseline';
import {
  PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
  PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
  PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
  type ParentClassAttendanceIncrementalBaseline,
} from '../src/helpers/parentClassAttendanceIncrementalProtocol';
import { evaluateParentClassAttendanceShadowParity } from '../src/helpers/parentClassAttendanceShadowParity';

const NOW = Date.parse('2026-09-01T06:00:00+05:30');

const project = (
  sessions: Array<Record<string, unknown>>,
  monthKey = '2026-09',
): ParentMonthClassAttendanceProjection =>
  buildParentMonthClassAttendanceProjection(sessions, monthKey, NOW);

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

const certifiedBaseline = (input: {
  parentId?: string;
  monthKey?: string;
  sessions?: Array<Record<string, unknown>>;
  previousReadModel?: Record<string, unknown> | null;
  eventId?: string;
} = {}): ParentClassAttendanceIncrementalBaseline => {
  const parentId = input.parentId ?? 'parent-1';
  const monthKey = input.monthKey ?? '2026-09';
  const built = buildParentClassAttendanceCertifiedBaseline({
    target: { parentId, monthKey },
    sessions: input.sessions ?? [],
    previousReadModel: input.previousReadModel ?? null,
    authoritativeEventId: input.eventId ?? 'baseline-event',
    generatedAtMs: NOW,
  });
  expect(built.mode).toBe('certified');
  if (built.mode !== 'certified') {
    throw new Error(`expected certified baseline, got ${built.reason}`);
  }
  return {
    target: { parentId, monthKey },
    readModel: built.readModelPatch,
  };
};

describe('parent class-attendance authoritative baseline coordination', () => {
  it('builds a transaction-certified V3 baseline from the canonical parent-month source set', () => {
    const unchanged = {
      parentId: 'parent-1',
      date: '2026-09-04',
      startAt: '2026-09-04T17:00:00+05:30',
      status: 'completed',
      kidId: 'kid-2',
      attendance: { 'kid-2': { status: 'late' } },
    };

    const built = buildParentClassAttendanceCertifiedBaseline({
      target: { parentId: 'parent-1', monthKey: '2026-09' },
      sessions: [scheduled, unchanged],
      sourceDocumentsRead: 2,
      previousReadModel: null,
      authoritativeEventId: 'event-bootstrap',
      generatedAtMs: NOW,
    });

    expect(built.mode).toBe('certified');
    if (built.mode !== 'certified') return;
    expect(built.projection).toEqual(project([scheduled, unchanged]));
    expect(built.revisionBefore).toBe(0);
    expect(built.revisionAfter).toBe(1);
    expect(built.baselineEpochBefore).toBe(0);
    expect(built.baselineEpochAfter).toBe(1);

    const attendance = built.readModelPatch.attendance as Record<string, unknown>;
    expect(attendance.schemaVersion).toBe(3);
    expect(attendance.modelType).toBe('class_attendance_v3');
    expect(attendance.incrementalProtocolVersion).toBe(
      PARENT_CLASS_ATTENDANCE_INCREMENTAL_PROTOCOL_VERSION,
    );
    expect(attendance.incrementalTransactionFence).toBe(
      PARENT_CLASS_ATTENDANCE_TRANSACTION_FENCE,
    );
    expect(attendance.incrementalRecomputeState).toBe(
      PARENT_CLASS_ATTENDANCE_RECOMPUTE_STATE_IDLE,
    );
    expect(attendance.incrementalBaselineSource).toBe(PARENT_CLASS_ATTENDANCE_BASELINE_SOURCE);
    expect(attendance.incrementalRevision).toBe(1);
    expect(attendance.incrementalBaselineEpoch).toBe(1);
    expect(attendance.queryMode).toBe('parentId_date_month_transaction');
    expect(attendance.sourceSessionCount).toBe(2);
    expect(attendance.sourceDocumentsRead).toBe(2);
  });

  it('advances an existing certified revision and baseline epoch monotonically', () => {
    const previous = {
      parentId: 'parent-1',
      monthKey: '2026-09',
      attendance: {
        schemaVersion: 3,
        incrementalRevision: 12,
        incrementalBaselineEpoch: 4,
      },
    };
    const built = buildParentClassAttendanceCertifiedBaseline({
      target: { parentId: 'parent-1', monthKey: '2026-09' },
      sessions: [completed],
      previousReadModel: previous,
      authoritativeEventId: 'event-refresh',
      generatedAtMs: NOW,
    });

    expect(built.mode).toBe('certified');
    if (built.mode !== 'certified') return;
    expect(built.revisionBefore).toBe(12);
    expect(built.revisionAfter).toBe(13);
    expect(built.baselineEpochBefore).toBe(4);
    expect(built.baselineEpochAfter).toBe(5);
  });

  it('fails closed for compatibility targets, invalid source targets, and unsafe caps', () => {
    expect(
      buildParentClassAttendanceCertifiedBaseline({
        target: { parentId: 'parent-1', monthKey: '2026-09', requiresCompatibility: true },
        sessions: [scheduled],
        previousReadModel: null,
        authoritativeEventId: 'event-1',
        generatedAtMs: NOW,
      }),
    ).toEqual({ mode: 'fallback', reason: 'legacy_target_requires_compatibility' });

    expect(
      buildParentClassAttendanceCertifiedBaseline({
        target: { parentId: 'parent-1', monthKey: '2026-09' },
        sessions: [{ ...scheduled, parentId: 'parent-other' }],
        previousReadModel: null,
        authoritativeEventId: 'event-2',
        generatedAtMs: NOW,
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_source_target_mismatch' });

    expect(
      buildParentClassAttendanceCertifiedBaseline({
        target: { parentId: 'parent-1', monthKey: '2026-09' },
        sessions: [scheduled],
        sourceDocumentsRead: 251,
        previousReadModel: null,
        authoritativeEventId: 'event-3',
        generatedAtMs: NOW,
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_source_cap_exceeded' });
  });

  it('does not silently reset corrupted revision or epoch metadata', () => {
    const invalidRevision = buildParentClassAttendanceCertifiedBaseline({
      target: { parentId: 'parent-1', monthKey: '2026-09' },
      sessions: [scheduled],
      previousReadModel: {
        attendance: { incrementalRevision: 1.5 },
      },
      authoritativeEventId: 'event-invalid-revision',
      generatedAtMs: NOW,
    });
    expect(invalidRevision).toEqual({ mode: 'fallback', reason: 'existing_revision_invalid' });

    const invalidEpoch = buildParentClassAttendanceCertifiedBaseline({
      target: { parentId: 'parent-1', monthKey: '2026-09' },
      sessions: [scheduled],
      previousReadModel: {
        attendance: { incrementalRevision: 2, incrementalBaselineEpoch: -1 },
      },
      authoritativeEventId: 'event-invalid-epoch',
      generatedAtMs: NOW,
    });
    expect(invalidEpoch).toEqual({ mode: 'fallback', reason: 'existing_baseline_epoch_invalid' });
  });

  it('classifies create/update coverage only from an unambiguous transaction commit watermark', () => {
    expect(
      classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: true,
        eventUpdateTime: { toMillis: () => 1_000 },
        authoritativeCommittedAt: { seconds: 2, nanoseconds: 0 },
      }),
    ).toEqual({ mode: 'covered', reason: 'event_precedes_authoritative_commit' });

    expect(
      classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: true,
        eventUpdateTime: 3_000,
        authoritativeCommittedAt: new Date(2_000),
      }),
    ).toEqual({ mode: 'uncovered', reason: 'event_follows_authoritative_commit' });

    expect(
      classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: true,
        eventUpdateTime: 2_000,
        authoritativeCommittedAt: 2_000,
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_watermark_ambiguous' });

    expect(
      classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: true,
        eventUpdateTime: null,
        authoritativeCommittedAt: 2_000,
      }),
    ).toEqual({ mode: 'fallback', reason: 'authoritative_watermark_missing' });
  });

  it('keeps deletes on authoritative recompute because before.updateTime cannot prove delete coverage', () => {
    expect(
      classifyParentClassAttendanceEventAgainstBaseline({
        afterExists: false,
        eventUpdateTime: 3_000,
        authoritativeCommittedAt: 4_000,
      }),
    ).toEqual({ mode: 'fallback', reason: 'delete_event_requires_authoritative_recompute' });
  });
});

describe('parent class-attendance Brick 1C shadow parity', () => {
  it('matches the authoritative full projection for a one-target status/attendance update', () => {
    const unchanged = {
      parentId: 'parent-1',
      date: '2026-09-04',
      startAt: '2026-09-04T17:00:00+05:30',
      status: 'scheduled',
      kidId: 'kid-2',
    };
    const result = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-update',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [certifiedBaseline({ sessions: [scheduled, unchanged] })],
      authoritative: [
        {
          target: { parentId: 'parent-1', monthKey: '2026-09' },
          projection: project([completed, unchanged]),
        },
      ],
      nowMs: NOW,
    });

    expect(result).toEqual({ mode: 'match', targetCount: 1 });
  });

  it('matches both authoritative targets for a parent/month move', () => {
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

    const result = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-move',
      sessionId: 'session-move',
      before,
      after,
      baselines: [
        certifiedBaseline({ parentId: 'parent-1', monthKey: '2026-09', sessions: [before, oldUnchanged] }),
        certifiedBaseline({ parentId: 'parent-2', monthKey: '2026-10', sessions: [newUnchanged] }),
      ],
      authoritative: [
        {
          target: { parentId: 'parent-1', monthKey: '2026-09' },
          projection: project([oldUnchanged], '2026-09'),
        },
        {
          target: { parentId: 'parent-2', monthKey: '2026-10' },
          projection: project([after, newUnchanged], '2026-10'),
        },
      ],
      nowMs: NOW,
    });

    expect(result).toEqual({ mode: 'match', targetCount: 2 });
  });

  it('detects a real projection mismatch instead of accepting approximate parity', () => {
    const result = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-mismatch',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [certifiedBaseline({ sessions: [scheduled] })],
      authoritative: [
        {
          target: { parentId: 'parent-1', monthKey: '2026-09' },
          projection: project([scheduled]),
        },
      ],
      nowMs: NOW,
    });

    expect(result).toEqual({
      mode: 'mismatch',
      mismatchedTargetKeys: ['parent-1__2026-09'],
    });
  });

  it('refuses to evaluate when the incremental baseline or authoritative target set is incomplete', () => {
    const noBaseline = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-no-baseline',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [],
      authoritative: [
        {
          target: { parentId: 'parent-1', monthKey: '2026-09' },
          projection: project([completed]),
        },
      ],
      nowMs: NOW,
    });
    expect(noBaseline).toEqual({
      mode: 'not_evaluable',
      reason: 'incremental_baseline_target_set_mismatch',
    });

    const baseline = certifiedBaseline({ sessions: [scheduled] });
    const missingAuthoritative = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-no-authoritative',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [baseline],
      authoritative: [],
      nowMs: NOW,
    });
    expect(missingAuthoritative).toEqual({
      mode: 'not_evaluable',
      reason: 'authoritative_target_set_mismatch',
    });

    const duplicateAuthoritative = evaluateParentClassAttendanceShadowParity({
      eventId: 'event-duplicate-authoritative',
      sessionId: 'session-1',
      before: scheduled,
      after: completed,
      baselines: [baseline],
      authoritative: [
        { target: { parentId: 'parent-1', monthKey: '2026-09' }, projection: project([completed]) },
        { target: { parentId: 'parent-1', monthKey: '2026-09' }, projection: project([completed]) },
      ],
      nowMs: NOW,
    });
    expect(duplicateAuthoritative).toEqual({
      mode: 'not_evaluable',
      reason: 'duplicate_authoritative_target',
    });
  });
});
