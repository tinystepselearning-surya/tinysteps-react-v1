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
  // Finance needs raw detail today to preserve the existing forecast and payout semantics.
  // Brick 3 keeps these reads explicit and on-demand rather than changing the calculations.
  finance: {
    datasets: [
      'financeTotals',
      'charges',
      'teacherEarnings',
      'classSessions',
      'enrollments',
      'courses',
    ],
    rawDatasets: ['charges', 'teacherEarnings', 'classSessions', 'enrollments', 'courses'],
  },
  delivery: {
    datasets: ['charges', 'classSessions', 'enrollments', 'courses'],
    rawDatasets: ['charges', 'classSessions', 'enrollments', 'courses'],
  },
  teachers: {
    datasets: ['teacherEarnings', 'users'],
    rawDatasets: ['teacherEarnings', 'users'],
  },
};

export const analyticsReadPlanForView = (view: AnalyticsView): AnalyticsReadPlan => PLAN[view];

export const ANALYTICS_DATASET_CACHE_TTL_MS = 5 * 60 * 1000;
