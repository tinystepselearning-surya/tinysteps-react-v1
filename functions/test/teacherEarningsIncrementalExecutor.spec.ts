import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import type * as admin from 'firebase-admin';
import { tryApplyTeacherEarningsIncrementalEvent } from '../src/helpers/teacherEarningsIncrementalExecutor';
import {
  TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  TEACHER_EARNINGS_TRANSACTION_FENCE,
} from '../src/helpers/teacherEarningsIncrementalProtocol';
import {
  TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
} from '../src/helpers/teacherEarningsSessionCreateCertification';

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
  certification?: Record<string, unknown> | null;
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
          if (ref.path.includes('adminStats/teacherEarningsSessionCreateFastPath/months/')) {
            return snap(Boolean(input.certification), input.certification || null);
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

const validCertification = {
  monthKey: '2026-08',
  ready: true,
  certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  fullLedgerEvidenceComplete: true,
  legacyMonthCoverageClean: true,
  duplicateSessionIdGroups: 0,
  nonCanonicalSessionRows: 0,
  sessionSourceMissingSessionIdRows: 0,
  missingTeacherIdRows: 0,
  blockers: [],
  sourceCodeContract: TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
};

const sessionCreate = {
  eventId: 'evt-session-1',
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

  it('keeps payout mutations on full recompute before opening a transaction', async () => {
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

  it('atomically applies a canonical session create only with valid v2 certification', async () => {
    const fake = buildFakeDb({
      rollup: coordinatedRollup,
      marker: null,
      certification: validCertification,
    });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...sessionCreate });

    expect(result).toMatchObject({ mode: 'applied', revisionBefore: 12, revisionAfter: 13 });
    expect(fake.reads).toHaveLength(3);
    expect(fake.reads).toContain(
      'adminStats/teacherEarningsSessionCreateFastPath/months/2026-08',
    );
    const rollupWrite = fake.writes.find(
      (write) => write.path === 'teachers/teacher-1/earnings/2026-08',
    );
    expect(rollupWrite?.data).toMatchObject({
      totalEarnings: 1175,
      pendingEarnings: 775,
      totalSessions: 6,
      sessionsCompleted: 6,
      incrementalRevision: 13,
    });
    const markerWrite = fake.writes.find((write) => write.path.includes('/incrementalEvents/'));
    expect(markerWrite?.data).toMatchObject({
      outcome: 'applied',
      sessionCreateCertificationVersion: 2,
      sessionCreateSourceCodeContract: TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
    });
  });

  it.each([
    ['missing', null, 'session_create_certification_missing'],
    ['not ready', { ...validCertification, ready: false }, 'session_create_certification_not_ready'],
    [
      'version 1',
      { ...validCertification, certificationVersion: 1 },
      'session_create_certification_version_unsupported',
    ],
    [
      'incomplete ledger',
      { ...validCertification, fullLedgerEvidenceComplete: false },
      'session_create_certification_ledger_incomplete',
    ],
    [
      'unclean month coverage',
      { ...validCertification, legacyMonthCoverageClean: false },
      'session_create_certification_month_coverage_not_clean',
    ],
    [
      'blockers present',
      { ...validCertification, blockers: ['unsafe'] },
      'session_create_certification_blocked',
    ],
    [
      'wrong month',
      { ...validCertification, monthKey: '2026-07' },
      'session_create_certification_month_mismatch',
    ],
    [
      'wrong source contract',
      { ...validCertification, sourceCodeContract: 'legacy_v1' },
      'session_create_certification_source_contract_mismatch',
    ],
    [
      'malformed blockers',
      { ...validCertification, blockers: null },
      'session_create_certification_malformed',
    ],
  ])('falls back for %s certification', async (_label, certification, reason) => {
    const fake = buildFakeDb({
      rollup: coordinatedRollup,
      marker: null,
      certification: certification as Record<string, unknown> | null,
    });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...sessionCreate });

    expect(result).toEqual({ mode: 'fallback', reason });
    expect(fake.reads).toContain(
      'adminStats/teacherEarningsSessionCreateFastPath/months/2026-08',
    );
    expect(fake.writes).toHaveLength(0);
  });

  it('records a delayed certified session create as covered without adding money', async () => {
    const fake = buildFakeDb({
      rollup: coordinatedRollup,
      marker: null,
      certification: validCertification,
    });
    const result = await tryApplyTeacherEarningsIncrementalEvent({
      db: fake.db,
      ...sessionCreate,
      eventUpdateTime: { toMillis: () => 500 },
    });

    expect(result.mode).toBe('covered');
    expect(fake.writes).toHaveLength(1);
    expect(fake.writes[0].path).toContain('/incrementalEvents/');
    expect(fake.writes[0].data).toMatchObject({
      outcome: 'covered',
      sessionCreateCertificationVersion: 2,
    });
  });

  it('treats the same certified session CloudEvent as a replay without double incrementing', async () => {
    const first = buildFakeDb({
      rollup: coordinatedRollup,
      marker: null,
      certification: validCertification,
    });
    const firstResult = await tryApplyTeacherEarningsIncrementalEvent({ db: first.db, ...sessionCreate });
    expect(firstResult.mode).toBe('applied');
    const marker = first.writes.find((write) => write.path.includes('/incrementalEvents/'))?.data;

    const replay = buildFakeDb({
      rollup: coordinatedRollup,
      marker: marker || null,
      certification: validCertification,
    });
    const replayResult = await tryApplyTeacherEarningsIncrementalEvent({
      db: replay.db,
      ...sessionCreate,
    });
    expect(replayResult).toMatchObject({ mode: 'replay', previousOutcome: 'applied' });
    expect(replay.writes).toHaveLength(0);
  });

  it('returns a certified session marker conflict for authoritative recompute', async () => {
    const fake = buildFakeDb({
      rollup: coordinatedRollup,
      marker: {
        changeSignature: 'different-signature',
        protocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
      },
      certification: validCertification,
    });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...sessionCreate });

    expect(result).toEqual({ mode: 'conflict', reason: 'idempotency_marker_mismatch' });
    expect(fake.writes).toHaveLength(0);
  });

  it('keeps noncanonical creates and session deletes on full recompute', async () => {
    const noncanonical = buildFakeDb({ rollup: coordinatedRollup, certification: validCertification });
    const noncanonicalResult = await tryApplyTeacherEarningsIncrementalEvent({
      db: noncanonical.db,
      ...sessionCreate,
      earningId: 'legacy-earning-1',
    });
    expect(noncanonicalResult).toEqual({
      mode: 'fallback',
      reason: 'planner_session_create_or_delete',
    });
    expect(noncanonical.reads).toHaveLength(0);

    const deletion = buildFakeDb({ rollup: coordinatedRollup, certification: validCertification });
    const deleteResult = await tryApplyTeacherEarningsIncrementalEvent({
      db: deletion.db,
      ...sessionCreate,
      before: sessionCreate.after,
      after: null,
    });
    expect(deleteResult).toEqual({
      mode: 'fallback',
      reason: 'planner_session_create_or_delete',
    });
    expect(deletion.reads).toHaveLength(0);
  });

  it('contains no source-ledger query or write path in the fast-path helper', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/helpers/teacherEarningsIncrementalExecutor.ts'),
      'utf8',
    );
    expect(source).toContain('runTransaction');
    expect(source).toContain("rollupRef.collection('incrementalEvents').doc(markerId)");
    expect(source).toContain(".doc('teacherEarningsSessionCreateFastPath')");
    expect(source).toContain('await tx.get(certificationRef)');
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('teacherPayouts')");
    expect(source).not.toContain('incrementalAuthoritativeCommittedAt:');
  });
});
