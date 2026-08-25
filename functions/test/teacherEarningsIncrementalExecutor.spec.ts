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
} from '../src/helpers/teacherEarningsSessionCreateFastPath';

class FakeRef {
  constructor(public readonly path: string) {}
  collection(name: string) { return new FakeCollection(`${this.path}/${name}`); }
}
class FakeCollection {
  constructor(private readonly path: string) {}
  doc(id: string) { return new FakeRef(`${this.path}/${id}`); }
}
const snap = (exists: boolean, data: Record<string, unknown> | null) => ({ exists, data: () => data });
const coordinatedRollup = {
  month: '2026-08', monthKey: '2026-08', totalEarnings: 1000, pendingEarnings: 600,
  totalSessions: 5, sessionsCompleted: 5, demoEarnings: 100, demoCompletedCount: 1,
  demoEnrollmentBonusCount: 0, payments: [], rollupSource: 'teacherEarnings_events_v1',
  rollupVersion: 1, incrementalProtocolVersion: TEACHER_EARNINGS_INCREMENTAL_PROTOCOL_VERSION,
  incrementalTransactionFence: TEACHER_EARNINGS_TRANSACTION_FENCE, incrementalRecomputeState: 'idle',
  incrementalRevision: 12, incrementalAuthoritativeCommittedAt: { toMillis: () => 1_000 },
};
const validCertification = {
  monthKey: '2026-08', ready: true,
  certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
  fullLedgerEvidenceComplete: true, sessionLinkedRows: 576, canonicalSessionRows: 576,
  duplicateSessionIdGroups: 0, nonCanonicalSessionRows: 0, sessionSourceMissingSessionIdRows: 0,
  missingTeacherIdRows: 0, legacyMonthCoverageClean: true,
  sessionEvidence: { requestedSessionCount: 2682, foundSessionCount: 2682, missingSessionCount: 0, unresolvedServiceMonthCount: 0 },
  blockers: [], sourceCodeContract: TEACHER_EARNINGS_SESSION_CREATE_SOURCE_CODE_CONTRACT,
};
const buildFakeDb = (input: { rollup?: Record<string, unknown> | null; marker?: Record<string, unknown> | null; certification?: Record<string, unknown> | null }) => {
  const writes: Array<{ path: string; data: Record<string, unknown>; options: unknown }> = [];
  const reads: string[] = [];
  const db = {
    collection(name: string) { return new FakeCollection(name); },
    async runTransaction<T>(handler: (tx: unknown) => Promise<T>): Promise<T> {
      const tx = {
        async get(ref: FakeRef) {
          reads.push(ref.path);
          if (ref.path.includes('/incrementalEvents/')) return snap(Boolean(input.marker), input.marker || null);
          if (ref.path.startsWith('adminStats/teacherEarningsSessionCreateFastPath/')) return snap(Boolean(input.certification), input.certification || null);
          return snap(Boolean(input.rollup), input.rollup || null);
        },
        set(ref: FakeRef, data: Record<string, unknown>, options: unknown) { writes.push({ path: ref.path, data, options }); },
      };
      return handler(tx);
    },
  } as unknown as admin.firestore.Firestore;
  return { db, reads, writes };
};
const demoCreate = {
  eventId: 'evt-demo-1', earningId: 'demo_demo-1_completion', eventUpdateTime: { toMillis: () => 2_000 }, before: null,
  after: { teacherId: 'teacher-1', monthKey: '2026-08', amount: 100, status: 'unpaid', source: 'demo_completed' },
};
const sessionCreate = {
  eventId: 'evt-session-1', earningId: 'session-1', eventUpdateTime: { toMillis: () => 2_000 }, before: null,
  after: { teacherId: 'teacher-1', monthKey: '2026-08', sessionId: 'session-1', amount: 175, status: 'unpaid' },
};

