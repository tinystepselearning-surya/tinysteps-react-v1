// src/components/teacher/EarningsSummary.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebaseConfig';

interface TeacherEarnings {
  teacherId: string;
  month: string; // "YYYY-MM"
  sessionsCompleted?: number;
  creditsEarned?: number;
  updatedAt?: any;
  lastSessionId?: string;
  lastCourseId?: string;
}

interface MonthOption {
  id: string;    // "2025-11"
  label: string; // "Nov 2025"
}

interface EarningsSummaryProps {
  teacherId?: string | null;
}

// Helpers
function getCurrentMonthId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function buildMonthOptions(monthsBack: number): MonthOption[] {
  const result: MonthOption[] = [];
  const now = new Date();

  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const id = `${year}-${month}`;
    const label = d.toLocaleString('en-US', {
      month: 'short',
      year: 'numeric',
    });
    result.push({ id, label });
  }

  return result;
}

const PER_CREDIT_RATE = 150; // ₹ per credit – change whenever you decide

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ teacherId: propTeacherId }) => {
  const auth = getAuth();

  // Prefer prop from TeacherDashboard, fall back to logged-in user
  const teacherId = propTeacherId ?? auth.currentUser?.uid ?? null;

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthId());
  const [earnings, setEarnings] = useState<TeacherEarnings | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(() => buildMonthOptions(6), []);

  useEffect(() => {
    if (!teacherId) {
      setEarnings(null);
      setError('Teacher ID not available. Please sign in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = doc(db, 'teachers', teacherId, 'earnings', selectedMonth);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setEarnings(null);
        } else {
          const data = snap.data() as TeacherEarnings;
          setEarnings({
            teacherId: data.teacherId ?? teacherId,
            month: data.month ?? selectedMonth,
            sessionsCompleted: data.sessionsCompleted ?? 0,
            creditsEarned: data.creditsEarned ?? 0,
            updatedAt: data.updatedAt,
            lastSessionId: data.lastSessionId,
            lastCourseId: data.lastCourseId,
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error loading teacher earnings:', err);
        setError('Failed to load earnings. Please try again.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [teacherId, selectedMonth]);

  const sessionsCompleted = earnings?.sessionsCompleted ?? 0;
  const creditsEarned = earnings?.creditsEarned ?? 0;
  const approxPayout = creditsEarned * PER_CREDIT_RATE;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Earnings Summary</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Monthly Earnings</CardTitle>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Month</span>
            <select
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <p className="text-sm text-slate-500">Loading earnings…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && !earnings && (
            <p className="text-sm text-slate-500">
              No earnings recorded for this month yet.
            </p>
          )}

          {!loading && !error && earnings && (
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Sessions Completed
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-800">
                  {sessionsCompleted}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Credits Earned
                </p>
                <p className="mt-1 text-xl font-semibold text-slate-800">
                  {creditsEarned}
                </p>
              </div>

              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-700">
                  Approx Payout
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-800">
                  ₹ {approxPayout.toLocaleString('en-IN')}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-700/80">
                  ({creditsEarned} × ₹{PER_CREDIT_RATE} per credit)
                </p>
              </div>
            </div>
          )}

          {!loading && earnings?.updatedAt && (
            <p className="mt-4 text-[11px] text-slate-400">
              Last updated:{' '}
              {earnings.updatedAt.toDate
                ? earnings.updatedAt.toDate().toLocaleString()
                : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsSummary;
