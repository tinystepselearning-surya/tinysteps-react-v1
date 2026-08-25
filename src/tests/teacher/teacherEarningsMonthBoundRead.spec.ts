import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('B6 teacher earnings month-bound read integration', () => {
  it('uses the guarded teacher+month query in EarningsSummary while retaining teacher-only compatibility', () => {
    const source = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'src/pages/teacher/components/earnings/EarningsSummary.tsx',
      ),
      'utf8',
    );

    expect(source).toContain("shouldUseMonthBoundTeacherEarningsRead");
    expect(source).toContain("where('teacherId', '==', resolvedTeacherId)");
    expect(source).toContain("where('monthKey', '==', ledgerReadMonthKey)");
    expect(source).toContain('[ledgerReadMonthKey, resolvedTeacherId]');
  });
});
