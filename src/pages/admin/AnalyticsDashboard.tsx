import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';

const monthKeyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

const MetricCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <Card className="p-4 shadow-sm">
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
  </Card>
);

export default function AnalyticsDashboard(): JSX.Element {
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teacherEarningsRollups, setTeacherEarningsRollups] = useState<Record<string, any>>({});
  const [fsError, setFsError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKeyFromDate(new Date()));

  useEffect(() => {
    const onErr = (err: any) => setFsError(err?.message || 'Some analytics data could not be loaded.');
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onErr
    );
    const unsubStudents = onSnapshot(
      collection(db, 'kids'),
      snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onErr
    );
    const unsubEnroll = onSnapshot(
      collection(db, 'enrollments'),
      snap => setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onErr
    );
    const unsubCourses = onSnapshot(
      collection(db, 'courses'),
      snap => setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      onErr
    );

    return () => {
      unsubUsers();
      unsubStudents();
      unsubEnroll();
      unsubCourses();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadTeacherRollups = async () => {
      const teachers = users.filter(u => u.roles?.includes('teacher'));
      if (!teachers.length || !selectedMonth) {
        if (!cancelled) setTeacherEarningsRollups({});
        return;
      }
      try {
        const snaps = await Promise.all(
          teachers.map(t => getDoc(doc(db, 'teachers', t.id, 'earnings', selectedMonth)))
        );
        const map: Record<string, any> = {};
        teachers.forEach((t, idx) => {
          const snap = snaps[idx];
          map[t.id] = snap.exists() ? snap.data() : null;
        });
        if (!cancelled) setTeacherEarningsRollups(map);
      } catch (err) {
        if (!cancelled) setTeacherEarningsRollups({});
      }
    };
    void loadTeacherRollups();
    return () => {
      cancelled = true;
    };
  }, [users, selectedMonth]);

  const revenueMonthlyQuery = useQuery({
    queryKey: ['adminStats', 'revenueMonthly', selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;
      const snap = await getDoc(
        doc(db, 'adminStats', 'revenueMonthly', 'months', selectedMonth)
      );
      return snap.exists() ? snap.data() : null;
    },
    enabled: Boolean(selectedMonth),
    staleTime: 1000 * 60 * 5,
  });

  const revenueMonthly = revenueMonthlyQuery.data || {};
  const expectedRevenue = Number(revenueMonthly.expected ?? 0) || 0;
  const earnedRevenue = Number(revenueMonthly.earned ?? 0) || 0;
  const completedSessionsMonth = Number(revenueMonthly.completedSessions ?? 0) || 0;
  const outstandingRevenue = expectedRevenue - earnedRevenue;

  const enrollmentBuckets = useMemo(() => {
    const activeLike = new Set([
      'trial',
      'active',
      'paused',
      'pending_teacher',
      'pending_payment',
      'enrolled',
      'current',
      'ongoing',
    ]);
    const past = new Set(['completed', 'discontinued', 'expired', 'cancelled', 'canceled']);
    const counts = { activeLike: 0, past: 0, other: 0 };

    enrollments.forEach((e) => {
      const status = String(e.status || '').trim().toLowerCase();
      if (activeLike.has(status)) counts.activeLike += 1;
      else if (past.has(status)) counts.past += 1;
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

  const kidNameById = useMemo(() => ({} as Record<string, string>), []);
  const courseNameById = useMemo(() => ({} as Record<string, string>), []);
  const recentEnrollments: any[] = [];

  const teacherEarnings = useMemo(() => {
    const teachers = users.filter(u => u.roles?.includes('teacher'));
    return teachers
      .map(t => {
        const rollup = teacherEarningsRollups[t.id] || {};
        const sessionsCount = Number(rollup.totalSessions ?? rollup.sessionsCompleted ?? 0) || 0;
        const totalEarned = Number(rollup.totalEarnings ?? 0) || 0;
        const pending = Number(rollup.pendingEarnings ?? 0) || 0;
        return {
          teacher: t.displayName || t.name || t.email || t.id,
          teacherId: t.id,
          sessions: sessionsCount,
          totalEarned,
          pending,
        };
      })
      .sort((a, b) => b.pending - a.pending || b.totalEarned - a.totalEarned)
      .slice(0, 8);
  }, [users, teacherEarningsRollups]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Admin Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Focused view of revenue and enrollment health for the selected month.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium">Month</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-[160px]"
          />
          <span
            className={
              revenueMonthlyQuery.isLoading
                ? 'text-xs text-muted-foreground px-2 py-1 rounded-full border'
                : revenueMonthlyQuery.data
                  ? 'text-xs text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 bg-emerald-50'
                  : 'text-xs text-amber-700 px-2 py-1 rounded-full border border-amber-200 bg-amber-50'
            }
          >
            {revenueMonthlyQuery.isLoading
              ? 'Loading…'
              : revenueMonthlyQuery.data
                ? 'Rollup loaded'
                : 'No rollup yet'}
          </span>
        </div>
      </div>

      {fsError && (
        <div className="text-xs text-amber-700 border border-amber-200 bg-amber-50 rounded px-3 py-2">
          {fsError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Expected (month)" value={formatMoney(expectedRevenue)} />
        <MetricCard label="Earned (month)" value={formatMoney(earnedRevenue)} />
        <MetricCard label="Outstanding" value={formatMoney(outstandingRevenue)} />
        <MetricCard label="Completed sessions" value={completedSessionsMonth} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Active-like enrollments" value={enrollmentBuckets.activeLike} />
        <MetricCard label="Past enrollments" value={enrollmentBuckets.past} />
        <MetricCard label="Other / unknown" value={enrollmentBuckets.other} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Teacher earnings (month)</h3>
              <p className="text-xs text-muted-foreground">Based on attendance rollups.</p>
            </div>
            <span className="text-xs text-muted-foreground">{teacherEarnings.length} teachers</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Teacher</th>
                  <th className="p-2">Sessions</th>
                  <th className="p-2">Earned</th>
                  <th className="p-2">Pending</th>
                </tr>
              </thead>
              <tbody>
                {teacherEarnings.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={4}>
                      No teacher earnings for this month.
                    </td>
                  </tr>
                ) : (
                  teacherEarnings.map((t) => (
                    <tr key={t.teacherId} className="border-b last:border-b-0">
                      <td className="p-2">{t.teacher}</td>
                      <td className="p-2">{t.sessions}</td>
                      <td className="p-2">{formatMoney(t.totalEarned)}</td>
                      <td className="p-2">{formatMoney(t.pending)}</td>
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
