// Aggregate-only monthly business analytics contract. Never infer missing values as zero.
export const BUSINESS_ANALYTICS_SCHEMA = 1;
export const BUSINESS_ANALYTICS_TTL_MS = 5 * 60 * 1000;
export const BUSINESS_ANALYTICS_PATHS = {
  year: (year: string) => ['adminStats', 'businessAnalyticsV1', 'businessAnalyticsYears', year] as const,
  current: ['adminStats', 'businessAnalyticsV1', 'businessAnalyticsSnapshots', 'current'] as const,
};
export const BUSINESS_METRICS = {
  leads: [
    ['leadEnquiries', 'Total enquiries'],
  ],
  payments: [
    ['billedPaise', 'Billed for classes'],
  ],
  enrollments: [
    ['newAdmissions', 'New admissions'],
    ['newEnrollments', 'New enrollments'],
    ['courseCompletions', 'Course completions'],
    ['courseDiscontinuations', 'Course discontinuations'],
    ['completedStudentExits', 'Student exits: completed'],
    ['discontinuedStudentExits', 'Student exits: discontinued'],
    ['otherStudentExits', 'Student exits: other'],
    ['studentExits', 'Total student exits'],
  ],
} as const;
export type BusinessTab = keyof typeof BUSINESS_METRICS;
export type BusinessMetric = (typeof BUSINESS_METRICS)[BusinessTab][number][0];
export type MonthRow = { monthKey: string; metrics: Partial<Record<BusinessMetric, number | null>> };
export type YearProjection = { year: string; updatedAt: string; months: MonthRow[] };
export type CurrentProjection = { updatedAt: string; activeStudents: number | null; activeEnrollments: number | null; pausedStudents: number | null; retainedStudents: number | null };
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const count = (v: unknown): number | null => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;
const timestamp = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const validEnvelope = (r: Record<string, unknown> | null): r is Record<string, unknown> =>
  !!r && r.schemaVersion === BUSINESS_ANALYTICS_SCHEMA && r.metricDefinitionVersion === 1 &&
  r.verificationStatus === 'verified' && timestamp(r.updatedAt);
const metricKeys = Object.values(BUSINESS_METRICS).flat().map(([key]) => key);
export function parseBusinessYear(input: unknown, year: string): YearProjection | null {
  const r = record(input);
  if (!/^\d{4}$/.test(year) || !validEnvelope(r) || r.year !== year || !Array.isArray(r.months) || r.months.length > 12) return null;
  const seen = new Set<string>();
  const months: MonthRow[] = [];
  for (const value of r.months) {
    const row = record(value);
    const metrics = record(row?.metrics);
    if (!row || !metrics || typeof row.monthKey !== 'string' ||
      !new RegExp('^' + year + '-(0[1-9]|1[0-2])$').test(row.monthKey) || seen.has(row.monthKey)) return null;
    seen.add(row.monthKey);
    const parsed: MonthRow['metrics'] = {};
    for (const key of metricKeys) parsed[key] = count(metrics[key]);
    months.push({ monthKey: row.monthKey, metrics: parsed });
  }
  return { year, updatedAt: r.updatedAt as string, months: months.sort((a, b) => a.monthKey.localeCompare(b.monthKey)) };
}
export function parseBusinessCurrent(input: unknown): CurrentProjection | null {
  const r = record(input);
  if (!validEnvelope(r)) return null;
  return {
    updatedAt: r.updatedAt as string,
    activeStudents: count(r.activeStudents), activeEnrollments: count(r.activeEnrollments),
    pausedStudents: count(r.pausedStudents), retainedStudents: count(r.retainedStudents),
  };
}
export function formatBusinessMetric(key: BusinessMetric, value: number | null | undefined): string {
  if (value == null) return 'Not available';
  return key.endsWith('Paise')
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value / 100)
    : new Intl.NumberFormat('en-IN').format(value);
}
