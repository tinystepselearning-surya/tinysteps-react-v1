import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('B6 Brick 7C2 live incremental cutover source guard', () => {
  it('tries the transactional executor before falling back to atomic authoritative recompute', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    const incrementalIndex = source.indexOf('await tryApplyTeacherEarningsIncrementalEvent({');
    const recomputeIndex = source.indexOf('await recomputeTeacherEarningsEventCoordinated({');

    expect(source).toContain("import { tryApplyTeacherEarningsIncrementalEvent }");
    expect(source).toContain('const eventUpdateTime = change.after.exists ? change.after.updateTime : null;');
    expect(incrementalIndex).toBeGreaterThan(-1);
    expect(recomputeIndex).toBeGreaterThan(incrementalIndex);
    expect(source).toContain("if (incremental.mode === 'applied') return;");
    expect(source).toContain("if (incremental.mode === 'covered')");
    expect(source).toContain("if (incremental.mode === 'replay')");
    expect(source).toContain("if (incremental.mode === 'conflict')");
    expect(source).toContain('await refreshCertifiedAnalyticsRollups(images);');
  });

  it('keeps the explicit authoritative fallback categories documented in the live trigger', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(source).toContain('Session deletes, uncertified/noncanonical creates');
    expect(source).toContain('payout-state changes');
    expect(source).toContain('archive toggles');
    expect(source).toContain('teacher/month moves');
    expect(source).toContain('missing/equal watermarks');
    expect(source).toContain('marker conflicts');
  });
});
