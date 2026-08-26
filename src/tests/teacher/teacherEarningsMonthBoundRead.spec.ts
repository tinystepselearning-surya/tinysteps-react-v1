import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('B6 teacher earnings month-bound read integration', () => {
  it('uses the monthly rollup by default and only month-bounded detail queries on demand', () => {
    const earningsSource = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'src/pages/teacher/components/earnings/EarningsSummary.tsx',
      ),
      'utf8',
    );
    const hookSource = fs.readFileSync(
      path.resolve(
        process.cwd(),
        'src/pages/teacher/hooks/useEarnings.ts',
      ),
      'utf8',
    );

    // Default earnings read model: one teacher-month rollup document.
    expect(earningsSource).toContain('useEarnings(resolvedTeacherId, selectedMonth)');
    expect(hookSource).toContain("doc(db, 'teachers', teacherId, 'earnings', monthId)");
    expect(hookSource).not.toContain("collection(db, 'teacherEarnings')");

    // Lazy ledger details are always teacher + month bounded.
    expect(earningsSource).toContain("where('teacherId', '==', resolvedTeacherId)");
    expect(earningsSource).toContain("where('monthKey', '==', monthKey)");

    // Canonical service-date details are bounded by session.date and session.startAt.
    expect(earningsSource).toContain("where('date', '>=', monthRange.startDate)");
    expect(earningsSource).toContain("where('date', '<=', monthRange.endDate)");
    expect(earningsSource).toContain("where('startAt', '>=', monthRange.startAt)");
    expect(earningsSource).toContain("where('startAt', '<', monthRange.nextMonthStartAt)");

    // The old compatibility/history helper and its broad fallback are intentionally retired.
    expect(earningsSource).not.toContain('shouldUseMonthBoundTeacherEarningsRead');
    expect(earningsSource).not.toContain('ledgerReadMonthKey');
  });
});
