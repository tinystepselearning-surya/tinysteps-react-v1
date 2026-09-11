import type { DemoSession } from '../../types/models';

export type FunnelRangePreset = 'week' | 'month' | 'till_date' | 'custom';

export type FunnelMetricKey =
  | 'received'
  | 'demoCreated'
  | 'assigned'
  | 'completed'
  | 'enrolled'
  | 'cancelled';

export interface LeadFunnelLead {
  id: string;
  source?: string | null;
  demoSessionId?: string | null;
  receivedAt?: unknown;
  requestedAt?: unknown;
  createdAt?: unknown;
  status?: string | null;
}

export interface FunnelActivityPoint {
  dateKey: string;
  label: string;
  received: number;
  demoCreated: number;
  assigned: number;
  completed: number;
  enrolled: number;
  cancelled: number;
}

export interface FunnelCohortTotals {
  received: number;
  demoCreated: number;
  assigned: number;
  completed: number;
  enrolled: number;
  cancelled: number;
}

export interface FunnelSourcePerformance extends FunnelCohortTotals {
  source: string;
  leadToEnrollmentRate: number;
  demoCompletionRate: number;
}

export interface FunnelAnalyticsResult {
  activity: FunnelActivityPoint[];
  cohortTotals: FunnelCohortTotals;
  sourcePerformance: FunnelSourcePerformance[];
  operational: {
    open: number;
    assigned: number;
    completedAwaitingAdmin: number;
    cancelled: number;
  };
}

export interface FunnelDateRange {
  startKey: string;
  endKey: string;
}

export interface DemoAgeBuckets {
  age0To2: number;
  age3To7: number;
  age8To30: number;
  age31Plus: number;
  missingTimestamp: number;
}

export interface DemoOperationalDiagnostics {
  openAge: DemoAgeBuckets;
  assignedAge: DemoAgeBuckets;
  decisionAge: DemoAgeBuckets;
  staleOpenOver7Days: number;
  veryStaleOpenOver30Days: number;
  staleAssignedOver7Days: number;
  staleDecisionOver7Days: number;
  activeRescheduleLinked: number;
  missingAgeTimestamp: number;
}

const EMPTY_TOTALS: FunnelCohortTotals = {
  received: 0,
  demoCreated: 0,
  assigned: 0,
  completed: 0,
  enrolled: 0,
  cancelled: 0,
};

const EMPTY_AGE_BUCKETS = (): DemoAgeBuckets => ({
  age0To2: 0,
  age3To7: 0,
  age8To30: 0,
  age31Plus: 0,
  missingTimestamp: 0,
});

const DAY_MS = 24 * 60 * 60 * 1000;

export const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
    };
    if (typeof timestamp.toMillis === 'function') {
      const millis = timestamp.toMillis();
      return Number.isFinite(millis) ? millis : 0;
    }
    if (typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      return date instanceof Date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
    }
    if (typeof timestamp.seconds === 'number') return timestamp.seconds * 1000;
  }
  return 0;
};

const getDatePartsInIst = (value: unknown): { year: number; month: number; day: number } | null => {
  const millis = toMillis(value);
  if (!millis) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(millis));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
};

export const toIstDateKey = (value: unknown): string | null => {
  const parts = getDatePartsInIst(value);
  if (!parts) return null;
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
};

export const todayIstDateKey = (): string => toIstDateKey(new Date()) || '';

export const leadReceivedDateKey = (lead: LeadFunnelLead): string | null =>
  toIstDateKey(lead.receivedAt || lead.requestedAt || lead.createdAt);

export const formatDateKeyLabel = (dateKey: string): string => {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return dateKey;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(parsed);
};

export const addDaysToDateKey = (dateKey: string, days: number): string => {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return dateKey;
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
};

export const dateKeyInRange = (dateKey: string | null, startKey: string, endKey: string): boolean =>
  Boolean(dateKey && dateKey >= startKey && dateKey <= endKey);

export const previousEqualLengthRange = (startKey: string, endKey: string): FunnelDateRange => {
  const start = new Date(`${startKey}T00:00:00Z`);
  const end = new Date(`${endKey}T00:00:00Z`);
  if (!startKey || !endKey || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    return { startKey: '', endKey: '' };
  }
  const dayCount = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const previousEndKey = addDaysToDateKey(startKey, -1);
  return {
    startKey: addDaysToDateKey(previousEndKey, -(dayCount - 1)),
    endKey: previousEndKey,
  };
};

