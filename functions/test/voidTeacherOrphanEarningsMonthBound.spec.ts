import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('B6 Brick 4 month-bound orphan earning correction', () => {
  it('queries exactly one teacher-month', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/voidTeacherOrphanEarnings.ts'),
      'utf8',
    );

    expect(source).toContain(".where('teacherId', '==', teacherId)");
    expect(source).toContain(".where('monthKey', '==', monthKey)");
    expect(source).not.toContain(
      "const earningsQuery = db.collection('teacherEarnings').where('teacherId', '==', teacherId);",
    );
  });

  it('exports the month-bound callable instead of the legacy revenue export', () => {
    const indexSource = fs.readFileSync(
      path.resolve(process.cwd(), 'functions/src/index.ts'),
      'utf8',
    );

    expect(indexSource).toContain(
      'export { voidTeacherOrphanEarnings } from "./voidTeacherOrphanEarnings";',
    );

    const revenueExportBlock = indexSource.match(
      /export \{[\s\S]*?\} from "\.\/revenue";/,
    )?.[0] || '';
    expect(revenueExportBlock).not.toContain('voidTeacherOrphanEarnings');
  });
});
