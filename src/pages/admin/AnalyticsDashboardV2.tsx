import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import LeadSourceAnalysis from './LeadSourceAnalysis';
import DemoSessionsManagement from './DemoSessionsManagement';

type AnalyticsView = 'overview' | 'growth' | 'acquisition' | 'finance' | 'delivery' | 'teachers';

const ANALYTICS_VIEWS: Array<{ id: AnalyticsView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'growth', label: 'Growth & Admissions' },
  { id: 'acquisition', label: 'Acquisition' },
  { id: 'finance', label: 'Finance' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'teachers', label: 'Teachers' },
];

const monthKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

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

const formatMoney = (value: any) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

const formatPercent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const normalizeStatus = (value: any) => String(value || '').trim().toLowerCase();

const isSettledStatus = (status: string) => status === 'paid' || status === 'settled';

const resolvePaidAmount = (entry: any, amount: number) => {
  const paidRaw = Number(entry?.paidAmount);
  if (Number.isFinite(paidRaw) && paidRaw > 0) {
    return Math.min(Math.max(paidRaw, 0), Math.max(amount, 0));
  }
  return isSettledStatus(normalizeStatus(entry?.status)) ? Math.max(amount, 0) : 0;
};

const isSessionEarning = (entry: any) => {
  const source = normalizeStatus(entry?.source);
  if (source === 'session_present_completed') return true;
  return Boolean(String(entry?.sessionId || '').trim());
};

const isDemoEarning = (entry: any) => {
  const source = normalizeStatus(entry?.source);
  return source === 'demo_completed' || source === 'demo_enrolled_bonus';
};

const isSessionCharge = (entry: any) => {
  const source = normalizeStatus(entry?.source);
  if (source === 'session_present_completed') return true;
  return Boolean(String(entry?.sessionId || '').trim());
};

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

const normalizeEnrollmentStatus = (enrollment: any): string => {
  const raw = normalizeStatus(enrollment?.status);
  if (!raw) {
    const archivedLike =
      Boolean(enrollment?.archivedAt) ||
      enrollment?.isArchived === true ||
      enrollment?.archived === true;
    return archivedLike ? 'archived' : 'active';
  }
  if (raw === 'pending_teacher') return 'trial';
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') return 'active';
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inactive') return 'archived';
  return raw;
};

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

const resolvePositiveNumber = (...values: any[]): number => {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
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
  if (!source) return true;
  return SCHEDULE_SESSION_SOURCES.has(source);
};

