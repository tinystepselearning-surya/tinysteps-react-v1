import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebaseConfig';

const functionsClient = getFunctions(app, 'us-central1');
const generateWeeklyClassReport = httpsCallable(functionsClient, 'generateWeeklyClassReport');

export default function WeeklyClassReport({ classId, weekEndDate }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!classId) return;
      setLoading(true);
      setError('');
      try {
        const resp = await generateWeeklyClassReport({ classId, weekEndDate });
        setReport(resp?.data || null);
      } catch (err) {
        setError(err?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [classId, weekEndDate]);

  const printReport = () => window.print();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-indigo-600 font-semibold">Weekly Class Report</p>
          <h2 className="text-xl font-bold text-gray-900">Week ending {weekEndDate || 'this week'}</h2>
        </div>
        <button
          onClick={printReport}
          className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition"
        >
          Print / Export
        </button>
      </div>
      {loading && <p className="text-sm text-gray-500">Generating report…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && report && (
        <>
          <p className="text-sm text-gray-800">{report.summary}</p>
          <Section title="Highlights" items={report.highlights} />
          <Section title="Concerns" items={report.concerns} />
          <Section title="Next week suggestions" items={report.nextWeekSuggestions} />
        </>
      )}
    </div>
  );
}

function Section({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <ul className="list-disc pl-4 text-sm text-gray-800 space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