const normalizeSource = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return 'Unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'website') return 'Website';
  if (normalized === 'whatsapp') return 'WhatsApp';
  if (normalized === 'instagram') return 'Instagram';
  if (normalized === 'referral') return 'Referral';
  if (normalized === 'manual') return 'Manual';
  return value.trim();
};

const rate = (numerator: number, denominator: number): number =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

const NON_DELIVERED_OUTCOMES = new Set(['parent_no_show', 'teacher_no_show', 'reschedule_requested']);

const isCompletedDemo = (demo: DemoSession): boolean => {
  if (!(demo.status === 'completed' || Boolean(demo.completedAt))) return false;
  return !NON_DELIVERED_OUTCOMES.has(String(demo.outcome || '').trim().toLowerCase());
};

const isEnrolledDemo = (demo: DemoSession): boolean =>
  isCompletedDemo(demo) && String(demo.conversionStatus || '').trim().toLowerCase() === 'enrolled';

const demosForLead = (
  lead: LeadFunnelLead,
  demosByLeadId: Map<string, DemoSession[]>,
  demosById: Map<string, DemoSession>,
): DemoSession[] => {
  const linked = demosByLeadId.get(lead.id) || [];
  if (!lead.demoSessionId) return linked;
  const explicit = demosById.get(lead.demoSessionId);
  if (!explicit || linked.some((demo) => demo.id === explicit.id)) return linked;
  return [...linked, explicit];
};

const addAgeBucket = (buckets: DemoAgeBuckets, timestamp: unknown, nowMs: number): number | null => {
  const millis = toMillis(timestamp);
  if (!millis) {
    buckets.missingTimestamp += 1;
    return null;
  }
  const ageDays = Math.max(0, Math.floor((nowMs - millis) / DAY_MS));
  if (ageDays <= 2) buckets.age0To2 += 1;
  else if (ageDays <= 7) buckets.age3To7 += 1;
  else if (ageDays <= 30) buckets.age8To30 += 1;
  else buckets.age31Plus += 1;
  return ageDays;
};

export const buildDemoOperationalDiagnostics = (
  demos: DemoSession[],
  now: unknown = new Date(),
): DemoOperationalDiagnostics => {
  const nowMs = toMillis(now) || Date.now();
  const diagnostics: DemoOperationalDiagnostics = {
    openAge: EMPTY_AGE_BUCKETS(),
    assignedAge: EMPTY_AGE_BUCKETS(),
    decisionAge: EMPTY_AGE_BUCKETS(),
    staleOpenOver7Days: 0,
    veryStaleOpenOver30Days: 0,
    staleAssignedOver7Days: 0,
    staleDecisionOver7Days: 0,
    activeRescheduleLinked: 0,
    missingAgeTimestamp: 0,
  };

  demos.forEach((demo) => {
    if ((demo.status === 'open' || demo.status === 'assigned') && (demo.rescheduledFromDemoId || demo.rescheduledToDemoId)) {
      diagnostics.activeRescheduleLinked += 1;
    }

    if (demo.status === 'open') {
      const ageDays = addAgeBucket(diagnostics.openAge, demo.createdAt, nowMs);
      if (ageDays === null) diagnostics.missingAgeTimestamp += 1;
      else {
        if (ageDays > 7) diagnostics.staleOpenOver7Days += 1;
        if (ageDays > 30) diagnostics.veryStaleOpenOver30Days += 1;
      }
      return;
    }

    if (demo.status === 'assigned') {
      const ageDays = addAgeBucket(diagnostics.assignedAge, demo.assignedAt || demo.createdAt, nowMs);
      if (ageDays === null) diagnostics.missingAgeTimestamp += 1;
      else if (ageDays > 7) diagnostics.staleAssignedOver7Days += 1;
      return;
    }

    if (demo.status === 'completed' && !demo.conversionStatus) {
      const ageDays = addAgeBucket(diagnostics.decisionAge, demo.completedAt || demo.lastUpdatedAt || demo.createdAt, nowMs);
      if (ageDays === null) diagnostics.missingAgeTimestamp += 1;
      else if (ageDays > 7) diagnostics.staleDecisionOver7Days += 1;
    }
  });

  return diagnostics;
};

