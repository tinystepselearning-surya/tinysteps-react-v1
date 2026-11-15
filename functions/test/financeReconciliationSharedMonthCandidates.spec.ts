import { describe, expect, it } from 'vitest';
import type * as admin from 'firebase-admin';
import {
  fetchCompletedSessionsForFinanceReconciliation,
  fetchMonthBoundedFinanceSessionCandidates,
} from '../src/helpers/financeReconciliationCompletedSessions';
import {
  fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation,
} from '../src/helpers/financeReconciliationProtectedLifecycleSessions';

type Row = { id: string; data: Record<string, unknown> };

function fakeFirestore(rows: Row[]) {
  const reads: string[] = [];

  function query(conditions: Array<[string, string, unknown]>, afterId?: string) {
    return {
      where(field: string, op: string, value: unknown) {
        return query([...conditions, [field, op, value]], afterId);
      },
      startAfter(doc: { id: string }) {
        return query(conditions, doc.id);
      },
      limit(max: number) {
        return {
          async get() {
            reads.push(conditions.map(([field, op]) => `${field} ${op}`).join(' / '));
            const matched = rows
              .filter((row) => conditions.every(([field, op, value]) => {
                const actual = row.data[field];
                if (op === '==') return actual === value;
                const a = (actual as { toMillis?: () => number } | undefined)?.toMillis?.() ?? actual;
                const b = (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? value;
                if (a === undefined || a === null) return false;
                if (op === '>=') return (a as number) >= (b as number);
                if (op === '<') return (a as number) < (b as number);
                return false;
              }))
              .sort((a, b) => a.id.localeCompare(b.id));
            const start = afterId ? matched.findIndex((row) => row.id === afterId) + 1 : 0;
            const docs = matched.slice(start, start + max).map((row) => ({
              id: row.id,
              data: () => row.data,
            }));
            return { size: docs.length, docs, empty: docs.length === 0 };
          },
        };
      },
    };
  }

  const db = {
    collection(name: string) {
      if (name !== 'classSessions') throw new Error(`unexpected collection ${name}`);
      return query([]);
    },
  } as unknown as admin.firestore.Firestore;
  return { db, reads };
}

describe('shared month-bounded finance session reads', () => {
  it('runs each of the three Firestore queries once for both independent checks', async () => {
    const fake = fakeFirestore([
      { id: 'completed-1', data: { status: 'completed', monthKey: '2026-11' } },
      { id: 'protected-1', data: {
        status: 'cancelled', monthKey: '2026-11', attendance: { 'kid-1': { status: 'present' } },
      } },
      { id: 'ignored-1', data: {
        status: 'cancelled', monthKey: '2026-11', attendance: { 'kid-1': { status: 'absent' } },
      } },
      { id: 'other-month', data: { status: 'completed', monthKey: '2026-10' } },
    ]);
    const monthCandidates = fetchMonthBoundedFinanceSessionCandidates({
      db: fake.db, monthKey: '2026-11', maxDocs: 10,
    });
    const [completed, protectedSessions] = await Promise.all([
      fetchCompletedSessionsForFinanceReconciliation({
        db: fake.db, monthKey: '2026-11', maxDocs: 10, monthCandidates,
      }),
      fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation({
        db: fake.db, monthKey: '2026-11', maxDocs: 10, monthCandidates,
      }),
    ]);
    expect(fake.reads).toHaveLength(3);
    expect(new Set(fake.reads).size).toBe(3);
    expect(completed.docs.map((doc) => doc.id)).toEqual(['completed-1']);
    expect(protectedSessions.docs.map((doc) => doc.id)).toEqual(['protected-1']);
    expect(completed.mode).toBe('month_bounded_canonical_union');
    expect(protectedSessions.mode).toBe('month_bounded_protected_lifecycle_union');
    expect(completed.truncated).toBe(false);
    expect(protectedSessions.truncated).toBe(false);
  });

  it('propagates a per-query truncation probe independently to both checks', async () => {
    const fake = fakeFirestore([
      { id: 'a', data: { status: 'completed', monthKey: '2026-11' } },
      { id: 'b', data: { status: 'cancelled', monthKey: '2026-11',
        attendance: { kid: 'present' } } },
    ]);
    const monthCandidates = fetchMonthBoundedFinanceSessionCandidates({
      db: fake.db, monthKey: '2026-11', maxDocs: 1,
    });
    const [completed, protectedSessions] = await Promise.all([
      fetchCompletedSessionsForFinanceReconciliation({
        db: fake.db, monthKey: '2026-11', maxDocs: 1, monthCandidates,
      }),
      fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation({
        db: fake.db, monthKey: '2026-11', maxDocs: 1, monthCandidates,
      }),
    ]);
    expect(fake.reads).toHaveLength(4); // Three range reads plus one truncation probe.
    expect(completed.truncated).toBe(true);
    expect(protectedSessions.truncated).toBe(true);
    expect(completed.docs.map((doc) => doc.id)).toEqual(['a']);
    expect(protectedSessions.docs).toHaveLength(0); // Protected row beyond the cap.
  });
});


describe('financial reconciliation shared-read parity', () => {
  it('matches the independent helper results with overlapping date and monthKey matches', async () => {
    const rows: Row[] = [
      { id: 'completed-overlap', data: { date: '2026-11-12', monthKey: '2026-11', status: 'completed' } },
      { id: 'completed-only-date', data: { date: '2026-11-18', status: 'completed' } },
      { id: 'protected-overlap', data: {
        date: '2026-11-13', monthKey: '2026-11',
        status: 'cancelled', attendance: { kid: 'present' },
      } },
      { id: 'protected-only-month', data: {
        monthKey: '2026-11', status: 'rescheduled', attendance: { kid: 'present' },
      } },
      { id: 'wrong-month', data: { monthKey: '2026-10', status: 'completed' } },
    ];

    const independent = fakeFirestore(rows);
    const [originalCompleted, originalProtected] = await Promise.all([
      fetchCompletedSessionsForFinanceReconciliation({
        db: independent.db, monthKey: '2026-11', maxDocs: 20,
      }),
      fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation({
        db: independent.db, monthKey: '2026-11', maxDocs: 20,
      }),
    ]);
    expect(independent.reads).toHaveLength(6);

    const shared = fakeFirestore(rows);
    const monthCandidates = fetchMonthBoundedFinanceSessionCandidates({
      db: shared.db, monthKey: '2026-11', maxDocs: 20,
    });
    const [sharedCompleted, sharedProtected] = await Promise.all([
      fetchCompletedSessionsForFinanceReconciliation({
        db: shared.db, monthKey: '2026-11', maxDocs: 20, monthCandidates,
      }),
      fetchFinanciallyEarnedProtectedLifecycleSessionsForFinanceReconciliation({
        db: shared.db, monthKey: '2026-11', maxDocs: 20, monthCandidates,
      }),
    ]);
    expect(shared.reads).toHaveLength(3);
    expect(sharedCompleted.docs.map((doc) => doc.id))
      .toEqual(originalCompleted.docs.map((doc) => doc.id));
    expect(sharedProtected.docs.map((doc) => doc.id))
      .toEqual(originalProtected.docs.map((doc) => doc.id));
    expect(sharedCompleted.truncated).toBe(originalCompleted.truncated);
    expect(sharedProtected.truncated).toBe(originalProtected.truncated);
    expect(sharedCompleted.docs.map((doc) => doc.id)).toEqual([
      'completed-only-date', 'completed-overlap',
    ]);
    expect(sharedProtected.docs.map((doc) => doc.id)).toEqual([
      'protected-only-month', 'protected-overlap',
    ]);
  });
});
