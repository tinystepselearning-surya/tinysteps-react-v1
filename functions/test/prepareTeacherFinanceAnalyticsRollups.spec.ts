import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('B6 Brick 6B1/6B2 analytics rollup preparation source guards', () => {
  it('keeps preparation explicit, bounded, and away from teacherEarnings writes', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/prepareTeacherFinanceAnalyticsRollups.ts'),
      'utf8',
    );

    expect(source).toContain("const apply = request.data?.apply === true");
    expect(source).toContain("db.collection('teacherEarnings').limit(maxDocs + 1).get()");
    expect(source).toContain('analyzeTeacherEarningsCanonicalServiceMonthCoverage');
    expect(source).toContain('evaluateTeacherFinanceRollupParity');
    expect(source).toContain(".collection('teachers')");
    expect(source).toContain(".doc('teacherFinanceAnalyticsProjection')");
    expect(source).toContain('monthKey,');
    expect(source).toContain('analyticsProjectionVersion: ANALYTICS_PROJECTION_VERSION');
    expect(source).toContain('analyticsProjectionPreparedSessionEarnings');

    expect(source).not.toContain("db.collection('teacherEarnings').doc(");
    expect(source).not.toContain("batch.set(db.collection('teacherEarnings')");
    expect(source).not.toContain("batch.update(db.collection('teacherEarnings')");
    expect(source).not.toContain("batch.delete(db.collection('teacherEarnings')");
  });

  it('marks the month not-ready before any apply and ready only after rollup batches finish', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/prepareTeacherFinanceAnalyticsRollups.ts'),
      'utf8',
    );

    const preparingIndex = source.indexOf("state: monthReadyToApply ? 'preparing' : 'blocked'");
    const batchCommitIndex = source.indexOf('await batch.commit()');
    const readyIndex = source.indexOf("state: 'ready'");

    expect(preparingIndex).toBeGreaterThan(-1);
    expect(batchCommitIndex).toBeGreaterThan(preparingIndex);
    expect(readyIndex).toBeGreaterThan(batchCommitIndex);
  });

  it('exports the admin-only preparation callable from the Functions barrel', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');
    expect(source).toContain(
      'export { prepareTeacherFinanceAnalyticsRollups } from "./prepareTeacherFinanceAnalyticsRollups";',
    );
  });

  it('invalidates unsafe earning images and refreshes only already-certified safe months', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(source).toContain('checkTeacherFinanceAnalyticsReadinessRow');
    expect(source).toContain('.filter((check) => check.relevant && !check.safe)');
    expect(source).toContain('analyticsProjectionVersion: 0');
    expect(source).toContain("ready: false");
    expect(source).toContain('await invalidateUnsafeAnalyticsProjection');
    expect(source).toContain('async function refreshCertifiedAnalyticsRollups');
    expect(source).toContain('data.ready === true');
    expect(source).toContain("analyticsProjectionSource: 'b6_teacher_earnings_live_refresh_v1'");
    expect(source).toContain('await recomputeTeacherEarningsEventCoordinated');
    expect(source).toContain('if (recompute.allFinalized)');
    expect(source).toContain('await refreshCertifiedAnalyticsRollups(images)');
    expect(source).not.toContain('authoritativeTeacherEarningsRollupWrite.run(event)');
  });
});