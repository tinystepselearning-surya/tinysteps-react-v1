import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  collectionGroup,
  getAggregateFromServer,
  query,
  sum,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import DemoSessionsManagement from './DemoSessionsManagement';
import LeadSourceAnalysis from './LeadSourceAnalysis';
import { normalizeCanonicalMonthFinanceTotals } from './parentPaymentsReporting';
import {
  ANALYTICS_TIME_ZONE,
  aggregateTeacherEarnings,
  analyticsMonthKeyFromDate,
  summarizeSessionCharges,
  summarizeTeacherEarnings,
} from './analyticsV2Metrics';
import {
  ANALYTICS_DATASET_CACHE_TTL_MS,
  analyticsReadPlanForView,
  type AnalyticsDataset,
  type AnalyticsView,
} from './analyticsReadPlan';

const ANALYTICS_VIEWS: Array<{ id: AnalyticsView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth & Admissions' },
  { id: 'acquisition', label: 'Acquisition' },
  { id: 'finance', label: 'Finance' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'teachers', label: 'Teachers' },
];

const CANCELLED_SESSION_STATUSES = new Set(['cancelled', 'canceled']);
const NON_PLANNED_SESSION_STATUSES = new Set([
  'reschedule_requested',
  'rescheduled',
  'no_show',
  'noshow',
  'consumed',
  'settled',
  'paid',
  'locked',
]);
const SCHEDULE_SESSION_SOURCES = new Set(['enrollmentschedule', 'enrollmentschedulereplace']);
const UPCOMING_SESSION_STATUSES = new Set(['scheduled', 'open', 'upcoming']);
const ACTIVE_LIKE_ENROLLMENT_STATUSES = new Set([
  'trial',
  'active',
  'paused',
  'pending_teacher',
  'pending_payment',
  'enrolled',
  'current',
  'ongoing',
]);
const NON_PROJECTABLE_ENROLLMENT_STATUSES = new Set([
  'paused',
  'pending_teacher',
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'canceled',
  'archived',
  'inactive',
]);
const LEGACY_PAST_ENROLLMENT_STATUSES = new Set([
  'completed',
  'discontinued',
  'expired',
  'cancelled',
  'canceled',
  'archived',
]);

const monthRangeFromKey = (monthKey: string): { startYmd: string; endYmd: string } | null => {
  const parts = String(monthKey || '').split('-');
  if (parts.length !== 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null;
  const startYmd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const endYmd = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;
  return { startYmd, endYmd };
};

const ymdInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value || '';
  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
};

const normalizeStatus = (value: unknown): string => String(value || '').trim().toLowerCase();
const formatMoney = (value: unknown): string => {
  const num = Number(value);
  return Number.isFinite(num) ? `₹${Math.round(num).toLocaleString('en-IN')}` : '₹0';
};
const formatPercent = (value: number): string => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const normalizeEnrollmentStatus = (enrollment: any): string => {
  const raw = normalizeStatus(enrollment?.status);
  if (!raw) {
    const archivedLike = Boolean(enrollment?.archivedAt) || enrollment?.isArchived === true || enrollment?.archived === true;
    return archivedLike ? 'archived' : 'unknown';
  }
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inactive') return 'archived';
  return raw;
};

const isEnrollmentProjectable = (enrollment: any): boolean => {
  const rawStatus = normalizeStatus(enrollment?.status);
  if (rawStatus && NON_PROJECTABLE_ENROLLMENT_STATUSES.has(rawStatus)) return false;
  return ACTIVE_LIKE_ENROLLMENT_STATUSES.has(normalizeEnrollmentStatus(enrollment));
};

const isPlannedScheduleSession = (session: any): boolean => {
  const sessionStatus = normalizeStatus(session?.status);
  if (sessionStatus && CANCELLED_SESSION_STATUSES.has(sessionStatus)) return false;
  if (sessionStatus && NON_PLANNED_SESSION_STATUSES.has(sessionStatus)) return false;
  const source = normalizeStatus(session?.source);
  return !source || SCHEDULE_SESSION_SOURCES.has(source);
};

const resolvePositiveNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
};

type CachedDataset = { value: unknown; loadedAt: number };
type DatasetCache = Partial<Record<AnalyticsDataset, CachedDataset>>;
type ActiveData = Partial<Record<AnalyticsDataset, unknown>>;

