import React, { useEffect, useRef, useState } from 'react';
import { doc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocLogged } from '../../lib/firestoreReadLogging';
import { analyticsMonthKeyFromDate } from './analyticsV2Metrics';
import {
  BUSINESS_ANALYTICS_PATHS, BUSINESS_ANALYTICS_TTL_MS, BUSINESS_METRICS,
  formatBusinessMetric, parseBusinessCurrent, parseBusinessYear,
  type BusinessTab, type CurrentProjection, type YearProjection,
} from './monthlyBusinessAnalytics';

type CacheEntry = { loadedAt: number; value: unknown };
const source = 'src/pages/admin/MonthlyBusinessTrends.tsx';
const tabs: { id: BusinessTab; label: string }[] = [
  { id: 'leads', label: 'Leads' }, { id: 'payments', label: 'Payments' },
  { id: 'enrollments', label: 'Enrollments' },
];
const monthName = (month: string) => new Intl.DateTimeFormat('en-IN', { month: 'long', timeZone: 'UTC' }).format(new Date(month + '-01T00:00:00Z'));
const showTime = (value?: string) => value ? new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
}).format(new Date(value)) : 'Not available';
const count = (value: number | null | undefined) => value == null ? 'Not available' : new Intl.NumberFormat('en-IN').format(value);

