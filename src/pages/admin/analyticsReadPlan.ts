export type AnalyticsView =
  | 'overview'
  | 'growth'
  | 'acquisition'
  | 'finance'
  | 'delivery'
  | 'teachers';

export type AnalyticsDataset =
  | 'financeTotals'
  | 'charges'
  | 'teacherFinanceSummary'
  | 'teacherEarnings'
  | 'classSessions'
  | 'users'
  | 'enrollments'
  | 'courses';

export type AnalyticsReadPlan = {
  datasets: AnalyticsDataset[];
  rawDatasets: AnalyticsDataset[];
};

const PLAN: Record<AnalyticsView, AnalyticsReadPlan> = {
  // Overview intentionally uses only the canonical finance aggregate. Heavy monthly
  // operational collections are loaded only after an admin explicitly opens a detail view.
  overview: {
    datasets: ['financeTotals'],
    rawDatasets: [],
  },
  // Growth and acquisition own their already-bounded data sources. The management
  // analytics shell should not additionally download finance/session collections.
  growth: {
    datasets: [],
    rawDatasets: [],
  },
  acquisition: {
    datasets: [],
    rawDatasets: [],
  },
  // B6 Brick 6B2 replaces Finance's raw teacherEarnings dependency with a certified rollup
  // summary dataset. That dataset fails closed to the old month-bounded raw ledger query if the
  // selected month is not certified or any returned rollup is unsafe.
  finance: {
    datasets: [
      'financeTotals',
      'charges',
      'teacherFinanceSummary',
      'classSessions',
      'enrollments',
      'courses',
    ],
    rawDatasets: ['charges', 'classSessions', 'enrollments', 'courses'],
  },
  delivery: {
    datasets: ['charges', 'classSessions', 'enrollments', 'courses'],
    rawDatasets: ['charges', 'classSessions', 'enrollments', 'courses'],
  },
  // The dedicated Teachers view intentionally keeps raw teacherEarnings because it shows
  // per-teacher/deleted-profile detail rather than summary-only finance metrics.
  teachers: {
    datasets: ['teacherEarnings', 'users'],
    rawDatasets: ['teacherEarnings', 'users'],
  },
};

export const analyticsReadPlanForView = (view: AnalyticsView): AnalyticsReadPlan => PLAN[view];

export const ANALYTICS_DATASET_CACHE_TTL_MS = 5 * 60 * 1000;