const emptyRows: any[] = [];

const loadAnalyticsDataset = async (dataset: AnalyticsDataset, monthKey: string): Promise<unknown> => {
  const monthRange = monthRangeFromKey(monthKey);
  if (!monthRange) throw new Error('Select a valid analytics month.');

  switch (dataset) {
    case 'financeTotals': {
      const result = await getAggregateFromServer(
        query(collectionGroup(db, 'months'), where('monthKey', '==', monthKey)),
        {
          selectedMonthBilled: sum('billedAmount'),
          selectedMonthSettled: sum('settledAmount'),
          selectedMonthOutstanding: sum('dueAmount'),
        },
      );
      return result.data();
    }
    case 'charges': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:month-billing-charges',
        query(collection(db, 'billingCharges'), where('monthKey', '==', monthKey)),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
        .filter((charge) => charge.archived !== true);
    }
    case 'teacherEarnings': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:month-teacher-earnings',
        query(collection(db, 'teacherEarnings'), where('monthKey', '==', monthKey)),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }))
        .filter((entry) => entry.archived !== true);
    }
    case 'classSessions': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:month-class-sessions',
        query(
          collection(db, 'classSessions'),
          where('date', '>=', monthRange.startYmd),
          where('date', '<=', monthRange.endYmd),
        ),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }
    case 'users': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:all-users',
        query(collection(db, 'users')),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }
    case 'enrollments': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:all-enrollments',
        query(collection(db, 'enrollments')),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }
    case 'courses': {
      const snap = await getDocsLogged(
        'AnalyticsDashboardV3:all-courses',
        query(collection(db, 'courses')),
        { source: 'src/pages/admin/AnalyticsDashboardV3.tsx' },
      );
      return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    }
    default:
      return null;
  }
};

const MetricCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <Card className="border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1.5 text-2xl font-semibold leading-tight tabular-nums text-slate-950">{value}</div>
    {sub ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{sub}</div> : null}
  </Card>
);

const SectionHeading = ({ title, description }: { title: string; description: string }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);