export const buildLeadFunnelAnalytics = (
  leads: LeadFunnelLead[],
  demos: DemoSession[],
  startKey: string,
  endKey: string,
): FunnelAnalyticsResult => {
  const activity: FunnelActivityPoint[] = [];
  const byDate = new Map<string, FunnelActivityPoint>();
  if (startKey && endKey && startKey <= endKey) {
    for (let dateKey = startKey; dateKey <= endKey; dateKey = addDaysToDateKey(dateKey, 1)) {
      const point: FunnelActivityPoint = {
        dateKey,
        label: formatDateKeyLabel(dateKey),
        ...EMPTY_TOTALS,
      };
      activity.push(point);
      byDate.set(dateKey, point);
      if (dateKey === endKey) break;
    }
  }

  const increment = (dateKey: string | null, metric: FunnelMetricKey) => {
    if (!dateKey) return;
    const point = byDate.get(dateKey);
    if (point) point[metric] += 1;
  };

  leads.forEach((lead) => increment(leadReceivedDateKey(lead), 'received'));

  demos.forEach((demo) => {
    increment(toIstDateKey(demo.createdAt), 'demoCreated');
    increment(toIstDateKey(demo.assignedAt), 'assigned');
    if (isCompletedDemo(demo)) increment(toIstDateKey(demo.completedAt), 'completed');
    increment(toIstDateKey((demo as DemoSession & { cancelledAt?: unknown }).cancelledAt), 'cancelled');
    if (isEnrolledDemo(demo)) {
      increment(
        toIstDateKey((demo as DemoSession & { enrolledAt?: unknown }).enrolledAt || demo.lastUpdatedAt || demo.completedAt),
        'enrolled',
      );
    }
  });

  const demosById = new Map(demos.map((demo) => [demo.id, demo]));
  const demosByLeadId = new Map<string, DemoSession[]>();
  demos.forEach((demo) => {
    const leadId = String((demo as DemoSession & { leadId?: string | null }).leadId || '').trim();
    if (!leadId) return;
    const bucket = demosByLeadId.get(leadId) || [];
    bucket.push(demo);
    demosByLeadId.set(leadId, bucket);
  });

  const cohortTotals: FunnelCohortTotals = { ...EMPTY_TOTALS };
  const sourceMap = new Map<string, FunnelCohortTotals>();

  leads.forEach((lead) => {
    if (!dateKeyInRange(leadReceivedDateKey(lead), startKey, endKey)) return;
    const linkedDemos = demosForLead(lead, demosByLeadId, demosById);
    const source = normalizeSource(lead.source);
    const sourceTotals = sourceMap.get(source) || { ...EMPTY_TOTALS };

    cohortTotals.received += 1;
    sourceTotals.received += 1;

    if (linkedDemos.length > 0) {
      cohortTotals.demoCreated += 1;
      sourceTotals.demoCreated += 1;
    }
    if (linkedDemos.some((demo) => Boolean(demo.assignedAt) || demo.status === 'assigned' || isCompletedDemo(demo))) {
      cohortTotals.assigned += 1;
      sourceTotals.assigned += 1;
    }
    if (linkedDemos.some(isCompletedDemo)) {
      cohortTotals.completed += 1;
      sourceTotals.completed += 1;
    }
    if (linkedDemos.some(isEnrolledDemo)) {
      cohortTotals.enrolled += 1;
      sourceTotals.enrolled += 1;
    }
    if (linkedDemos.some((demo) => demo.status === 'cancelled')) {
      cohortTotals.cancelled += 1;
      sourceTotals.cancelled += 1;
    }

    sourceMap.set(source, sourceTotals);
  });

  const sourcePerformance: FunnelSourcePerformance[] = Array.from(sourceMap.entries())
    .map(([source, totals]) => ({
      source,
      ...totals,
      leadToEnrollmentRate: rate(totals.enrolled, totals.received),
      demoCompletionRate: rate(totals.completed, totals.demoCreated),
    }))
    .sort((a, b) => b.received - a.received || b.enrolled - a.enrolled || a.source.localeCompare(b.source));

  const operational = demos.reduce(
    (acc, demo) => {
      if (demo.status === 'open') acc.open += 1;
      if (demo.status === 'assigned') acc.assigned += 1;
      if (demo.status === 'cancelled') acc.cancelled += 1;
      if (demo.status === 'completed' && !demo.conversionStatus) acc.completedAwaitingAdmin += 1;
      return acc;
    },
    { open: 0, assigned: 0, completedAwaitingAdmin: 0, cancelled: 0 },
  );

  return { activity, cohortTotals, sourcePerformance, operational };
};

export const funnelRate = rate;
