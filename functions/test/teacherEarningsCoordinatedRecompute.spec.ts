import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveTeacherEarningsRecomputeTarget,
  resolveTeacherEarningsRecomputeTargets,
} from '../src/helpers/teacherEarningsCoordinatedRecompute';

describe('B6 Brick 7C1 atomic authoritative recompute', () => {
  it('prefers explicit canonical teacherId + monthKey targeting', () => {
    expect(
      resolveTeacherEarningsRecomputeTarget({
        teacherId: 'teacher-1',
        monthKey: '2026-08',
        earnedAt: '2026-07-31T20:00:00Z',
      }),
    ).toEqual({ teacherId: 'teacher-1', monthKey: '2026-08' });
  });

  it('preserves legacy timestamp-derived target resolution when monthKey is absent', () => {
    expect(
      resolveTeacherEarningsRecomputeTarget({
        teacherId: 'teacher-1',
        earnedAt: '2026-08-31T20:00:00Z',
      }),
    ).toEqual({ teacherId: 'teacher-1', monthKey: '2026-09' });
  });

  it('returns both affected teacher-months for an ownership/month move and dedupes identical targets', () => {
    expect(
      resolveTeacherEarningsRecomputeTargets({
        before: { teacherId: 'teacher-1', monthKey: '2026-08' },
        after: { teacherId: 'teacher-2', monthKey: '2026-09' },
      }),
    ).toEqual([
      { teacherId: 'teacher-1', monthKey: '2026-08' },
      { teacherId: 'teacher-2', monthKey: '2026-09' },
    ]);

    expect(
      resolveTeacherEarningsRecomputeTargets({
        before: { teacherId: 'teacher-1', monthKey: '2026-08' },
        after: { teacherId: 'teacher-1', monthKey: '2026-08' },
      }),
    ).toEqual([{ teacherId: 'teacher-1', monthKey: '2026-08' }]);
  });

  it('reads rollup + month ledgers and publishes the authoritative payload in one transaction', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/helpers/teacherEarningsCoordinatedRecompute.ts'),
      'utf8',
    );

    expect(source).toContain(".collection('teacherEarnings')");
    expect(source).toContain(".collection('teacherPayouts')");
    expect(source).toContain(".where('teacherId', '==', target.teacherId)");
    expect(source).toContain(".where('monthKey', '==', target.monthKey)");
    expect(source).toContain('await db.runTransaction(async (tx) =>');
    expect(source).toContain('const rollupSnap = await tx.get(rollupRef)');
    expect(source).toContain('const earningsSnap = await tx.get(earningsQuery)');
    expect(source).toContain('const payoutsSnap = await tx.get(payoutsQuery)');
    expect(source).toContain('computeTeacherMonthlyRollupPayload');
    expect(source).toContain('incrementalAuthoritativeCommittedAt: admin.firestore.FieldValue.serverTimestamp()');
    expect(source).toContain('incrementalRecomputeState: TEACHER_EARNINGS_RECOMPUTE_STATE_IDLE');
    expect(source).not.toContain('planTeacherEarningsRecomputeClaim');
    expect(source).not.toContain('planTeacherEarningsRecomputeFinalize');
    expect(source).not.toContain("collection('teacherEarnings').doc(");
    expect(source).not.toContain("collection('teacherPayouts').doc(");
  });
});