export default function AnalyticsDashboardV3(): JSX.Element {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => analyticsMonthKeyFromDate(new Date()));
  const [activeData, setActiveData] = useState<ActiveData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [teacherTab, setTeacherTab] = useState<'live' | 'archived'>('live');
  const [teacherPage, setTeacherPage] = useState(1);
  const cacheRef = useRef<Map<string, DatasetCache>>(new Map());

  const plan = useMemo(() => analyticsReadPlanForView(activeView), [activeView]);
  const requiredDatasets = plan.datasets;
  const selectedRange = useMemo(() => monthRangeFromKey(selectedMonth), [selectedMonth]);
  const todayIst = ymdInTimeZone(new Date(), ANALYTICS_TIME_ZONE);
  const currentMonthKey = todayIst.slice(0, 7);
  const analyticsStartKey = selectedRange?.startYmd || '';
  const analyticsEndKey = selectedRange
    ? selectedMonth === currentMonthKey ? todayIst : selectedRange.endYmd
    : '';

  useEffect(() => {
    let active = true;
    const now = Date.now();
    const monthCache = cacheRef.current.get(selectedMonth) || {};
    const nextData: ActiveData = {};
    const missing: AnalyticsDataset[] = [];
    let newestLoadedAt = 0;

    requiredDatasets.forEach((dataset) => {
      const cached = monthCache[dataset];
      if (cached && now - cached.loadedAt < ANALYTICS_DATASET_CACHE_TTL_MS) {
        nextData[dataset] = cached.value;
        newestLoadedAt = Math.max(newestLoadedAt, cached.loadedAt);
      } else {
        missing.push(dataset);
      }
    });

    setActiveData(nextData);
    setError(null);

    if (requiredDatasets.length === 0) {
      setLoading(false);
      setLastLoadedAt(null);
      return () => {
        active = false;
      };
    }

    if (missing.length === 0) {
      setLoading(false);
      setLastLoadedAt(newestLoadedAt || null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    void Promise.all(
      missing.map(async (dataset) => [dataset, await loadAnalyticsDataset(dataset, selectedMonth)] as const),
    )
      .then((loadedPairs) => {
        if (!active) return;
        const loadedAt = Date.now();
        const mergedCache: DatasetCache = { ...monthCache };
        const mergedData: ActiveData = { ...nextData };
        loadedPairs.forEach(([dataset, value]) => {
          mergedCache[dataset] = { value, loadedAt };
          mergedData[dataset] = value;
        });
        cacheRef.current.set(selectedMonth, mergedCache);
        setActiveData(mergedData);
        setLastLoadedAt(loadedAt);
      })
      .catch((loadError: any) => {
        if (!active) return;
        setError(loadError?.message || 'Analytics data could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeView, refreshNonce, selectedMonth]);

  const invalidateCurrentView = () => {
    const monthCache = cacheRef.current.get(selectedMonth);
    if (monthCache) {
      requiredDatasets.forEach((dataset) => delete monthCache[dataset]);
      cacheRef.current.set(selectedMonth, monthCache);
    }
    setRefreshNonce((value) => value + 1);
  };

  const financeTotals = normalizeCanonicalMonthFinanceTotals((activeData.financeTotals || {}) as Record<string, unknown>);
  const charges = (activeData.charges as any[] | undefined) || emptyRows;
  const teacherEarningsEntries = (activeData.teacherEarnings as any[] | undefined) || emptyRows;
  const classSessions = (activeData.classSessions as any[] | undefined) || emptyRows;
  const users = (activeData.users as any[] | undefined) || emptyRows;
  const enrollments = (activeData.enrollments as any[] | undefined) || emptyRows;
  const courses = (activeData.courses as any[] | undefined) || emptyRows;

  const sessionChargeTotals = useMemo(() => summarizeSessionCharges(charges), [charges]);
  const teacherRowsRaw = useMemo(() => aggregateTeacherEarnings(teacherEarningsEntries), [teacherEarningsEntries]);
  const teacherSummary = useMemo(() => summarizeTeacherEarnings(teacherRowsRaw), [teacherRowsRaw]);

  const plannedProjection = useMemo(() => {
    let plannedSessions = 0;
    let remainingScheduledSessions = 0;
    let projectedRevenue = 0;
    let missingFeeSessions = 0;
    const enrollmentIds = new Set<string>();
    const enrollmentById = new Map<string, any>();
    enrollments.forEach((enrollment) => {
      const id = String(enrollment?.id || '').trim();
      if (id) enrollmentById.set(id, enrollment);
    });
    const courseById = new Map<string, any>();
    courses.forEach((course) => {
      [course?.id, course?.courseId, course?.slug, course?.code]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .forEach((key) => {
          if (!courseById.has(key)) courseById.set(key, course);
        });
    });

    classSessions.forEach((session) => {
      if (!isPlannedScheduleSession(session)) return;
      const enrollmentId = String(session?.enrollmentId || '').trim();
      if (!enrollmentId) return;
      const enrollment = enrollmentById.get(enrollmentId);
      if (!enrollment || !isEnrollmentProjectable(enrollment)) return;
      plannedSessions += 1;
      if (UPCOMING_SESSION_STATUSES.has(normalizeStatus(session?.status))) remainingScheduledSessions += 1;
      enrollmentIds.add(enrollmentId);
      const course = courseById.get(String(session?.courseId || enrollment?.courseId || '').trim());
      const feePerSession = resolvePositiveNumber(
        session?.feeAmount,
        session?.feePerClass,
        enrollment?.feePerClass,
        enrollment?.ratePerSession,
        course?.feePerClass,
        course?.ratePerSession,
      );
      if (feePerSession > 0) projectedRevenue += feePerSession;
      else missingFeeSessions += 1;
    });

    return {
      plannedSessions,
      remainingScheduledSessions,
      scheduleDrivenEnrollments: enrollmentIds.size,
      projectedRevenue,
      avgProjectedRevenuePerSession: plannedSessions > 0 ? projectedRevenue / plannedSessions : 0,
      missingFeeSessions,
    };
  }, [classSessions, courses, enrollments]);

  const enrollmentBuckets = useMemo(() => {
    const counts = { activeLike: 0, past: 0, other: 0 };
    enrollments.forEach((enrollment) => {
      const status = normalizeEnrollmentStatus(enrollment);
      if (ACTIVE_LIKE_ENROLLMENT_STATUSES.has(status)) counts.activeLike += 1;
      else if (LEGACY_PAST_ENROLLMENT_STATUSES.has(status)) counts.past += 1;
      else counts.other += 1;
    });
    return counts;
  }, [enrollments]);

  const teacherProfileById = useMemo(() => {
    const map: Record<string, { name: string; role: string; status: string }> = {};
    users.forEach((user) => {
      map[user.id] = {
        name: user.displayName || user.name || user.email || user.id,
        role: normalizeStatus(user.role),
        status: normalizeStatus(user.status || 'active'),
      };
    });
    return map;
  }, [users]);

  const teacherRows = useMemo(() => teacherRowsRaw.map((row) => {
    const profile = teacherProfileById[row.teacherId];
    let profileTag = 'Live';
    if (activeView === 'teachers') {
      if (!profile) profileTag = 'Deleted / Missing';
      else if (profile.role !== 'teacher') profileTag = 'Role changed';
      else if (['archived', 'suspended', 'inactive'].includes(profile.status)) profileTag = 'Archived / Inactive';
    }
    return {
      ...row,
      teacher: profile?.name || row.teacherId,
      profileTag,
    };
  }), [activeView, teacherProfileById, teacherRowsRaw]);

  const liveTeacherRows = teacherRows.filter((row) => row.profileTag === 'Live');
  const archivedTeacherRows = teacherRows.filter((row) => row.profileTag !== 'Live');
  const filteredTeacherRows = teacherTab === 'live' ? liveTeacherRows : archivedTeacherRows;
  const TEACHER_PAGE_SIZE = 20;
  const teacherPageCount = Math.max(1, Math.ceil(filteredTeacherRows.length / TEACHER_PAGE_SIZE));
  const visibleTeacherRows = filteredTeacherRows.slice((teacherPage - 1) * TEACHER_PAGE_SIZE, teacherPage * TEACHER_PAGE_SIZE);

  useEffect(() => {
    setTeacherPage(1);
  }, [selectedMonth, teacherTab]);
  useEffect(() => {
    if (teacherPage > teacherPageCount) setTeacherPage(teacherPageCount);
  }, [teacherPage, teacherPageCount]);

  const expectedRevenue = financeTotals.selectedMonthBilled;
  const earnedRevenue = financeTotals.selectedMonthSettled;
  const balanceDueRevenue = financeTotals.selectedMonthOutstanding;
  const collectionRate = financeTotals.collectionRate;
  const completedSessionsMonth = sessionChargeTotals.sessionChargesCount;
  const avgSessionPayout = teacherSummary.totalSessionCount > 0
    ? teacherSummary.totalSessionEarned / teacherSummary.totalSessionCount
    : 0;
  const projectedTeacherPayout = plannedProjection.plannedSessions * avgSessionPayout;
  const sessionNetRevenue = sessionChargeTotals.sessionChargesTotal - teacherSummary.totalSessionEarned;

  const lastRefreshLabel = lastLoadedAt
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: ANALYTICS_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(lastLoadedAt))
    : '—';

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Admin Analytics</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Management reporting with heavy operational datasets loaded only when their detail view is opened.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="analytics-month" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reporting month
              </label>
              <Input
                id="analytics-month"
                aria-label="Analytics reporting month"
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-[165px]"
              />
            </div>
            {requiredDatasets.length > 0 ? (
              <Button type="button" size="sm" variant="outline" disabled={loading} onClick={invalidateCurrentView}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Period: {analyticsStartKey || '—'} to {analyticsEndKey || '—'}</span>
          <span>Timezone: {ANALYTICS_TIME_ZONE}</span>
          <span>Last detail refresh: {lastRefreshLabel}</span>
          <span>{plan.rawDatasets.length} raw dataset{plan.rawDatasets.length === 1 ? '' : 's'} required for this view</span>
        </div>
      </header>

      <nav aria-label="Analytics sections" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <div className="flex min-w-max gap-1">
          {ANALYTICS_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              aria-pressed={activeView === view.id}
              onClick={() => setActiveView(view.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${activeView === view.id ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </nav>

      {loading ? (
        <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          Loading only the datasets required for {activeView}…
        </div>
      ) : null}
      {error ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Analytics detail: {error}
        </div>
      ) : null}

      {activeView === 'overview' ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <SectionHeading
              title="Executive scorecard"
              description="Canonical month-level finance totals load without downloading raw sessions, charges, earnings, enrollments, courses, or users."
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Billed Revenue (Month)" value={loading ? '…' : formatMoney(expectedRevenue)} />
              <MetricCard label="Settled Revenue (Month)" value={loading ? '…' : formatMoney(earnedRevenue)} />
              <MetricCard label="Collection Rate" value={loading ? '…' : formatPercent(collectionRate)} />
              <MetricCard label="Balance Due" value={loading ? '…' : formatMoney(balanceDueRevenue)} />
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <DemoSessionsManagement
              mode="trend_only"
              showTrendAnalytics
              analyticsStartKey={analyticsStartKey}
              analyticsEndKey={analyticsEndKey}
              analyticsVariant="summary"
            />
            <Card className="border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-slate-950">Management attention</h3>
              <p className="mt-1 text-xs text-muted-foreground">Only summary-level exceptions are shown here. Operational detail loads on demand.</p>
              <div className="mt-4 space-y-3">
                {!loading && !error && balanceDueRevenue > 0 ? (
                  <button type="button" onClick={() => setActiveView('finance')} className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left">
                    <div className="text-sm font-semibold text-amber-900">{formatMoney(balanceDueRevenue)} balance due</div>
                    <div className="mt-1 text-xs text-amber-800">Open Finance for detailed settlement and forecast analysis →</div>
                  </button>
                ) : null}
                {!loading && !error && balanceDueRevenue === 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                    No billed balance outstanding for the selected month.
                  </div>
                ) : null}
              </div>
            </Card>
          </section>
        </div>
      ) : null}

      {activeView === 'growth' ? (
        <section className="space-y-3">
          <SectionHeading title="Growth & Admissions" description="Admissions analytics uses its own bounded data sources without loading finance or delivery collections." />
          <DemoSessionsManagement
            mode="trend_only"
            showTrendAnalytics
            analyticsStartKey={analyticsStartKey}
            analyticsEndKey={analyticsEndKey}
            analyticsVariant="full"
          />
        </section>
      ) : null}

      {activeView === 'acquisition' ? (
        <section className="space-y-3">
          <SectionHeading title="Acquisition" description="Marketing attribution remains scoped to the selected reporting period." />
          <LeadSourceAnalysis startDateKey={analyticsStartKey} endDateKey={analyticsEndKey} showFunnel={false} showAttribution />
        </section>
      ) : null}

      {activeView === 'finance' ? (
        <section className="space-y-5">
          <SectionHeading title="Finance & Collections" description="Raw finance, earning, session, enrollment, and course detail loads only in this specialist view." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard label="Billed Revenue (Month)" value={loading ? '…' : formatMoney(expectedRevenue)} />
            <MetricCard label="Settled Revenue (Month)" value={loading ? '…' : formatMoney(earnedRevenue)} />
            <MetricCard label="Collection Rate" value={loading ? '…' : formatPercent(collectionRate)} />
            <MetricCard label="Balance Due" value={loading ? '…' : formatMoney(balanceDueRevenue)} />
            <MetricCard label="Completed Sessions (Billed)" value={loading ? '…' : completedSessionsMonth} />
          </div>
          {!loading && !error ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Scheduled Sessions in Month" value={plannedProjection.plannedSessions} />
                <MetricCard label="Remaining Scheduled Sessions" value={plannedProjection.remainingScheduledSessions} />
                <MetricCard
                  label="Full-Month Scheduled Revenue"
                  value={formatMoney(plannedProjection.projectedRevenue)}
                  sub={plannedProjection.missingFeeSessions > 0 ? `${plannedProjection.missingFeeSessions} sessions missing fee configuration` : `Average ${formatMoney(plannedProjection.avgProjectedRevenuePerSession)} per scheduled session`}
                />
                <MetricCard
                  label="Estimated Teacher Payout (Planned)"
                  value={teacherSummary.totalSessionCount > 0 ? formatMoney(projectedTeacherPayout) : 'Unavailable'}
                  sub={teacherSummary.totalSessionCount > 0 ? `Using realized average payout/session ${formatMoney(avgSessionPayout)}` : 'No realized payout baseline for this month'}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Session Net Revenue" value={formatMoney(sessionNetRevenue)} />
                <MetricCard label="Demo Earnings" value={formatMoney(teacherSummary.totalDemoEarned)} sub={`${teacherSummary.totalDemoCount} demo earning entries`} />
                <MetricCard label="Total Teacher Payout" value={formatMoney(teacherSummary.totalCombinedEarned)} />
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeView === 'delivery' ? (
        <section className="space-y-5">
          <SectionHeading title="Delivery & Enrollment" description="Delivery detail loads session, enrollment, course, and charge data only when this view is opened." />
          {!loading && !error ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Active-Like Enrollments" value={enrollmentBuckets.activeLike} />
                <MetricCard label="Past Enrollments" value={enrollmentBuckets.past} />
                <MetricCard label="Other / Unknown" value={enrollmentBuckets.other} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Scheduled Sessions in Month" value={plannedProjection.plannedSessions} />
                <MetricCard label="Remaining Scheduled Sessions" value={plannedProjection.remainingScheduledSessions} />
                <MetricCard label="Completed Sessions (Billed)" value={completedSessionsMonth} />
                <MetricCard label="Enrollment-Linked Schedules" value={plannedProjection.scheduleDrivenEnrollments} />
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {activeView === 'teachers' ? (
        <section className="space-y-5">
          <SectionHeading title="Teacher Economics" description="Teacher earnings and user profiles load only when this dedicated view is opened." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Teacher Payout" value={loading ? '…' : formatMoney(teacherSummary.totalCombinedEarned)} />
            <MetricCard label="Session Earnings" value={loading ? '…' : formatMoney(teacherSummary.totalSessionEarned)} sub={`${teacherSummary.totalSessionCount} session earning entries`} />
            <MetricCard label="Demo Earnings" value={loading ? '…' : formatMoney(teacherSummary.totalDemoEarned)} sub={`${teacherSummary.totalDemoCount} demo earning entries`} />
            <MetricCard label="Average Session Payout" value={loading ? '…' : formatMoney(avgSessionPayout)} />
          </div>

          <Card className="border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Teacher earnings · selected month</h3>
                <p className="mt-1 text-xs text-muted-foreground">The table reuses the same cached month earnings if Finance was opened first.</p>
              </div>
              <span className="text-xs text-muted-foreground">{filteredTeacherRows.length} teachers</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant={teacherTab === 'live' ? 'default' : 'outline'} onClick={() => setTeacherTab('live')}>Live ({liveTeacherRows.length})</Button>
              <Button type="button" size="sm" variant={teacherTab === 'archived' ? 'default' : 'outline'} onClick={() => setTeacherTab('archived')}>Archived / Deleted ({archivedTeacherRows.length})</Button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-2">Teacher</th><th className="p-2">Profile</th><th className="p-2 text-right">Demo #</th><th className="p-2 text-right">Demo ₹</th><th className="p-2 text-right">Session #</th><th className="p-2 text-right">Session ₹</th><th className="p-2 text-right">Total ₹</th><th className="p-2 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeacherRows.length === 0 ? (
                    <tr><td className="p-4 text-muted-foreground" colSpan={8}>{loading ? 'Loading teacher earnings…' : 'No teacher earnings for this view.'}</td></tr>
                  ) : visibleTeacherRows.map((teacher) => (
                    <tr key={teacher.teacherId} className="border-t">
                      <td className="p-2 font-medium">{teacher.teacher}</td>
                      <td className="p-2">{teacher.profileTag}</td>
                      <td className="p-2 text-right">{teacher.demoCount || '—'}</td>
                      <td className="p-2 text-right">{teacher.demoEarned > 0 ? formatMoney(teacher.demoEarned) : '—'}</td>
                      <td className="p-2 text-right">{teacher.sessionCount || '—'}</td>
                      <td className="p-2 text-right">{teacher.sessionEarned > 0 ? formatMoney(teacher.sessionEarned) : '—'}</td>
                      <td className="p-2 text-right font-semibold">{formatMoney(teacher.totalEarned)}</td>
                      <td className="p-2 text-right">{formatMoney(teacher.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTeacherRows.length > TEACHER_PAGE_SIZE ? (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs text-muted-foreground">Page {teacherPage} of {teacherPageCount}</span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={teacherPage <= 1} onClick={() => setTeacherPage((page) => Math.max(1, page - 1))}>Previous</Button>
                  <Button type="button" size="sm" variant="outline" disabled={teacherPage >= teacherPageCount} onClick={() => setTeacherPage((page) => Math.min(teacherPageCount, page + 1))}>Next</Button>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
