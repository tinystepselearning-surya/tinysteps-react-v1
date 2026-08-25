import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { analyticsReadPlanForView } from '../../pages/admin/analyticsReadPlan';

describe('B6 Brick 6B2 Finance analytics teacher summary cutover', () => {
  it('removes raw teacherEarnings from Finance while preserving it for Teachers detail', () => {
    const finance = analyticsReadPlanForView('finance');
    const teachers = analyticsReadPlanForView('teachers');

    expect(finance.datasets).toContain('teacherFinanceSummary');
    expect(finance.datasets).not.toContain('teacherEarnings');
    expect(finance.rawDatasets).not.toContain('teacherEarnings');

    expect(teachers.datasets).toContain('teacherEarnings');
    expect(teachers.rawDatasets).toContain('teacherEarnings');
  });

  it('requires readiness before the bounded rollup query and retains a raw month fallback', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/admin/teacherFinanceSummaryLoader.ts'),
      'utf8',
    );

    const readinessIndex = source.indexOf('teacherFinanceAnalyticsProjection');
    const rollupIndex = source.indexOf("collectionGroup(db, 'earnings')");
    const rawFallbackIndex = source.indexOf("collection(db, 'teacherEarnings')");

    expect(readinessIndex).toBeGreaterThan(-1);
    expect(rollupIndex).toBeGreaterThan(readinessIndex);
    expect(rawFallbackIndex).toBeGreaterThan(-1);
    expect(source).toContain("where('monthKey', '==', monthKey)");
    expect(source).toContain("loadRawTeacherFinanceSummary(monthKey, 'rollup_projection_not_safe')");
    expect(source).toContain("loadRawTeacherFinanceSummary(monthKey, 'month_not_certified')");
    expect(source).toContain("loadRawTeacherFinanceSummary(monthKey, 'rollup_read_failed')");
  });

  it('wires Finance to the summary dataset without removing the raw Teachers loader', () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), 'src/pages/admin/AnalyticsDashboardV3.tsx'),
      'utf8',
    );

    expect(source).toContain("case 'teacherFinanceSummary':");
    expect(source).toContain('return loadTeacherFinanceSummary(monthKey)');
    expect(source).toContain("case 'teacherEarnings': {");
    expect(source).toContain("activeView === 'finance' && teacherFinanceSummaryData?.summary");
    expect(source).toContain('Raw teacher earnings load only for this detailed Teachers view.');
  });
});