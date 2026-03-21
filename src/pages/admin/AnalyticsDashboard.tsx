import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { Card } from '@components/ui/card';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';

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
  if (raw === 'pending_payment' || raw === 'pending_lp' || raw === 'pending_lp_assignment') {
    return 'active';
  }
  if (raw === 'enrolled' || raw === 'current' || raw === 'ongoing') return 'active';
  if (raw === 'canceled') return 'cancelled';
  if (raw === 'inactive') return 'archived';
  return raw;
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
  const [charges, setCharges] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [teacherEarningsEntries, setTeacherEarningsEntries] = useState<any[]>([]);
  const [fsError, setFsError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => monthKeyFromDate(new Date()));
  const [teacherEarningsTab, setTeacherEarningsTab] = useState<'live' | 'archived'>('live');

  useEffect(() => {
    let active = true;
    const loadCore = async () => {
      try {
        const [usersSnap, studentsSnap, enrollSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'kids')),
          getDocs(collection(db, 'enrollments')),
          getDocs(collection(db, 'courses')),
        ]);
        if (!active) return;
        setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setEnrollments(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setCourses(coursesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        if (active) {
          setFsError(err?.message || 'Some analytics data could not be loaded.');
        }
      }
    };
    void loadCore();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      setCharges([]);
      setPayments([]);
      setTeacherEarningsEntries([]);
      return;
    }
    const chargesQuery = query(
      collection(db, 'billingCharges'),
      where('monthKey', '==', selectedMonth)
    );
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('monthKey', '==', selectedMonth)
    );
    const teacherEarningsQuery = query(
      collection(db, 'teacherEarnings'),
      where('monthKey', '==', selectedMonth)
    );
    const unsubCharges = onSnapshot(
      chargesQuery,
      (snap) => setCharges(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setFsError(err?.message || 'Some analytics data could not be loaded.')
    );
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snap) => setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setFsError(err?.message || 'Some analytics data could not be loaded.')
    );
    const unsubTeacherEarnings = onSnapshot(
      teacherEarningsQuery,
      (snap) =>
        setTeacherEarningsEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => setFsError(err?.message || 'Some analytics data could not be loaded.')
    );
    return () => {
      unsubCharges();
      unsubPayments();
      unsubTeacherEarnings();
    };
  }, [selectedMonth]);

  const revenueTotals = useMemo(() => {
    let chargesTotal = 0;
    let dueTotal = 0;
    let appliedTotal = 0;
    let unappliedTotal = 0;
    let chargesCount = 0;

    charges.forEach((charge) => {
      const status = String(charge.status || '').toLowerCase();
      if (status === 'void') return;
      const amountRaw = Number(charge.amount ?? 0);
      const amount = Number.isFinite(amountRaw) ? amountRaw : 0;
      if (amount <= 0) return;
      chargesTotal += amount;
      chargesCount += 1;

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
    };
  }, [charges, payments]);

  const expectedRevenue = revenueTotals.chargesTotal;
  const earnedRevenue = revenueTotals.appliedTotal;
  const outstandingRevenue = revenueTotals.dueTotal;
  const completedSessionsMonth = revenueTotals.chargesCount;

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
    const past = new Set([
      'completed',
      'discontinued',
      'expired',
      'cancelled',
      'canceled',
      'archived',
    ]);
    const counts = { activeLike: 0, past: 0, other: 0 };

    enrollments.forEach((e) => {
      const status = normalizeEnrollmentStatus(e);
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

  const kidNameById = useMemo(() => ({} as Record<string, string>), []);
  const courseNameById = useMemo(() => ({} as Record<string, string>), []);
  const recentEnrollments: any[] = [];

  const teacherEarnings = useMemo(() => {
    const byTeacher = new Map<
      string,
      { teacherId: string; sessions: number; totalEarned: number; pending: number }
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
          sessions: 0,
          totalEarned: 0,
          pending: 0,
        });
      }
      const bucket = byTeacher.get(teacherId)!;
      bucket.totalEarned += amount;
      bucket.pending += pending;
      if (isSessionEarning(entry)) {
        bucket.sessions += 1;
      }
    });

    return Array.from(byTeacher.values())
      .map((row) => ({
        teacher: nameById[row.teacherId] || row.teacherId,
        teacherId: row.teacherId,
        sessions: row.sessions,
        totalEarned: row.totalEarned,
        pending: row.pending,
        profileTag: (() => {
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
  }, [teacherEarningsEntries, nameById, teacherProfileById]);

  const liveTeacherEarnings = useMemo(
    () => teacherEarnings.filter((row) => row.profileTag === 'Live'),
    [teacherEarnings],
  );

  const archivedTeacherEarnings = useMemo(
    () => teacherEarnings.filter((row) => row.profileTag !== 'Live'),
    [teacherEarnings],
  );

  const visibleTeacherEarnings = teacherEarningsTab === 'live' ? liveTeacherEarnings : archivedTeacherEarnings;

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
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-full border">
            Live from billing
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
            <span className="text-xs text-muted-foreground">{visibleTeacherEarnings.length} teachers</span>
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
            >
              Archived / Deleted ({archivedTeacherEarnings.length})
            </Button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Teacher</th>
                  <th className="p-2">Profile</th>
                  <th className="p-2">Sessions</th>
                  <th className="p-2">Earned</th>
                  <th className="p-2">Pending</th>
                </tr>
              </thead>
              <tbody>
                {visibleTeacherEarnings.length === 0 ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
                      {teacherEarningsTab === 'live'
                        ? 'No live teacher earnings for this month.'
                        : 'No archived/deleted teacher earnings for this month.'}
                    </td>
                  </tr>
                ) : (
                  visibleTeacherEarnings.map((t) => (
                    <tr key={t.teacherId} className="border-b last:border-b-0">
                      <td className="p-2">{t.teacher}</td>
                      <td className="p-2">{t.profileTag}</td>
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
