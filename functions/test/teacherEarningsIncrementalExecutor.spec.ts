import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type * as admin from 'firebase-admin';
import { tryApplyTeacherEarningsIncrementalEvent } from '../src/helpers/teacherEarningsIncrementalExecutor';
import {
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
} from '../src/helpers/teacherEarningsIncrementalProtocol';

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

const snap = (exists: boolean, data: Record<string, unknown> | null) => ({
  exists,
  data: () => data,
});

const coordinatedRollup = {
  month: '2026-08',
  monthKey: '2026-08',
  totalEarnings: 1000,
  pendingEarnings: 600,
  totalSessions: 5,
  sessionsCompleted: 5,
  demoEarnings: 100,
  demoCompletedCount: 1,
  demoEnrollmentBonusCount: 0,
  payments: [],
  rollupSource: 'teacherEarnings_events_v1',
  rollupVersion: 1,
  incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE,
  incrementalRecomputeState: 'idle',
  incrementalRevision: 12,
  incrementalAuthoritativeCommittedAt: { toMillis: () => 1_000 },
};

const buildFakeDb = (input: {
  rollup?: Record<string, unknown> | null;
  marker?: Record<string, unknown> | null;
}) => {
  const writes: Array<{ path: string; data: Record<string, unknown>; options: unknown }> = [];
  const reads: string[] = [];
  const db = {
    collection(name: string) {
      return new FakeCollection(name);
    },
    async runTransaction<T>(handler: (tx: unknown) => Promise<T>): Promise<T> {
      const tx = {
        async get(ref: FakeRef) {
          reads.push(ref.path);
          if (ref.path.includes('/incrementalEvents/')) {
            return snap(Boolean(input.marker), input.marker || null);
          }
          return snap(Boolean(input.rollup), input.rollup || null);
        },
        set(ref: FakeRef, data: Record<string, unknown>, options: unknown) {
          writes.push({ path: ref.path, data, options });
        },
      };
      return handler(tx);
    },
  } as unknown as admin.firestore.Firestore;

  return { db, reads, writes };
};

const demoCreate = {
  eventId: 'evt-demo-1',
  earningId: 'demo_demo-1_completion',
  eventUpdateTime: { toMillis: () => 2_000 },
  before: null,
  after: {
    teacherId: 'teacher-1',
    monthKey: '2026-08',
    amount: 100,
    status: 'unpaid',
    source: 'demo_completed',
  },
};

describe('B6 Brick 7C2 incremental executor', () => {
  it('atomically applies an eligible delta and writes its event marker', async () => {
    const fake = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...demoCreate });

    expect(result.mode).toBe('applied');
    expect(fake.reads).toHaveLength(2);
    expect(fake.writes).toHaveLength(2);
    const rollupWrite = fake.writes.find((write) => write.path === 'teachers/teacher-1/earnings/2026-08');
    expect(rollupWrite?.data).toMatchObject({
      totalEarnings: 1100,
      pendingEarnings: 700,
      demoEarnings: 200,
      demoCompletedCount: 2,
      incrementalRevision: 13,
      incrementalLastEventId: 'evt-demo-1',
    });
    expect(rollupWrite?.data).not.toHaveProperty('incrementalAuthoritativeCommittedAt');

    const markerWrite = fake.writes.find((write) => write.path.includes('/incrementalEvents/'));
    expect(markerWrite?.data).toMatchObject({
      eventId: 'evt-demo-1',
      outcome: 'applied',
      revisionBefore: 12,
      revisionAfter: 13,
    });
  });

  it('records a delayed event as covered without changing rollup totals', async () => {
    const fake = buildFakeDb({
      rollup: coordinatedRollup,
      marker: null,
    });
    const result = await tryApplyTeacherEarningsIncrementalEvent({
      db: fake.db,
      ...demoCreate,
      eventUpdateTime: { toMillis: () => 500 },
    });

    expect(result.mode).toBe('covered');
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0].path).toContain('/incrementalEvents/');
    expect(fake.writes[0].data).toMatchObject({ outcome: 'covered' });
  });

  it('treats an exact marker as a replay with no writes', async () => {
    const first = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const firstResult = await tryApplyTeacherEarningsIncrementalEvent({ db: first.db, ...demoCreate });
    expect(firstResult.mode).toBe('applied');
    const markerData = first.writes.find((write) => write.path.includes('/incrementalEvents/'))?.data;
    expect(markerData).toBeTruthy();

    const replay = buildFakeDb({ rollup: coordinatedRollup, marker: markerData || null });
    const replayResult = await tryApplyTeacherEarningsIncrementalEvent({ db: replay.db, ...demoCreate });
    expect(replayResult).toMatchObject({ mode: 'replay', previousOutcome: 'applied' });
    expect(replay.writes).toHaveLength(0);
  });

  it('falls back before opening a transaction for session creates and payout mutations', async () => {
    const sessionCreate = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const sessionResult = await tryApplyTeacherEarningsIncrementalEvent({
      db: sessionCreate.db,
      eventId: 'evt-session',
      earningId: 'session-1',
      eventUpdateTime: { toMillis: () => 2_000 },
      before: null,
      after: {
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        amount: 175,
        status: 'unpaid',
        source: 'session_present_completed',
        sessionId: 'session-1',
      },
    });
    expect(sessionResult).toEqual({ mode: 'fallback', reason: 'planner_session_create_or_delete' });
    expect(sessionCreate.reads).toHaveLength(0);

    const payoutMutation = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const before = {
      teacherId: 'teacher-1',
      monthKey: '2026-08',
      amount: 175,
      status: 'unpaid',
      source: 'session_present_completed',
      sessionId: 'session-1',
    };
    const payoutResult = await tryApplyTeacherEarningsIncrementalEvent({
      db: payoutMutation.db,
      eventId: 'evt-payout',
      earningId: 'session-1',
      eventUpdateTime: { toMillis: () => 2_000 },
      before,
      after: { ...before, status: 'partial', paidAmount: 50, payoutIds: ['payout-1'] },
    });
    expect(payoutResult).toEqual({ mode: 'fallback', reason: 'planner_payout_state_changed' });
    expect(payoutMutation.reads).toHaveLength(0);
  });

  it('contains no source-ledger query or write path in the fast-path helper', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/helpers/teacherEarningsIncrementalExecutor.ts'),
      'utf8',
    );
    expect(source).toContain('runTransaction');
    expect(source).toContain("rollupRef.collection('incrementalEvents').doc(markerId)");
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('teacherPayouts')");
    expect(source).not.toContain('incrementalAuthoritativeCommittedAt:');
  });
});