export default function MonthlyBusinessTrends({ active }: { active: boolean }): JSX.Element | null {
  const thisYear = analyticsMonthKeyFromDate(new Date()).slice(0, 4);
  const [year, setYear] = useState(thisYear);
  const [tab, setTab] = useState<BusinessTab>('leads');
  const [annual, setAnnual] = useState<YearProjection | null>(null);
  const [current, setCurrent] = useState<CurrentProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const cache = useRef(new Map<string, CacheEntry>());
  const inFlight = useRef(new Map<string, Promise<unknown>>());

  useEffect(() => {
    if (!active) return;
    let live = true;
    const load = (key: string, path: readonly [string, string, string, string]) => {
      const hit = cache.current.get(key);
      if (hit && Date.now() - hit.loadedAt < BUSINESS_ANALYTICS_TTL_MS) return Promise.resolve(hit.value);
      const existing = inFlight.current.get(key);
      if (existing) return existing;
      setAttempts((n) => n + 1);
      const promise = getDocLogged('MonthlyBusinessTrends:' + key, doc(db, path[0], ...path.slice(1)), { source })
        .then((snap) => {
          const value = snap.exists() ? snap.data() : null;
          cache.current.set(key, { loadedAt: Date.now(), value });
          return value;
        }).finally(() => inFlight.current.delete(key));
      inFlight.current.set(key, promise);
      return promise;
    };
    setLoading(true);
    setError(false);
    setAnnual(null);
    setCurrent(null);
    void Promise.allSettled([
      load('year:' + year, BUSINESS_ANALYTICS_PATHS.year(year)),
      load('current', BUSINESS_ANALYTICS_PATHS.current),
    ]).then(([history, snapshot]) => {
      if (!live) return;
      setAnnual(history.status === 'fulfilled' ? parseBusinessYear(history.value, year) : null);
      setCurrent(snapshot.status === 'fulfilled' ? parseBusinessCurrent(snapshot.value) : null);
      setError(history.status === 'rejected' || snapshot.status === 'rejected');
      setLoading(false);
    });
    return () => { live = false; };
  }, [active, year, nonce]);

  if (!active) return null;
  const months = Array.from({ length: 12 }, (_, i) => year + '-' + String(i + 1).padStart(2, '0'));
  const rows = months.map((monthKey) => ({ monthKey, metrics: annual?.year === year ? annual.months.find((m) => m.monthKey === monthKey)?.metrics : undefined }));
  const columns = BUSINESS_METRICS[tab];
  const chartKey = tab === 'enrollments' ? 'newAdmissions' : tab === 'payments' ? 'billedPaise' : 'leadEnquiries';
  const max = Math.max(1, ...rows.map((row) => row.metrics?.[chartKey] ?? 0));
  const refresh = () => {
    cache.current.delete('year:' + year);
    cache.current.delete('current');
    setNonce((n) => n + 1);
  };
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Monthly business trends">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-lg font-semibold">Monthly business trends</h3>
          <p className="text-sm text-slate-600">Calendar months (IST). Enquiries received, class charges billed and enrollment movement.</p></div>
        <div className="flex items-center gap-2">
          <label htmlFor="business-trends-year">Year</label>
          <select id="business-trends-year" className="rounded border p-2" value={year} onChange={(e) => setYear(e.target.value)}>
            {Array.from({ length: 15 }, (_, i) => String(Number(thisYear) - i)).map((y) => <option key={y}>{y}</option>)}
          </select>
          <button className="rounded border px-3 py-2" disabled={loading} onClick={refresh}>Refresh trends</button>
        </div>
      </div>
      <nav aria-label="Monthly trend sections" className="flex flex-wrap gap-2">
        {tabs.map((t) => <button key={t.id} type="button" aria-pressed={tab === t.id} className={'rounded px-3 py-2 text-sm ' + (tab === t.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700')} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </nav>
      {loading && <p role="status">Loading aggregate documents…</p>}
      {error && <p role="alert" className="text-amber-800">An aggregate could not be fetched. Refresh to retry; no raw-data fallback is used.</p>}
      {!loading && !annual && <p role="status" className="text-amber-800">Verified historical analytics are not available for this year.</p>}
      {annual?.availableRecords && <p className="text-xs text-slate-600">Historical totals use available recorded dates. {annual.undatedRecords > 0 ? 'Some source records have missing dates or unresolved details and cannot be assigned reliably.' : 'No unresolved details were flagged in the supplied records.'}</p>}
      {tab === 'enrollments' && current?.availableRecords && current.unresolvedRecords > 0 && <p className="text-xs text-slate-600">Current totals exclude records with unresolved identity or status.</p>}
      {tab === 'enrollments' && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['Active students', current?.activeStudents], ['Active enrollments', current?.activeEnrollments], ['Paused students', current?.pausedStudents], ['Retained students', current?.retainedStudents]] as const).map(([label, value]) =>
          <div key={label} className="rounded-lg border p-3"><p className="text-xs text-slate-600">{label}</p><p className="text-xl font-semibold">{count(value)}</p></div>)}
      </div>}
      <div aria-label="Monthly trend chart" className="space-y-1">
        <h4 className="text-sm font-semibold">{BUSINESS_METRICS[tab].find(([key]) => key === chartKey)?.[1]}</h4>
        {rows.map(({monthKey, metrics}) => {
          const value = metrics?.[chartKey];
          return <div key={monthKey} className="grid grid-cols-[3rem_1fr_auto] items-center gap-2 text-xs">
            <span>{monthName(monthKey).slice(0, 3)}</span>
            <div className="h-3 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-slate-700" style={{width: (value == null ? 0 : value / max * 100) + '%'}} /></div>
            <span>{formatBusinessMetric(chartKey, value)}</span>
          </div>;
        })}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead><tr><th className="p-2">Month</th>{columns.map(([key, label]) => <th key={key} className="p-2 whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>{rows.map(({monthKey, metrics}) => <tr key={monthKey} className="border-t"><th scope="row" className="p-2">{monthName(monthKey)}</th>{columns.map(([key]) => <td key={key} className="p-2 whitespace-nowrap">{formatBusinessMetric(key, metrics?.[key])}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 border-t pt-3">
        <span>Aggregate document fetch attempts this page session: {attempts}</span>
        <span>Operational query calls from this panel: 0</span>
        <span>Historical projection updated: {showTime(annual?.updatedAt)}</span>
        <span>Current projection updated: {showTime(current?.updatedAt)}</span>
        <span>Cache: up to 5 minutes. Fetch attempts are not billed-read totals.</span>
      </div>
    </section>
  );
}
