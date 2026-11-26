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
    ['activeEnrollmentsAtClose', 'Active enrollments (month end / latest)'],
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
export type ActiveEnrollmentBasis = 'reconstructed' | 'observed_snapshot' | 'observed_month_end';
export type MonthRow = { monthKey: string; metrics: Partial<Record<BusinessMetric, number | null>>; activeEnrollmentBasis?: ActiveEnrollmentBasis; activeEnrollmentObservedAt?: string };
export type YearProjection = { year: string; updatedAt: string; throughDate: string | null; months: MonthRow[]; availableRecords: boolean; undatedRecords: number; conflictingInquiryDates: number; correctionBasedAdmissions: number; historicalActiveEnrollmentExclusions: number; };
export type CurrentProjection = { updatedAt: string; throughDate: string | null; availableRecords: boolean; unresolvedRecords: number; activeStudents: number | null; activeEnrollments: number | null; pausedStudents: number | null; retainedStudents: number | null };
const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const count = (v: unknown): number | null => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;
const timestamp = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v));
const validEnvelope = (r: Record<string, unknown> | null): r is Record<string, unknown> =>
  !!r && r.schemaVersion === BUSINESS_ANALYTICS_SCHEMA && r.metricDefinitionVersion === 1 &&
  r.verificationStatus === 'verified' && timestamp(r.updatedAt);
const throughDate = (r: Record<string, unknown>): string | null => r.refreshMode === 'daily_closed_day' && typeof r.throughDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.throughDate) ? r.throughDate : null;
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
    const basis = row.activeEnrollmentBasis;
    const observedAt = timestamp(row.activeEnrollmentObservedAt) ? row.activeEnrollmentObservedAt : undefined;
    months.push({ monthKey: row.monthKey, metrics: parsed,
      ...(basis === 'reconstructed' || basis === 'observed_snapshot' || basis === 'observed_month_end' ? { activeEnrollmentBasis: basis } : {}),
      ...(observedAt ? { activeEnrollmentObservedAt: observedAt } : {}),
    });
  }
  const issues = record(r.issues);
  const undatedRecords = ['undatedEnquiries','undatedCharges','invalidChargeAmounts','undatedAdmissions','undatedCourseEnds','ambiguousStudentExits','unresolvedEnrollmentIdentity','unresolvedEnrollmentStatus'].reduce((sum, key) => sum + (count(issues?.[key]) ?? 0), 0);
  return { year, updatedAt: r.updatedAt as string, throughDate: throughDate(r), months: months.sort((a, b) => a.monthKey.localeCompare(b.monthKey)), availableRecords: r.coverageMode === 'available_records', undatedRecords, conflictingInquiryDates: count(issues?.conflictingInquiryDates) ?? 0, correctionBasedAdmissions: count(issues?.correctionBasedAdmissions) ?? 0, historicalActiveEnrollmentExclusions: count(issues?.historicalActiveEnrollmentExclusions) ?? 0 };
}
export function parseBusinessCurrent(input: unknown): CurrentProjection | null {
  const r = record(input);
  if (!validEnvelope(r)) return null;
  return {
    updatedAt: r.updatedAt as string,
    throughDate: throughDate(r),
    availableRecords: r.coverageMode === 'available_records',
    unresolvedRecords: (count(record(r.issues)?.unresolvedEnrollmentIdentity) ?? 0) + (count(record(r.issues)?.unresolvedEnrollmentStatus) ?? 0),
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

/** Display-only insights from the saved projection. No inferred historical coverage or extra reads. */
export function businessSnapshotDay(annual: YearProjection): string {
  if (annual.throughDate) return annual.throughDate;
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(annual.updatedAt));
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return part('year') + '-' + part('month') + '-' + part('day');
}
export function businessTrendSummary(annual: YearProjection, metric: BusinessMetric) {
  const day = businessSnapshotDay(annual);
  const boundary = day.slice(0, 7);
  const lastDay = new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)), 0)).getUTCDate();
  const partialMonth = !annual.throughDate || Number(day.slice(8, 10)) !== lastDay ? boundary : null;
  const months = Array.from({ length: 12 }, (_, i) => annual.year + '-' + String(i + 1).padStart(2, '0'));
  const rows = months.map(monthKey => ({
    monthKey,
    value: monthKey <= boundary ? annual.months.find(m => m.monthKey === monthKey)?.metrics[metric] ?? null : null,
    partial: monthKey === partialMonth,
  }));
  const elapsed = rows.filter(r => r.monthKey <= boundary);
  const latest = elapsed.length ? elapsed[elapsed.length - 1] : null;
  const completed = elapsed.filter(r => !r.partial);
  const known = elapsed.filter((r): r is typeof r & { value: number } => r.value !== null);
  const completeKnown = completed.filter((r): r is typeof r & { value: number } => r.value !== null);
  const peak = completeKnown.reduce<typeof completeKnown[number] | null>((best, r) => !best || r.value > best.value ? r : best, null);
  const lastComplete = completed.length ? completed[completed.length - 1] : null;
  const previousComplete = completed.length > 1 ? completed[completed.length - 2] : null;
  const change = lastComplete?.value != null && previousComplete?.value != null && previousComplete.value > 0
    ? (lastComplete.value - previousComplete.value) / previousComplete.value * 100 : null;
  return {
    rows, latest, peak, lastComplete, previousComplete, change,
    total: known.length ? known.reduce((sum, r) => sum + r.value, 0) : null,
    knownMonths: known.length, elapsedMonths: elapsed.length,
    average: completeKnown.length ? Math.round(completeKnown.reduce((sum, r) => sum + r.value, 0) / completeKnown.length) : null,
    averageMonths: completeKnown.length,
  };
}

/** Stock is a point-in-time measure. Do not sum across months. Legacy initial
 * snapshots can supply only their matching current-month roster, never history. */
export function monthlyActiveEnrollmentRows(annual: YearProjection, current: CurrentProjection | null) {
  const boundary = businessSnapshotDay(annual).slice(0, 7);
  return Array.from({ length: 12 }, (_, i) => {
    const monthKey = annual.year + '-' + String(i + 1).padStart(2, '0');
    const row = annual.months.find(r => r.monthKey === monthKey);
    const value = monthKey <= boundary && row?.activeEnrollmentBasis ? row.metrics.activeEnrollmentsAtClose ?? null : null;
    if (value !== null) return { monthKey, value, basis: row?.activeEnrollmentBasis, observedAt: row?.activeEnrollmentObservedAt };
    if (monthKey === boundary && current && current.updatedAt === annual.updatedAt && current.throughDate === annual.throughDate && current.activeEnrollments != null) {
      return { monthKey, value: current.activeEnrollments, basis: 'observed_snapshot' as const, observedAt: current.updatedAt };
    }
    return { monthKey, value: null, basis: undefined, observedAt: undefined };
  });
}
