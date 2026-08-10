import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import LeadSourceAnalysis from './LeadSourceAnalysis';

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

const formatMoney = (value: any) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹0';
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

const formatDate = (value: any) => {
  if (!value) return '—';
  if (typeof value?.toDate === 'function') {
    return value.toDate().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? parsed.toISOString().slice(0, 10)
    : '—';
};

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
  // TODO: Confirm whether pending_payment enrollments should be included in projected revenue.
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') {
    return 'active';
  }
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
  if (!source) return true; // Legacy rows where source was not populated.
  return SCHEDULE_SESSION_SOURCES.has(source);
};

const MetricCard = ({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string | number;
  sub?: string;
  valueClassName?: string;
}) => (
  <Card className="p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`mt-2 text-xl font-semibold leading-tight text-foreground md:text-2xl ${valueClassName || ''}`}>
      {value}
    </div>
    {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
  </Card>
);

export default function AnalyticsDashboard(): JSX.Element {
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
            source: 'src/pages/admin/AnalyticsDashboard.tsx',
          }),
          getDocsLogged('AnalyticsDashboard:all-enrollments', query(collection(db, 'enrollments')), {
            source: 'src/pages/admin/AnalyticsDashboard.tsx',
          }),
          getDocsLogged('AnalyticsDashboard:all-courses', query(collection(db, 'courses')), {
            source: 'src/pages/admin/AnalyticsDashboard.tsx',
          }),
        ]);
        if (!active) return;
        setCoreError(null);
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setEnrollments(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
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
      return;
    }

    let active = true;

    // Clear the previous month's values before starting a new request. Without this,
    // July values can remain visible under an August label while August is loading or
    // indefinitely if the August query fails.
    setCharges([]);
    setPayments([]);
    setClassSessions([]);
    setTeacherEarningsEntries([]);
    setMonthError(null);
    setMonthLoading(true);

    const loadMonthData = async () => {
      try {
        const [chargesSnap, paymentsSnap, teacherEarningsSnap, classSessionsSnap] =
          await Promise.all([
            getDocsLogged(
              'AnalyticsDashboard:month-billing-charges',
              query(collection(db, 'billingCharges'), where('monthKey', '==', selectedMonth)),
              { source: 'src/pages/admin/AnalyticsDashboard.tsx' },
            ),
            getDocsLogged(
              'AnalyticsDashboard:month-payments',
              query(collection(db, 'payments'), where('monthKey', '==', selectedMonth)),
              { source: 'src/pages/admin/AnalyticsDashboard.tsx' },
            ),
            getDocsLogged(
              'AnalyticsDashboard:month-teacher-earnings',
              query(collection(db, 'teacherEarnings'), where('monthKey', '==', selectedMonth)),
              { source: 'src/pages/admin/AnalyticsDashboard.tsx' },
            ),
            getDocsLogged(
              'AnalyticsDashboard:month-class-sessions',
              query(
                collection(db, 'classSessions'),
                where('date', '>=', monthRange.startYmd),
                where('date', '<=', monthRange.endYmd)
              ),
              { source: 'src/pages/admin/AnalyticsDashboard.tsx' },
            ),
          ]);
        if (!active) return;
        setMonthError(null);
        setCharges(
          chargesSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((charge) => charge.archived !== true)
        );
        setPayments(
          paymentsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((payment) => payment.archived !== true)
        );
        setTeacherEarningsEntries(
          teacherEarningsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .filter((entry) => entry.archived !== true)
        );
        setClassSessions(
          classSessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (err: any) {
        if (!active) return;
        setCharges([]);
        setPayments([]);
        setClassSessions([]);
        setTeacherEarningsEntries([]);
        setMonthError(err?.message || 'Selected-month analytics data could not be loaded.');
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
        if (!courseById.has(key)) {
          courseById.set(key, course);
        }
      });
    });

    classSessions.forEach((session) => {
      if (!isPlannedScheduleSession(session)) return;

      const enrollmentId = String(session?.enrollmentId || '').trim();
      if (!enrollmentId) return;

      const enrollment = enrollmentById.get(enrollmentId);
      if (!enrollment || !isEnrollmentProjectable(enrollment)) return;

      plannedSessions += 1;
      if (UPCOMING_SESSION_STATUSES.has(normalizeStatus(session?.status))) {
        remainingScheduledSessions += 1;
      }
      enrollmentIds.add(enrollmentId);

      const course = courseById.get(String(session?.courseId || enrollment?.courseId || '').trim());
      const feePerSession = resolvePositiveNumber(
        session?.feeAmount,
        session?.feePerClass,
        enrollment?.feePerClass,
        enrollment?.ratePerSession,
        course?.feePerClass,
        course?.ratePerSession
      );

      if (feePerSession > 0) {
        projectedRevenue += feePerSession;
      } else {
        missingFeeSessions += 1;
      }
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

    enrollments.forEach((e) => {
      const status = normalizeEnrollmentStatus(e);
      if (ACTIVE_LIKE_ENROLLMENT_STATUSES.has(status)) counts.activeLike += 1;
      else if (LEGACY_PAST_ENROLLMENT_STATUSES.has(status)) counts.past += 1;
      else counts.other += 1;
    });

    return counts;
  }, [enrollments]);

  const nameById = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach((u) => {
      map[u.id] = u.displayName || u.name || u.email || u.id;
    });
    return map;
  }, [users]);

  const teacherProfileById = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        role: string;
        status: string;
      }
    > = {};
    users.forEach((u) => {
      map[u.id] = {
        name: u.displayName || u.name || u.email || u.id,
        role: normalizeStatus(u.role),
        status: normalizeStatus(u.status || 'active'),
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
  }, [
    teacherEarningsEntries,
    nameById,
    teacherProfileById,
    coreAnalyticsEnabled,
    coreLoading,
    coreError,
  ]);

  const liveTeacherEarnings = useMemo(
    () =>
      teacherEarnings.filter(
        (row) => row.profileTag === 'Live' || row.profileTag === 'Profile not loaded'
      ),
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

    teacherEarnings.forEach((t) => {
      totalDemoEarned += t.demoEarned;
      totalSessionEarned += t.sessionEarned;
      totalDemoCount += t.demoCount;
      totalSessionCount += t.sessionCount;
    });

    return {
      totalDemoEarned,
      totalSessionEarned,
      totalDemoCount,
      totalSessionCount,
      totalCombinedEarned: totalDemoEarned + totalSessionEarned,
    };
  }, [teacherEarnings]);

  const avgSessionPayout =
    teacherEarningsSummary.totalSessionCount > 0
      ? teacherEarningsSummary.totalSessionEarned / teacherEarningsSummary.totalSessionCount
      : 0;
  const projectedTeacherPayout = plannedProjection.plannedSessions * avgSessionPayout;
  const sessionNetEarningsMonth =
    revenueTotals.sessionChargesTotal - teacherEarningsSummary.totalSessionEarned;
  const coreAnalyticsReady = coreAnalyticsEnabled && !coreLoading && !coreError;
  const monthAnalyticsReady = !monthLoading && !monthError;
  const selectedMonthMetric = (value: string | number): string | number =>
    monthLoading ? '…' : monthError ? '—' : value;
  const selectedMonthSub = (availableCopy: string): string =>
    monthError ? 'Unavailable' : availableCopy;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Admin Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Revenue, enrollment health, and website lead acquisition performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={coreAnalyticsEnabled ? 'outline' : 'default'}
            disabled={coreLoading}
            onClick={() => {
              if (coreAnalyticsEnabled) {
                setCoreRefreshKey((prev) => prev + 1);
                return;
              }
              setCoreAnalyticsEnabled(true);
            }}
          >
            {coreLoading
              ? 'Loading core analytics…'
              : coreAnalyticsEnabled
                ? 'Refresh core analytics'
                : 'Load core analytics'}
          </Button>
          <label className="text-sm font-medium">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[160px]"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={monthLoading}
            onClick={() => setMonthRefreshKey((prev) => prev + 1)}
          >
            {monthLoading ? 'Loading…' : 'Refresh'}
          </Button>
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-full border">
            {coreAnalyticsEnabled
              ? coreLoading
                ? 'Core analytics loading'
                : 'Core analytics loaded on demand'
              : 'Heavy core analytics are paused until loaded manually'}
          </span>
        </div>
      </div>

      {monthLoading && (
        <div className="text-xs text-muted-foreground border rounded px-3 py-2">
          Loading analytics for {selectedMonth}. Previous month values have been cleared to avoid stale reporting.
        </div>
      )}

      {monthError && (
        <div className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded px-3 py-2">
          Month analytics: {monthError}
        </div>
      )}

      {coreError && (
        <div className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded px-3 py-2">
          Core analytics: {coreError}
        </div>
      )}

      <LeadSourceAnalysis />

      {!coreAnalyticsEnabled && (
        <Card className="p-4 text-sm text-muted-foreground">
          Users, enrollments, and courses stay unloaded until you click `Load core analytics`.
          Projection and enrollment-health cards show — until that data is loaded.
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Billed Revenue (Month)"
          value={selectedMonthMetric(formatMoney(expectedRevenue))}
          sub={selectedMonthSub('Current billed charges for the selected month (non-void only)')}
        />
        <MetricCard
          label="Collected Payments (Month)"
          value={selectedMonthMetric(formatMoney(earnedRevenue))}
          sub={selectedMonthSub('Payments applied/recorded for the selected month')}
        />
        <MetricCard
          label="Balance Due"
          value={selectedMonthMetric(formatMoney(balanceDueRevenue))}
          sub={selectedMonthSub('Billed revenue minus collected payments')}
        />
        <MetricCard
          label="Completed sessions (billed)"
          value={selectedMonthMetric(completedSessionsMonth)}
          sub={monthError ? 'Unavailable' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Scheduled Sessions in Month"
          value={!monthAnalyticsReady || !coreAnalyticsReady ? '—' : plannedProjection.plannedSessions}
          sub={
            monthError
              ? 'Unavailable'
              : !coreAnalyticsReady
              ? 'Load core analytics to calculate enrollment-linked scheduled sessions'
              : 'Completed + upcoming scheduled sessions for the selected month'
          }
        />
        <MetricCard
          label="Remaining Scheduled Sessions"
          value={!monthAnalyticsReady || !coreAnalyticsReady ? '—' : plannedProjection.remainingScheduledSessions}
          sub={
            monthError
              ? 'Unavailable'
              : !coreAnalyticsReady
              ? 'Load core analytics to calculate remaining enrollment-linked sessions'
              : 'Upcoming sessions yet to be completed'
          }
        />
        <MetricCard
          label="Full-Month Scheduled Revenue"
          value={!monthAnalyticsReady || !coreAnalyticsReady ? '—' : formatMoney(plannedProjection.projectedRevenue)}
          valueClassName="whitespace-nowrap text-lg md:text-xl"
          sub={
            monthError
              ? 'Unavailable'
              : !coreAnalyticsReady
              ? 'Load core analytics to calculate course/enrollment fee projections'
              : plannedProjection.missingFeeSessions > 0
                ? `Revenue estimate from all scheduled sessions in the selected month. Avg/session ${formatMoney(plannedProjection.avgProjectedRevenuePerSession)} • ${plannedProjection.missingFeeSessions} sessions missing fee config`
                : `Revenue estimate from all scheduled sessions in the selected month. Avg/session ${formatMoney(plannedProjection.avgProjectedRevenuePerSession)}`
          }
        />
        <MetricCard
          label="Projected teacher payout (planned)"
          value={!monthAnalyticsReady || !coreAnalyticsReady ? '—' : formatMoney(projectedTeacherPayout)}
          sub={
            monthError
              ? 'Unavailable'
              : !coreAnalyticsReady
              ? 'Load core analytics to calculate the planned payout projection'
              : `Avg payout/session ${formatMoney(avgSessionPayout)}`
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Active-like enrollments"
          value={!coreAnalyticsReady ? '—' : enrollmentBuckets.activeLike}
        />
        <MetricCard
          label="Past enrollments"
          value={!coreAnalyticsReady ? '—' : enrollmentBuckets.past}
        />
        <MetricCard
          label="Other / unknown"
          value={!coreAnalyticsReady ? '—' : enrollmentBuckets.other}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Demo earnings (month)"
          value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalDemoEarned))}
          sub={selectedMonthSub(`${teacherEarningsSummary.totalDemoCount} demos completed/enrolled`)}
        />
        <MetricCard
          label="Session Net Revenue (Month)"
          value={selectedMonthMetric(formatMoney(sessionNetEarningsMonth))}
          sub={selectedMonthSub('Session charges minus teacher payout')}
        />
        <MetricCard
          label="Total teacher payout"
          value={selectedMonthMetric(formatMoney(teacherEarningsSummary.totalCombinedEarned))}
          sub={selectedMonthSub('Combined exposure')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Teacher earnings (month)</h3>
              <p className="text-xs text-muted-foreground">
                Based on attendance rollups.
                {!coreAnalyticsReady ? ' Teacher profile classification loads with core analytics.' : ''}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {monthError ? 'Unavailable' : `${visibleTeacherEarnings.length} teachers`}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={teacherEarningsTab === 'live' ? 'default' : 'outline'}
              onClick={() => setTeacherEarningsTab('live')}
            >
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
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Teacher</th>
                  <th className="p-2">Profile</th>
                  <th className="p-2 text-right">Demo #</th>
                  <th className="p-2 text-right">Demo ₹</th>
                  <th className="p-2 text-right">Session #</th>
                  <th className="p-2 text-right">Session ₹</th>
                  <th className="p-2 text-right">Total ₹</th>
                  <th className="p-2 text-right">Pending</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeacherEarnings.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={8}>
                      {monthLoading
                        ? 'Loading selected-month teacher earnings…'
                        : monthError
                          ? 'Selected-month teacher earnings are unavailable.'
                        : teacherEarningsTab === 'live'
                          ? 'No live teacher earnings for this month.'
                          : 'No archived/deleted teacher earnings for this month.'}
                    </td>
                  </tr>
                ) : (
                  visibleTeacherEarnings.map((t) => (
                    <tr key={t.teacherId} className="border-b last:border-b-0">
                      <td className="p-2">{t.teacher}</td>
                      <td className="p-2">{t.profileTag}</td>
                      <td className="p-2 text-right">{t.demoCount || '—'}</td>
                      <td className="p-2 text-right">{t.demoEarned > 0 ? formatMoney(t.demoEarned) : '—'}</td>
                      <td className="p-2 text-right">{t.sessionCount || '—'}</td>
                      <td className="p-2 text-right">{t.sessionEarned > 0 ? formatMoney(t.sessionEarned) : '—'}</td>
                      <td className="p-2 text-right font-medium">{formatMoney(t.totalEarned)}</td>
                      <td className="p-2 text-right">{formatMoney(t.pending)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
