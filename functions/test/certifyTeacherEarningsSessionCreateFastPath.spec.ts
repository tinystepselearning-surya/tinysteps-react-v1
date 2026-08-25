import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { planTeacherEarningsRollupChange } from '../src/helpers/teacherEarningsRollupDelta';

describe('B6 Brick 7D2A session-create runtime certification', () => {
  it('keeps certification dry-run by default and writes only derived adminStats state on apply', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/certifyTeacherEarningsSessionCreateFastPath.ts'),
      'utf8',
    );

    expect(source).toContain("const apply = request.data?.apply === true");
    expect(source).toContain("db.collection('teacherEarnings').limit(maxDocs + 1).get()");
    expect(source).toContain('evaluateTeacherEarningsSessionCreateFastPathReadiness');
    expect(source).toContain(".doc('teacherEarningsSessionCreateFastPath')");
    expect(source).toContain(".collection('months')");
    expect(source).toContain('if (apply)');
    expect(source).not.toContain("collection('teacherEarnings').doc(");
    expect(source).not.toContain("collection('teacherEarnings').add(");
  });

  it('exports the admin-only certification callable from the Functions barrel', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/index.ts'),
      'utf8',
    );

    expect(source).toContain(
      'export { certifyTeacherEarningsSessionCreateFastPath } from "./certifyTeacherEarningsSessionCreateFastPath";',
    );
  });

  it('invalidates month certification when a later earning image is unsafe', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/teacherEarningsRollupTrigger.ts'),
      'utf8',
    );

    expect(source).toContain(".doc('teacherEarningsSessionCreateFastPath')");
    expect(source).toContain("source: 'b6_brick_7d2a_runtime_invalidation_guard'");
    expect(source).toContain('ready: false');
    expect(source).toContain('unsafe_teacher_earning_event:');
  });

  it('still refuses a new canonical session earning until the separate 7D2B cutover', () => {
    const plan = planTeacherEarningsRollupChange({
      earningId: 'session-1',
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

    expect(plan).toEqual({
      mode: 'recompute',
      targets: [{ teacherId: 'teacher-1', monthKey: '2026-08' }],
      reason: 'session_create_or_delete',
    });
  });
});
