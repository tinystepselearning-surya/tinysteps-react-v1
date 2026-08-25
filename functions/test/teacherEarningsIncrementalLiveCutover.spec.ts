import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('B6 Brick 7C2/7D2B live incremental cutover source guard', () => {
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

  it('documents the narrowed certified session-create path and keeps all unsafe categories authoritative', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(source).toContain('canonical session earning create');
    expect(source).toContain('month-specific v2');
    expect(source).toContain('Session deletes, uncertified/noncanonical session creates');
    expect(source).toContain('payout-state changes');
    expect(source).toContain('archive toggles');
    expect(source).toContain('teacher/month');
    expect(source).toContain('missing/equal watermarks');
    expect(source).toContain('marker conflicts');
    expect(source).toContain('TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION');
    expect(source).not.toContain('const SESSION_CREATE_CERTIFICATION_VERSION = 1');
  });
});