const MetricCard = ({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  emphasis?: boolean;
}) => (
  <Card className={`p-4 shadow-sm ${emphasis ? 'border-slate-300 bg-slate-50/70' : 'border-slate-200 bg-white'}`}>
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

const AnalyticsNav = ({ activeView, onChange }: { activeView: AnalyticsView; onChange: (view: AnalyticsView) => void }) => (
  <nav aria-label="Analytics sections" className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
    <div className="flex min-w-max gap-1">
      {ANALYTICS_VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          aria-pressed={activeView === view.id}
          onClick={() => onChange(view.id)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            activeView === view.id
              ? 'bg-slate-950 text-white'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
          }`}
        >
          {view.label}
        </button>
      ))}
    </div>
  </nav>
);

export default function AnalyticsDashboardV2(): JSX.Element {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [classSessions, setClassSessions] = useState<any[]>([]);
  const [teacherEarningsEntries, setTeacherEarningsEntries] = useState<any[]>([]);
  const [coreError, setCoreError] = useState<string | null>(null);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKeyFromDate(new Date()));
  const [teacherEarningsTab, setTeacherEarningsTab] = useState<'live' | 'archived'>('live');
  const [monthRefreshKey, setMonthRefreshKey] = useState(0);
  const [monthLoading, setMonthLoading] = useState(true);
  const [coreAnalyticsEnabled, setCoreAnalyticsEnabled] = useState(false);
  const [coreRefreshKey, setCoreRefreshKey] = useState(0);
  const [coreLoading, setCoreLoading] = useState(false);
  const [lastMonthLoadedAt, setLastMonthLoadedAt] = useState<Date | null>(null);

  const selectedRange = useMemo(() => monthRangeFromKey(selectedMonth), [selectedMonth]);
  const todayIst = ymdInTimeZone(new Date(), 'Asia/Kolkata');
  const currentMonthKey = todayIst.slice(0, 7);
  const analyticsStartKey = selectedRange?.startYmd || '';
  const analyticsEndKey = selectedRange
    ? selectedMonth === currentMonthKey
      ? todayIst
      : selectedRange.endYmd
    : '';

  const viewNeedsCoreAnalytics = activeView === 'finance' || activeView === 'delivery' || activeView === 'teachers';

  useEffect(() => {
    if (viewNeedsCoreAnalytics && !coreAnalyticsEnabled) setCoreAnalyticsEnabled(true);
  }, [coreAnalyticsEnabled, viewNeedsCoreAnalytics]);

  useEffect(() => {
    if (!coreAnalyticsEnabled) {
      setUsers([]);
      setEnrollments([]);
      setCourses([]);
      setCoreError(null);
      setCoreLoading(false);
      return;
    }
    let active = true;
    const loadCore = async () => {
      setCoreLoading(true);
      setCoreError(null);
      try {
        const [usersSnap, enrollSnap, coursesSnap] = await Promise.all([
          getDocsLogged('AnalyticsDashboard:all-users', query(collection(db, 'users')), {
            source: 'src/pages/admin/AnalyticsDashboardV2.tsx',
          }),
          getDocsLogged('AnalyticsDashboard:all-enrollments', query(collection(db, 'enrollments')), {
            source: 'src/pages/admin/AnalyticsDashboardV2.tsx',
          }),
          getDocsLogged('AnalyticsDashboard:all-courses', query(collection(db, 'courses')), {
            source: 'src/pages/admin/AnalyticsDashboardV2.tsx',
          }),
        ]);
        if (!active) return;
        setCoreError(null);
        setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setEnrollments(enrollSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCourses(coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        if (active) {
          setUsers([]);
          setEnrollments([]);
          setCourses([]);
          setCoreError(err?.message || 'Core analytics data could not be loaded.');
        }
      } finally {
        if (active) setCoreLoading(false);
      }
    };
    void loadCore();
    return () => {
      active = false;
    };
  }, [coreAnalyticsEnabled, coreRefreshKey]);

  useEffect(() => {
    if (!selectedMonth) {
      setCharges([]);
      setPayments([]);
      setClassSessions([]);
      setTeacherEarningsEntries([]);
      setMonthError(null);
      setMonthLoading(false);
      setLastMonthLoadedAt(null);
      return;
    }

    const monthRange = monthRangeFromKey(selectedMonth);
    if (!monthRange) {
      setCharges([]);
      setPayments([]);
      setClassSessions([]);
      setTeacherEarningsEntries([]);
      setMonthError('Select a valid analytics month.');
      setMonthLoading(false);
      setLastMonthLoadedAt(null);
      return;
    }

    let active = true;
    setCharges([]);
    setPayments([]);
    setClassSessions([]);
    setTeacherEarningsEntries([]);
    setMonthError(null);
    setMonthLoading(true);
    setLastMonthLoadedAt(null);

    const loadMonthData = async () => {
      try {
        const [chargesSnap, paymentsSnap, teacherEarningsSnap, classSessionsSnap] = await Promise.all([
          getDocsLogged(
            'AnalyticsDashboard:month-billing-charges',
            query(collection(db, 'billingCharges'), where('monthKey', '==', selectedMonth)),
            { source: 'src/pages/admin/AnalyticsDashboardV2.tsx' },
          ),
          getDocsLogged(
            'AnalyticsDashboard:month-payments',
            query(collection(db, 'payments'), where('monthKey', '==', selectedMonth)),
            { source: 'src/pages/admin/AnalyticsDashboardV2.tsx' },
          ),
          getDocsLogged(
            'AnalyticsDashboard:month-teacher-earnings',
            query(collection(db, 'teacherEarnings'), where('monthKey', '==', selectedMonth)),
            { source: 'src/pages/admin/AnalyticsDashboardV2.tsx' },
          ),
          getDocsLogged(
            'AnalyticsDashboard:month-class-sessions',
            query(
              collection(db, 'classSessions'),
              where('date', '>=', monthRange.startYmd),
              where('date', '<=', monthRange.endYmd),
            ),
            { source: 'src/pages/admin/AnalyticsDashboardV2.tsx' },
          ),
        ]);
        if (!active) return;
        setMonthError(null);
        setCharges(
          chargesSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((charge) => charge.archived !== true),
        );
        setPayments(
          paymentsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((payment) => payment.archived !== true),
        );
        setTeacherEarningsEntries(
          teacherEarningsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((entry) => entry.archived !== true),
        );
        setClassSessions(classSessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLastMonthLoadedAt(new Date());
      } catch (err: any) {
        if (!active) return;
        setCharges([]);
        setPayments([]);
        setClassSessions([]);
        setTeacherEarningsEntries([]);
        setMonthError(err?.message || 'Selected-month analytics data could not be loaded.');
        setLastMonthLoadedAt(null);
      } finally {
        if (active) setMonthLoading(false);
      }
    };
    void loadMonthData();
    return () => {
      active = false;
    };
  }, [selectedMonth, monthRefreshKey]);

  const revenueTotals = useMemo(() => {
    let chargesTotal = 0;
    let sessionChargesTotal = 0;
    let dueTotal = 0;
    let appliedTotal = 0;
    let unappliedTotal = 0;
    let chargesCount = 0;
    let sessionChargesCount = 0;

    charges.forEach((charge) => {
      const status = String(charge.status || '').toLowerCase();
      if (status === 'void') return;
      const amountRaw = Number(charge.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      if (amount <= 0) return;
      chargesTotal += amount;
      chargesCount += 1;
      if (isSessionCharge(charge)) {
        sessionChargesTotal += amount;
        sessionChargesCount += 1;
      }

      const paidRaw = Number(charge.paidAmount ?? NaN);
      const paidAmount = Number.isFinite(paidRaw) ? paidRaw : status === 'paid' ? amount : 0;
      dueTotal += Math.max(amount - paidAmount, 0);
    });

    payments.forEach((payment) => {
      const amountRaw = Number(payment.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      if (!amount) return;
      const appliedRaw = Number(payment.appliedAmount ?? NaN);
      const unappliedRaw = Number(payment.unappliedAmount ?? NaN);
      const applied = Number.isFinite(appliedRaw)
        ? appliedRaw
        : Number.isFinite(unappliedRaw)
          ? amount - unappliedRaw
          : amount;
      const unapplied = Number.isFinite(unappliedRaw)
        ? unappliedRaw
        : Number.isFinite(appliedRaw)
          ? amount - appliedRaw
          : 0;

      appliedTotal += applied;
      unappliedTotal += unapplied;
    });

    return {
      chargesTotal,
      dueTotal,
      appliedTotal,
      unappliedTotal,
      chargesCount,
      sessionChargesTotal,
      sessionChargesCount,
    };
  }, [charges, payments]);

  const expectedRevenue = revenueTotals.chargesTotal;
  const earnedRevenue = revenueTotals.appliedTotal;
  const balanceDueRevenue = Math.max(0, expectedRevenue - earnedRevenue);
  const completedSessionsMonth = revenueTotals.sessionChargesCount;
  const collectionRate = expectedRevenue > 0 ? (earnedRevenue / expectedRevenue) * 100 : 0;

  const plannedProjection = useMemo(() => {
    let plannedSessions = 0;
    let remainingScheduledSessions = 0;
    let projectedRevenue = 0;
    let missingFeeSessions = 0;
    const enrollmentIds = new Set<string>();
    const enrollmentById = new Map<string, any>();
    enrollments.forEach((enrollment) => {
      const enrollmentId = String(enrollment?.id || '').trim();
      if (!enrollmentId) return;
      enrollmentById.set(enrollmentId, enrollment);
    });

    const courseById = new Map<string, any>();
    courses.forEach((course) => {
      const keys = [course?.id, course?.courseId, course?.slug, course?.code]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      keys.forEach((key) => {
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

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((user) => {
      map[user.id] = user.displayName || user.name || user.email || user.id;
    });
    return map;
  }, [users]);

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

  const teacherEarnings = useMemo(() => {
    const byTeacher = new Map<
      string,
      {
        teacherId: string;
        demoCount: number;
        demoEarned: number;
        sessionCount: number;
        sessionEarned: number;
        totalEarned: number;
        pending: number;
      }
    >();

    teacherEarningsEntries.forEach((entry) => {
      const teacherId = String(entry.teacherId || '').trim();
      if (!teacherId) return;
      const status = normalizeStatus(entry.status);
      if (status === 'void') return;

      const amountRaw = Number(entry.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      const paidAmount = resolvePaidAmount(entry, amount);
      const pending = Math.max(amount - paidAmount, 0);

      if (!byTeacher.has(teacherId)) {
        byTeacher.set(teacherId, {
          teacherId,
          demoCount: 0,
          demoEarned: 0,
          sessionCount: 0,
          sessionEarned: 0,
          totalEarned: 0,
          pending: 0,
        });
      }
      const bucket = byTeacher.get(teacherId)!;
      bucket.totalEarned += amount;
      bucket.pending += pending;

      if (isDemoEarning(entry)) {
        bucket.demoCount += 1;
        bucket.demoEarned += amount;
      } else if (isSessionEarning(entry)) {
        bucket.sessionCount += 1;
        bucket.sessionEarned += amount;
      }
    });

    return Array.from(byTeacher.values())
      .map((row) => ({
        teacher: nameById[row.teacherId] || row.teacherId,
        teacherId: row.teacherId,
        demoCount: row.demoCount,
        demoEarned: row.demoEarned,
        sessionCount: row.sessionCount,
        sessionEarned: row.sessionEarned,
        totalEarned: row.totalEarned,
        pending: row.pending,
        profileTag: (() => {
          if (!coreAnalyticsEnabled || coreLoading || coreError) return 'Profile not loaded';
          const profile = teacherProfileById[row.teacherId];
          if (!profile) return 'Deleted / Missing';
          if (profile.role !== 'teacher') return 'Role changed';
          if (profile.status === 'archived' || profile.status === 'suspended' || profile.status === 'inactive') {
            return 'Archived / Inactive';
          }
          return 'Live';
        })(),
      }))
      .sort((a, b) => b.pending - a.pending || b.totalEarned - a.totalEarned)
      .slice(0, 40);
  }, [teacherEarningsEntries, nameById, teacherProfileById, coreAnalyticsEnabled, coreLoading, coreError]);

  const liveTeacherEarnings = useMemo(
    () => teacherEarnings.filter((row) => row.profileTag === 'Live' || row.profileTag === 'Profile not loaded'),
    [teacherEarnings],
  );
  const archivedTeacherEarnings = useMemo(
    () => teacherEarnings.filter((row) => row.profileTag !== 'Live' && row.profileTag !== 'Profile not loaded'),
    [teacherEarnings],
  );
  const visibleTeacherEarnings = teacherEarningsTab === 'live' ? liveTeacherEarnings : archivedTeacherEarnings;

  const teacherEarningsSummary = useMemo(() => {
    let totalDemoEarned = 0;
    let totalSessionEarned = 0;
    let totalDemoCount = 0;
    let totalSessionCount = 0;
    teacherEarnings.forEach((teacher) => {
      totalDemoEarned += teacher.demoEarned;
      totalSessionEarned += teacher.sessionEarned;
      totalDemoCount += teacher.demoCount;
      totalSessionCount += teacher.sessionCount;
    });
    return {
      totalDemoEarned,
      totalSessionEarned,
      totalDemoCount,
      totalSessionCount,
      totalCombinedEarned: totalDemoEarned + totalSessionEarned,
    };
  }, [teacherEarnings]);

  const avgSessionPayout = teacherEarningsSummary.totalSessionCount > 0
    ? teacherEarningsSummary.totalSessionEarned / teacherEarningsSummary.totalSessionCount
    : 0;
  const projectedTeacherPayout = plannedProjection.plannedSessions * avgSessionPayout;
  const sessionNetEarningsMonth = revenueTotals.sessionChargesTotal - teacherEarningsSummary.totalSessionEarned;
  const coreAnalyticsReady = coreAnalyticsEnabled && !coreLoading && !coreError;
  const monthAnalyticsReady = !monthLoading && !monthError;
  const selectedMonthMetric = (value: string | number): string | number => monthLoading ? '…' : monthError ? '—' : value;
  const selectedMonthSub = (availableCopy: string): string => monthError ? 'Unavailable' : availableCopy;

  const healthState = monthLoading || (viewNeedsCoreAnalytics && coreLoading)
    ? 'Loading'
    : monthError || (viewNeedsCoreAnalytics && coreError)
      ? 'Attention required'
      : 'Healthy';

  const lastRefreshLabel = lastMonthLoadedAt
    ? new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(lastMonthLoadedAt)
    : '—';

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Admin Analytics</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Management view of growth, admissions, collections, delivery, and teacher economics.
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={monthLoading}
              onClick={() => setMonthRefreshKey((previous) => previous + 1)}
            >
              {monthLoading ? 'Refreshing…' : 'Refresh'}
            </Button>
            {coreAnalyticsEnabled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={coreLoading}
                onClick={() => setCoreRefreshKey((previous) => previous + 1)}
              >
                {coreLoading ? 'Loading detail…' : 'Refresh detail'}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>Period: {analyticsStartKey || '—'} to {analyticsEndKey || '—'}</span>
          <span>Timezone: Asia/Kolkata</span>
          <span>Last refresh: {lastRefreshLabel}</span>
          <span className={`rounded-full px-2.5 py-1 font-semibold ${healthState === 'Healthy' ? 'bg-emerald-50 text-emerald-700' : healthState === 'Loading' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-800'}`}>
            Data health: {healthState}
          </span>
        </div>
      </header>

      <AnalyticsNav activeView={activeView} onChange={setActiveView} />

      {monthLoading ? (
        <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          Loading analytics for {selectedMonth}. Previous month values have been cleared to avoid stale reporting.
        </div>
      ) : null}
      {monthError ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Month analytics: {monthError}
        </div>
      ) : null}
      {viewNeedsCoreAnalytics && coreError ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Detail analytics: {coreError}
        </div>
      ) : null}

      {activeView === 'overview' ? (
        <div className="space-y-4">
          <section aria-labelledby="executive-scorecard-heading" className="space-y-3">
            <SectionHeading
              title="Executive scorecard"
              description="The few measures required to understand this month before drilling into detail."
            />
            <div id="executive-scorecard-heading" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard label="Billed Revenue (Month)" value={selectedMonthMetric(formatMoney(expectedRevenue))} />
              <MetricCard label="Collected Payments (Month)" value={selectedMonthMetric(formatMoney(earnedRevenue))} />
              <MetricCard label="Collection Rate" value={selectedMonthMetric(formatPercent(collectionRate))} />
              <MetricCard label="Balance Due" value={selectedMonthMetric(formatMoney(balanceDueRevenue))} />
              <MetricCard label="Completed Sessions (Billed)" value={selectedMonthMetric(completedSessionsMonth)} />
              <MetricCard label="Session Net Revenue (Month)" value={selectedMonthMetric(formatMoney(sessionNetEarningsMonth))} />
            </div>
          </section>

          <section aria-labelledby="management-attention-heading" className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <div>
              <DemoSessionsManagement
                mode="trend_only"
                showTrendAnalytics
                analyticsStartKey={analyticsStartKey}
                analyticsEndKey={analyticsEndKey}
                analyticsVariant="summary"
              />
            </div>
            <Card className="border-slate-200 bg-white p-5 shadow-sm">
              <h3 id="management-attention-heading" className="text-base font-semibold text-slate-950">Management attention</h3>
              <p className="mt-1 text-xs text-muted-foreground">Exceptions that deserve a management check before deeper analysis.</p>
              <div className="mt-4 space-y-3">
                {monthError ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="text-sm font-semibold text-amber-900">Analytics data needs attention</div>
                    <div className="mt-1 text-xs text-amber-800">{monthError}</div>
                  </div>
                ) : null}
                {!monthError && balanceDueRevenue > 0 ? (
                  <button type="button" onClick={() => setActiveView('finance')} className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
                    <div className="text-sm font-semibold text-amber-900">{formatMoney(balanceDueRevenue)} balance due</div>
                    <div className="mt-1 text-xs text-amber-800">Review collections and payment recording →</div>
                  </button>
                ) : null}
                {!monthError && balanceDueRevenue === 0 ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-sm font-semibold text-emerald-900">No billed balance outstanding</div>
                    <div className="mt-1 text-xs text-emerald-800">Selected-month billed charges are fully covered by recorded collections.</div>
                  </div>
                ) : null}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Collections snapshot</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Actual billed and collected values only. Forecast is kept in Finance.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setActiveView('finance')}>Open Finance</Button>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Collection rate ${formatPercent(collectionRate)}`} role="img">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, collectionRate))}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-slate-600">Collected <strong className="text-slate-950">{selectedMonthMetric(formatMoney(earnedRevenue))}</strong></span>
                <span className="text-slate-600">Billed <strong className="text-slate-950">{selectedMonthMetric(formatMoney(expectedRevenue))}</strong></span>
              </div>
            </Card>

            <Card className="border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">Delivery snapshot</h3>
                  <p className="mt-1 text-xs text-muted-foreground">A concise month-level view; detailed capacity metrics live under Delivery.</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setActiveView('delivery')}>Open Delivery</Button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs text-slate-500">Completed billed sessions</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{selectedMonthMetric(completedSessionsMonth)}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <div className="text-xs text-slate-500">Teacher payout exposure</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{selectedMonthMetric(formatMoney(teacherEarningsSummary.totalCombinedEarned))}</div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      ) : null}

      {activeView === 'growth' ? (
        <section className="space-y-3">
          <SectionHeading
            title="Growth & Admissions"
            description="Cohort conversion, event trends, source conversion, and live demo workload for the selected management period."
          />
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
          <SectionHeading
            title="Acquisition"
            description="First-touch marketing attribution and landing-page performance aligned to the same reporting month as the management dashboard."
          />
          <LeadSourceAnalysis
            startDateKey={analyticsStartKey}
            endDateKey={analyticsEndKey}
            showFunnel={false}
            showAttribution
          />
        </section>
      ) : null}

      {activeView === 'finance' ? (
        <section className="space-y-5">
          <SectionHeading
            title="Finance & Collections"
            description="Actual performance is separated from planned/forecast values so the two cannot be mistaken for the same measure."
          />

          <div>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actual · selected month</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricCard label="Billed Revenue (Month)" value={selectedMonthMetric(formatMoney(expectedRevenue))} />
              <MetricCard label="Collected Payments (Month)" value={selectedMonthMetric(formatMoney(earnedRevenue))} />
              <MetricCard label="Collection Rate" value={selectedMonthMetric(formatPercent(collectionRate))} emphasis />
              <MetricCard label="Balance Due" value={selectedMonthMetric(formatMoney(balanceDueRevenue))} />
              <MetricCard label="Completed Sessions (Billed)" value={selectedMonthMetric(completedSessionsMonth)} />
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-50/60 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Forecast · scheduled delivery</h3>
                <p className="mt-1 text-xs text-muted-foreground">Projection from enrollment-linked planned sessions and configured fee/payout rates.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Forecast, not booked revenue</span>
            </div>
            {!coreAnalyticsReady ? (
              <div role="status" className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-muted-foreground">
                {coreLoading ? 'Loading enrollment-linked forecast data…' : coreError ? 'Forecast detail is unavailable.' : 'Preparing forecast detail…'}
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Scheduled Sessions in Month" value={plannedProjection.plannedSessions} sub="Completed + upcoming planned sessions" />
                <MetricCard label="Remaining Scheduled Sessions" value={plannedProjection.remainingScheduledSessions} sub="Upcoming sessions yet to be completed" />
                <MetricCard
                  label="Full-Month Scheduled Revenue"
                  value={formatMoney(plannedProjection.projectedRevenue)}
                  sub={plannedProjection.missingFeeSessions > 0
                    ? `${plannedProjection.missingFeeSessions} sessions missing fee configuration`
                    : `Average ${formatMoney(plannedProjection.avgProjectedRevenuePerSession)} per scheduled session`}
                />
                <MetricCard label="Projected Teacher Payout (Planned)" value={formatMoney(projectedTeacherPayout)} sub={`Average payout/session ${formatMoney(avgSessionPayout)}`} />
              </div>
            )}
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Session Net Revenue (Month)" value={selectedMonthMetric(formatMoney(sessionNetEarningsMonth))} sub={selectedMonthSub('Session charges minus teacher payout')} />
            <MetricCard label="Demo Earnings (Month)" value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalDemoEarned))} sub={selectedMonthSub(`${teacherEarningsSummary.totalDemoCount} demo earning entries`)} />
            <MetricCard label="Total Teacher Payout" value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalCombinedEarned))} sub={selectedMonthSub('Actual selected-month earning exposure')} />
          </div>
        </section>
      ) : null}

      {activeView === 'delivery' ? (
        <section className="space-y-5">
          <SectionHeading
            title="Delivery & Enrollment"
            description="Enrollment health and planned session capacity without mixing these operational measures into the executive scorecard."
          />
          {!coreAnalyticsReady ? (
            <Card className="p-5 text-sm text-muted-foreground">{coreLoading ? 'Loading delivery detail…' : coreError ? 'Delivery detail is unavailable.' : 'Preparing delivery detail…'}</Card>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Active-Like Enrollments" value={enrollmentBuckets.activeLike} />
                <MetricCard label="Past Enrollments" value={enrollmentBuckets.past} />
                <MetricCard label="Other / Unknown" value={enrollmentBuckets.other} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Scheduled Sessions in Month" value={plannedProjection.plannedSessions} />
                <MetricCard label="Remaining Scheduled Sessions" value={plannedProjection.remainingScheduledSessions} />
                <MetricCard label="Completed Sessions (Billed)" value={selectedMonthMetric(completedSessionsMonth)} />
                <MetricCard label="Enrollment-Linked Schedules" value={plannedProjection.scheduleDrivenEnrollments} />
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeView === 'teachers' ? (
        <section className="space-y-5">
          <SectionHeading
            title="Teacher Economics"
            description="Teacher payout, session economics, demo earnings, and the detailed teacher table in one dedicated full-width view."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Total Teacher Payout" value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalCombinedEarned))} />
            <MetricCard label="Session Earnings" value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalSessionEarned))} sub={`${teacherEarningsSummary.totalSessionCount} session earning entries`} />
            <MetricCard label="Demo Earnings" value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalDemoEarned))} sub={`${teacherEarningsSummary.totalDemoCount} demo earning entries`} />
            <MetricCard label="Average Session Payout" value={selectedMonthMetric(formatMoney(avgSessionPayout))} />
          </div>

          <Card className="border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Teacher earnings · selected month</h3>
                <p className="mt-1 text-xs text-muted-foreground">Based on attendance/demo earning rollups. Detailed data is intentionally kept out of Overview.</p>
              </div>
              <span className="text-xs text-muted-foreground">{monthError ? 'Unavailable' : `${visibleTeacherEarnings.length} teachers`}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={teacherEarningsTab === 'live' ? 'default' : 'outline'} onClick={() => setTeacherEarningsTab('live')}>
                Live ({liveTeacherEarnings.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={teacherEarningsTab === 'archived' ? 'default' : 'outline'}
                onClick={() => setTeacherEarningsTab('archived')}
                disabled={!coreAnalyticsReady}
              >
                Archived / Deleted ({coreAnalyticsReady ? archivedTeacherEarnings.length : '—'})
              </Button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="p-2">Teacher</th>
                    <th scope="col" className="p-2">Profile</th>
                    <th scope="col" className="p-2 text-right">Demo #</th>
                    <th scope="col" className="p-2 text-right">Demo ₹</th>
                    <th scope="col" className="p-2 text-right">Session #</th>
                    <th scope="col" className="p-2 text-right">Session ₹</th>
                    <th scope="col" className="p-2 text-right">Total ₹</th>
                    <th scope="col" className="p-2 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeacherEarnings.length === 0 ? (
                    <tr>
                      <td className="p-4 text-muted-foreground" colSpan={8}>
                        {monthLoading
                          ? 'Loading selected-month teacher earnings…'
                          : monthError
                            ? 'Selected-month teacher earnings are unavailable.'
                            : teacherEarningsTab === 'live'
                              ? 'No live teacher earnings for this month.'
                              : 'No archived/deleted teacher earnings for this month.'}
                      </td>
                    </tr>
                  ) : visibleTeacherEarnings.map((teacher) => (
                    <tr key={teacher.teacherId} className="border-t hover:bg-slate-50/70">
                      <td className="p-2 font-medium text-slate-950">{teacher.teacher}</td>
                      <td className="p-2">{teacher.profileTag}</td>
                      <td className="p-2 text-right tabular-nums">{teacher.demoCount || '—'}</td>
                      <td className="p-2 text-right tabular-nums">{teacher.demoEarned > 0 ? formatMoney(teacher.demoEarned) : '—'}</td>
                      <td className="p-2 text-right tabular-nums">{teacher.sessionCount || '—'}</td>
                      <td className="p-2 text-right tabular-nums">{teacher.sessionEarned > 0 ? formatMoney(teacher.sessionEarned) : '—'}</td>
                      <td className="p-2 text-right font-semibold tabular-nums">{formatMoney(teacher.totalEarned)}</td>
                      <td className="p-2 text-right tabular-nums">{formatMoney(teacher.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
