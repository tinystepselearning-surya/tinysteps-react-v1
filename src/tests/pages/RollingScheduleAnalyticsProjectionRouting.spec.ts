import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const dashboardSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/AnalyticsDashboardV3.tsx'),
  'utf8',
);
const projectionSource = readFileSync(
  join(process.cwd(), 'src/lib/scheduling/rollingScheduleAnalyticsProjection.ts'),
  'utf8',
);
const readPlanSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/analyticsReadPlan.ts'),
  'utf8',
);

describe('Brick 9 analytics projection routing', () => {
  it('routes scheduled-month management metrics through the shared recurrence projection helper', () => {
    expect(dashboardSource).toContain("import { buildRollingScheduleAnalyticsProjection } from '../../lib/scheduling/rollingScheduleAnalyticsProjection';");
    expect(dashboardSource).toContain('const plannedProjection = useMemo(() => buildRollingScheduleAnalyticsProjection({');
    expect(dashboardSource).toContain('monthKey: selectedMonth');
    expect(dashboardSource).toContain('todayYmd: todayIst');
    expect(dashboardSource).toContain('realSessions: classSessions');
    expect(dashboardSource).not.toContain('classSessions.forEach((session) => {');
  });

  it('reuses the existing month session + enrollment + course datasets instead of adding analytics reads', () => {
    expect(readPlanSource).toContain("datasets: [\n      'financeTotals',\n      'charges',\n      'teacherFinanceSummary',\n      'classSessions',\n      'enrollments',\n      'courses',\n    ]");
    expect(readPlanSource).toContain("datasets: ['charges', 'classSessions', 'enrollments', 'courses']");
    expect(projectionSource).not.toContain("from 'firebase/firestore'");
    expect(projectionSource).not.toContain('getDocs(');
    expect(projectionSource).not.toContain('getDocsLogged(');
    expect(projectionSource).not.toContain('collection(');
  });

  it('uses canonical rolling recurrence only for active current/future plans and keeps exceptions out', () => {
    expect(projectionSource).toContain("contract.source === 'canonical_rolling'");
    expect(projectionSource).toContain("contract.lifecycleState !== 'active'");
    expect(projectionSource).toContain('enumerateRollingScheduleOccurrences');
    expect(projectionSource).toContain('isScheduleExceptionSession(session)');
    expect(projectionSource).toContain("'rolling_schedule'");
    expect(projectionSource).toContain("'enrollmentschedulerepair'");
  });

  it('leaves actual billing and teacher earning authorities untouched', () => {
    expect(dashboardSource).toContain('const expectedRevenue = financeTotals.selectedMonthBilled;');
    expect(dashboardSource).toContain('const completedSessionsMonth = sessionChargeTotals.sessionChargesCount;');
    expect(dashboardSource).toContain('const sessionNetRevenue = sessionChargeTotals.sessionChargesTotal - teacherSummary.totalSessionEarned;');
    expect(dashboardSource).toContain('const projectedTeacherPayout = plannedProjection.plannedSessions * avgSessionPayout;');
  });
});