describe('B6 Brick 7C2/7D2B incremental executor', () => {
  it('keeps an existing 7C delta on the two-read transaction and applies it atomically', async () => {
    const fake = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...demoCreate });
    expect(result.mode).toBe('applied');
    expect(fake.reads).toHaveLength(2);
    expect(fake.reads.some((read) => read.startsWith('adminStats/'))).toBe(false);
    expect(fake.writes).toHaveLength(2);
    const rollupWrite = fake.writes.find((write) => write.path === 'teachers/teacher-1/earnings/2026-08');
    expect(rollupWrite?.data).toMatchObject({ totalEarnings: 1100, pendingEarnings: 700, demoEarnings: 200, demoCompletedCount: 2, incrementalRevision: 13, incrementalLastEventId: 'evt-demo-1', incrementalLastFastPathKind: 'delta_v1' });
    expect(rollupWrite?.data).not.toHaveProperty('incrementalAuthoritativeCommittedAt');
  });

  it('applies a canonical session create only with a valid v2 certification read in the same transaction', async () => {
    const fake = buildFakeDb({ rollup: coordinatedRollup, marker: null, certification: validCertification });
    const result = await tryApplyTeacherEarningsIncrementalEvent({ db: fake.db, ...sessionCreate });
    expect(result).toMatchObject({ mode: 'applied', revisionBefore: 12, revisionAfter: 13 });
    expect(fake.reads).toHaveLength(3);
    expect(fake.reads).toContain('adminStats/teacherEarningsSessionCreateFastPath/months/2026-08');
    expect(fake.writes).toHaveLength(2);
    const rollupWrite = fake.writes.find((write) => write.path === 'teachers/teacher-1/earnings/2026-08');
    expect(rollupWrite?.data).toMatchObject({ totalEarnings: 1175, pendingEarnings: 775, totalSessions: 6, sessionsCompleted: 6, demoEarnings: 100, demoCompletedCount: 1, incrementalRevision: 13, incrementalLastFastPathKind: 'session_create_v2' });
    expect(rollupWrite?.data).not.toHaveProperty('incrementalAuthoritativeCommittedAt');
    const markerWrite = fake.writes.find((write) => write.path.includes('/incrementalEvents/'));
    expect(markerWrite?.data).toMatchObject({ eventId: 'evt-session-1', fastPathKind: 'session_create_v2', outcome: 'applied', revisionBefore: 12, revisionAfter: 13 });
  });

  it('fails closed for a missing, invalidated, or old session-create certification', async () => {
    const missing = buildFakeDb({ rollup: coordinatedRollup, marker: null, certification: null });
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: missing.db, ...sessionCreate })).toEqual({ mode: 'fallback', reason: 'session_create_certification_missing' });
    expect(missing.reads).toHaveLength(3);
    expect(missing.writes).toHaveLength(0);
    const invalidated = buildFakeDb({ rollup: coordinatedRollup, marker: null, certification: { ...validCertification, ready: false } });
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: invalidated.db, ...sessionCreate })).toEqual({ mode: 'fallback', reason: 'session_create_certification_not_ready' });
    expect(invalidated.writes).toHaveLength(0);
    const oldVersion = buildFakeDb({ rollup: coordinatedRollup, marker: null, certification: { ...validCertification, certificationVersion: 1 } });
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: oldVersion.db, ...sessionCreate })).toEqual({ mode: 'fallback', reason: 'session_create_certification_version_mismatch' });
    expect(oldVersion.writes).toHaveLength(0);
  });

  it('keeps session deletes, noncanonical creates, and payout mutations on authoritative fallback', async () => {
    const noncanonical = buildFakeDb({ rollup: coordinatedRollup, marker: null, certification: validCertification });
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: noncanonical.db, ...sessionCreate, earningId: 'legacy-session-id' })).toEqual({ mode: 'fallback', reason: 'planner_session_create_or_delete' });
    expect(noncanonical.reads).toHaveLength(0);
    const deletion = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: deletion.db, eventId: 'evt-delete', earningId: 'session-1', eventUpdateTime: null, before: sessionCreate.after, after: null })).toEqual({ mode: 'fallback', reason: 'planner_session_create_or_delete' });
    expect(deletion.reads).toHaveLength(0);
    const payoutMutation = buildFakeDb({ rollup: coordinatedRollup, marker: null });
    const before = { teacherId: 'teacher-1', monthKey: '2026-08', amount: 175, status: 'unpaid', sessionId: 'session-1' };
    expect(await tryApplyTeacherEarningsIncrementalEvent({ db: payoutMutation.db, eventId: 'evt-payout', earningId: 'session-1', eventUpdateTime: { toMillis: () => 2_000 }, before, after: { ...before, status: 'partial', paidAmount: 50, payoutIds: ['payout-1'] } })).toEqual({ mode: 'fallback', reason: 'planner_payout_state_changed' });
    expect(payoutMutation.reads).toHaveLength(0);
  });

  it('contains no source-ledger query or write path and explicitly reads certification only for session creates', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/helpers/teacherEarningsIncrementalExecutor.ts'), 'utf8');
    expect(source).toContain('runTransaction');
    expect(source).toContain("rollupRef.collection('incrementalEvents').doc(markerId)");
    expect(source).toContain(".doc('teacherEarningsSessionCreateFastPath')");
    expect(source).toContain('requiresSessionCreateCertification');
    expect(source).not.toContain("collection('teacherEarnings')");
    expect(source).not.toContain("collection('teacherPayouts')");
    expect(source).not.toContain('incrementalAuthoritativeCommittedAt:');
  });
});
