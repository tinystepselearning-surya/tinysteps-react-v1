import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f97316', '#06b6d4', '#e11d48'];

export default function BetaAnalyticsDashboard() {
  const { user, isLoading } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const sessSnap = await getDocs(query(collection(db, 'ai-sessions'), orderBy('createdAt', 'desc')));
        const sess = [];
        sessSnap.forEach((d) => sess.push({ id: d.id, ...d.data() }));
        setSessions(sess);

        const fbSnap = await getDocs(query(collection(db, 'beta-feedback'), orderBy('timestamp', 'desc')));
        const fb = [];
        fbSnap.forEach((d) => fb.push({ id: d.id, ...d.data() }));
        setFeedback(fb);

        const errSnap = await getDocs(query(collection(db, 'ai-error-logs'), orderBy('timestamp', 'desc')));
        const errs = [];
        errSnap.forEach((d) => errs.push({ id: d.id, ...d.data() }));
        setErrors(errs);
      } catch (err) {
        // swallow errors in admin UI
      }
    };
    load();
  }, []);

  const metrics = useMemo(() => {
    const totalSessions = sessions.length;
    const avgDuration =
      sessions.reduce((sum, s) => sum + (s.durationMs || 0), 0) / (totalSessions || 1);
    const errorRate = (errors.length / Math.max(totalSessions, 1)) * 100;
    const kidRatings = feedback
      .filter((f) => f.role === 'kid' && typeof f.enjoyment === 'number')
      .map((f) => f.enjoyment);
    const teacherRatings = feedback
      .filter((f) => f.role === 'teacher' && typeof f.rating === 'number')
      .map((f) => f.rating);
    const avgKid = kidRatings.length ? kidRatings.reduce((a, b) => a + b, 0) / kidRatings.length : 0;
    const avgTeacher = teacherRatings.length
      ? teacherRatings.reduce((a, b) => a + b, 0) / teacherRatings.length
      : 0;

    return {
      totalSessions,
      avgDuration,
      errorRate,
      engagement: avgKid,
      teacherSatisfaction: avgTeacher,
    };
  }, [errors.length, feedback, sessions]);

  const sessionsPerDay = useMemo(() => {
    const count = {};
    sessions.forEach((s) => {
      const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
      const key = date.toISOString().slice(0, 10);
      count[key] = (count[key] || 0) + 1;
    });
    return Object.entries(count).map(([date, value]) => ({ date, value }));
  }, [sessions]);

  const featureUsage = useMemo(() => {
    const count = {};
    sessions.forEach((s) => {
      const feature = s.feature || 'unknown';
      count[feature] = (count[feature] || 0) + 1;
    });
    return Object.entries(count).map(([feature, value]) => ({ feature, value }));
  }, [sessions]);

  const errorTypes = useMemo(
    () =>
      errors.map((e, idx) => ({
        name: e.statusCode || 'unknown',
        value: 1,
        id: idx,
      })),
    [errors]
  );

  const feedbackThemes = useMemo(() => {
    return feedback.map((f) => ({
      id: f.id,
      role: f.role,
      overall: f.overall || f.comment || f.suggestions || '',
    }));
  }, [feedback]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Loading…</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-red-600">Access denied.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Admin</p>
            <h1 className="text-3xl font-bold text-gray-900">Beta Analytics</h1>
            <p className="text-sm text-gray-600">Week 4 internal beta (10 kids + 3 teachers)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard label="Total sessions" value={metrics.totalSessions} target="50+" />
          <MetricCard
            label="Avg response (ms)"
            value={metrics.avgDuration.toFixed(0)}
            target="<5000"
          />
          <MetricCard label="Error rate (%)" value={metrics.errorRate.toFixed(2)} target="<1%" />
          <MetricCard label="Kid engagement" value={metrics.engagement.toFixed(1)} target=">4.0" />
          <MetricCard
            label="Teacher satisfaction"
            value={metrics.teacherSatisfaction.toFixed(1)}
            target=">4.0"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Sessions per day">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={sessionsPerDay}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Feature usage">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={featureUsage}>
                <XAxis dataKey="feature" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Error types">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={errorTypes} dataKey="value" nameKey="name" fill="#8884d8" label>
                  {errorTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Feedback (last 10)">
            <div className="space-y-2 max-h-60 overflow-y-auto px-2">
              {feedbackThemes.slice(0, 10).map((f) => (
                <div key={f.id} className="p-2 rounded-lg border border-gray-100 bg-white">
                  <p className="text-xs uppercase text-gray-500">{f.role}</p>
                  <p className="text-sm text-gray-800">{f.overall || 'No comment'}</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Session logs</h3>
            <button
              onClick={() => exportCsv(sessions)}
              className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-2 py-1">Timestamp</th>
                  <th className="px-2 py-1">Student</th>
                  <th className="px-2 py-1">Feature</th>
                  <th className="px-2 py-1">Duration</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 50).map((s) => (
                  <tr key={s.id} className="border-t text-gray-800">
                    <td className="px-2 py-1">
                      {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : '—'}
                    </td>
                    <td className="px-2 py-1">{s.studentId || '—'}</td>
                    <td className="px-2 py-1">{s.feature || '—'}</td>
                    <td className="px-2 py-1">{s.durationMs || '—'} ms</td>
                    <td className="px-2 py-1">{s.status || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, target }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs uppercase text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">Target: {target}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function exportCsv(rows) {
  if (!rows || !rows.length) return;
  const headers = ['id', 'studentId', 'teacherId', 'feature', 'status', 'durationMs', 'createdAt'];
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v?.toDate) return `"${v.toDate().toISOString()}"`;
          return `"${(v ?? '').toString().replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'beta-sessions.csv';
  a.click();
  URL.revokeObjectURL(url);
}
