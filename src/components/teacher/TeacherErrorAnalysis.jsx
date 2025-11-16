import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebaseConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const functionsClient = getFunctions(app, 'us-central1');
const analyzeStudentErrors = httpsCallable(functionsClient, 'analyzeStudentErrors');
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#06b6d4', '#ef4444'];

export default function TeacherErrorAnalysis({ classId }) {
  const [data, setData] = useState({ commonErrors: [], atRiskStudents: [], suggestions: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!classId) return;
      setLoading(true);
      setError('');
      try {
        const resp = await analyzeStudentErrors({ classId, dateRange: 7 });
        setData(resp?.data || { commonErrors: [], atRiskStudents: [], suggestions: [] });
      } catch (err) {
        setError(err?.message || 'Failed to load analysis.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId]);

  const chartData = data.commonErrors.map((c, idx) => ({
    name: c.name || `Error ${idx + 1}`,
    value: c.count || 0,
  }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Teacher Tools</p>
          <h2 className="text-xl font-bold text-gray-900">Error Analysis</h2>
        </div>
        <span className="text-xs text-gray-500">Last 7 days</span>
      </div>
      {loading && <p className="text-sm text-gray-500">Analyzing…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {chartData.length === 0 ? (
        <p className="text-sm text-gray-500">No errors found.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={80} label>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">At-risk students</h3>
        {data.atRiskStudents.length === 0 ? (
          <p className="text-sm text-gray-500">None flagged.</p>
        ) : (
          <ul className="text-sm text-gray-800 space-y-1">
            {data.atRiskStudents.map((s) => (
              <li key={s.studentId}>
                {s.studentId} — {s.accuracy}% accuracy
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Suggested strategies</h3>
        {data.suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">No suggestions yet.</p>
        ) : (
          <ul className="list-disc pl-4 text-sm text-gray-800 space-y-1">
            {data.suggestions.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
