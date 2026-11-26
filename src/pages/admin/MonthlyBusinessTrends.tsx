import React, { useEffect, useId, useRef, useState } from 'react';
import { Activity, BarChart3, CalendarDays, ChevronDown, CircleHelp, Clock3, IndianRupee, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { doc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { getDocLogged } from '../../lib/firestoreReadLogging';
import { analyticsMonthKeyFromDate } from './analyticsV2Metrics';
import {
  BUSINESS_ANALYTICS_PATHS, BUSINESS_ANALYTICS_TTL_MS, BUSINESS_METRICS,
  formatBusinessMetric, parseBusinessCurrent, parseBusinessYear, businessSnapshotDay, businessTrendSummary, monthlyActiveEnrollmentRows,
  type BusinessMetric, type BusinessTab, type CurrentProjection, type YearProjection,
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
const showDay = (value: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
const count = (value: number | null | undefined) => value == null ? '—' : new Intl.NumberFormat('en-IN').format(value);


const palette = {
  leads: { color: '#4f46e5', light: '#c7d2fe', icon: TrendingUp, label: 'Enquiry momentum', subtitle: 'Recorded submissions by month' },
  payments: { color: '#047857', light: '#a7f3d0', icon: IndianRupee, label: 'Monthly billing', subtitle: 'Class charges by service month · not cash collected' },
  enrollments: { color: '#7c3aed', light: '#ddd6fe', icon: Users, label: 'Admissions & student exits', subtitle: 'New students and exits from their last retained course' },
};
const display = (key: BusinessMetric, value: number | null | undefined) => value == null ? '—' : key === 'billedPaise'
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value / 100) : count(value);
const shortMoney = (paise: number) => paise >= 10000000 ? '₹' + (paise / 10000000).toFixed(1).replace(/\.0$/, '') + 'L' : paise >= 100000 ? '₹' + (paise / 100000).toFixed(0) + 'k' : '₹' + Math.round(paise / 100);
const period = (key: string | undefined) => key ? monthName(key) : 'Not available';
function Kpi({ label, value, detail, color }: { label: string; value: string; detail: string; color: string }) {
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600"><span>{label}</span><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" /></div>
    <p className="mt-3 break-words text-2xl font-bold tracking-tight tabular-nums text-slate-950 sm:text-3xl">{value}</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-500">{detail}</p>
  </div>;
}
function TrendChart({ tab, annual, selected, onSelect }: { tab: BusinessTab; annual: YearProjection; selected: string | null; onSelect: (month: string) => void }) {
  const uid = useId().replace(/:/g, '');
  const theme = palette[tab];
  const key: BusinessMetric = tab === 'leads' ? 'leadEnquiries' : tab === 'payments' ? 'billedPaise' : 'newAdmissions';
  const summary = businessTrendSummary(annual, key);
  const exitRows = businessTrendSummary(annual, 'studentExits').rows;
  const data = summary.rows.map((r, i) => ({
    ...r, month: monthName(r.monthKey).slice(0, 3), exits: exitRows[i].value,
    fullValue: r.partial ? null : r.value,
    partialValue: r.partial || summary.rows[i + 1]?.partial ? r.value : null,
    fullExits: r.partial ? null : exitRows[i].value,
    partialExits: r.partial || summary.rows[i + 1]?.partial ? exitRows[i].value : null,
  }));
  const activeRow = data.find(r => r.monthKey === selected) ?? data.find(r => r.monthKey === summary.latest?.monthKey);
  const totalLabel = tab === 'leads' ? 'Enquiries' : tab === 'payments' ? 'Billed' : 'New admissions';
  if (!data.some(r => r.value !== null || (tab === 'enrollments' && r.exits !== null))) return <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No recorded values available to chart for this year.</p>;
  return <div>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600">
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: theme.color }} />{totalLabel}</span>
      {tab === 'enrollments' && <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-rose-600" />Student exits</span>}
      {data.some(r => r.partial) && <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-500 bg-slate-100" />Partial month</span>}
    </div>
    <div className="mt-4 h-[290px] min-w-0 sm:h-[330px]" aria-label={theme.label + ' chart'}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 620, height: 290 }}>
        <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }} accessibilityLayer>
          <defs>
            <linearGradient id={uid + 'area'} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={theme.color} stopOpacity={0.22} /><stop offset="100%" stopColor={theme.color} stopOpacity={0.025} /></linearGradient>
            <pattern id={uid + 'partial'} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill={theme.light} /><line x1="0" y1="0" x2="0" y2="6" stroke={theme.color} strokeWidth="2" /></pattern>
          </defs>
          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 5" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickMargin={12} minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} width={tab === 'payments' ? 60 : 38} domain={[0, 'auto']} tickFormatter={(v: number) => tab === 'payments' ? shortMoney(v) : count(v)} />
          <Tooltip cursor={{ fill: '#f1f5f9', stroke: '#cbd5e1', strokeDasharray: '3 3' }} content={({ active, payload }) => {
            const row = payload?.[0]?.payload as typeof data[number] | undefined;
            if (!active || !row) return null;
            return <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
              <p className="mb-2 font-semibold text-slate-900">{monthName(row.monthKey)} {annual.year}{row.partial ? ' · partial month' : ''}</p>
              <p style={{ color: theme.color }}>{totalLabel}: <strong>{display(key, row.value)}</strong></p>
              {tab === 'enrollments' && <p className="mt-1 text-rose-700">Student exits: <strong>{count(row.exits)}</strong></p>}
            </div>;
          }} />
          {tab === 'leads' ? <>
            <Area type="linear" dataKey="fullValue" stroke={theme.color} strokeWidth={3} fill={'url(#' + uid + 'area)'} connectNulls={false} isAnimationActive={false} dot={{ r: 3, fill: '#fff', stroke: theme.color, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            <Line type="linear" dataKey="partialValue" stroke={theme.color} strokeWidth={2.5} strokeDasharray="5 5" connectNulls={false} isAnimationActive={false} dot={{ r: 4, fill: '#fff', stroke: theme.color, strokeWidth: 2 }} />
          </> : <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={38} isAnimationActive={false}>
            {data.map(r => <Cell key={r.monthKey} fill={r.partial ? 'url(#' + uid + 'partial)' : r.monthKey === summary.peak?.monthKey ? theme.color : theme.light} stroke={r.monthKey === activeRow?.monthKey && !r.partial ? theme.color : undefined} strokeWidth={1.5} />)}
          </Bar>}
          {tab === 'enrollments' && <>
            <Line type="linear" dataKey="fullExits" stroke="#be123c" strokeWidth={2.5} connectNulls={false} isAnimationActive={false} dot={{ r: 3, fill: '#fff', stroke: '#be123c', strokeWidth: 2 }} />
            <Line type="linear" dataKey="partialExits" stroke="#be123c" strokeWidth={2.5} strokeDasharray="5 5" connectNulls={false} isAnimationActive={false} dot={{ r: 3, fill: '#fff', stroke: '#be123c', strokeWidth: 2 }} />
          </>}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Inspect monthly chart values">
      {data.map(r => <button key={r.monthKey} type="button" aria-pressed={activeRow?.monthKey === r.monthKey} aria-label={'Inspect ' + monthName(r.monthKey)} onClick={() => onSelect(r.monthKey)} className={'rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' + (activeRow?.monthKey === r.monthKey ? 'border-slate-400 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}>{r.month}</button>)}
    </div>
    {activeRow && <div aria-live="polite" className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <strong className="text-slate-900">{monthName(activeRow.monthKey)}{activeRow.partial ? ' · partial' : ''}</strong>
      <span>{totalLabel}: <strong className="tabular-nums text-slate-900">{display(key, activeRow.value)}</strong></span>
      {tab === 'enrollments' && <span>Student exits: <strong className="tabular-nums text-rose-700">{count(activeRow.exits)}</strong></span>}
    </div>}
  </div>;
}

function EnrollmentStockChart({ annual, current, selected }: { annual: YearProjection; current: CurrentProjection | null; selected: string | null }) {
  const rows = monthlyActiveEnrollmentRows(annual, current);
  const data = rows.map((r, i) => ({ ...r, month: monthName(r.monthKey).slice(0, 3),
    estimate: r.basis === 'reconstructed' ? r.value : null,
    observed: r.basis && r.basis !== 'reconstructed' ? r.value : null,
    bridge: r.basis && r.basis !== 'reconstructed' ? r.value : rows[i + 1]?.basis && rows[i + 1]?.basis !== 'reconstructed' ? r.value : null,
  }));
  const latest = data.find(r => r.monthKey === selected) ?? [...data].reverse().find(r => r.value !== null);
  const reconstructed = data.some(r => r.basis === 'reconstructed' && r.value !== null);
  return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Active enrollments by month">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-cyan-100 p-2.5 text-cyan-800"><Activity size={20} aria-hidden="true" /></span>
        <div><h4 className="font-semibold text-slate-900">Active enrollment base</h4><p className="mt-1 text-xs text-slate-500">Active courses at month end; latest month as of the saved snapshot.</p></div>
      </div>
      {latest && <div className="text-right"><p className="text-2xl font-bold tabular-nums text-cyan-800">{count(latest.value)}</p><p className="text-xs text-slate-500">{monthName(latest.monthKey)} · {latest.value == null ? 'not available' : latest.basis === 'reconstructed' ? 'reconstructed' : latest.basis === 'observed_month_end' ? 'observed close' : 'saved snapshot'}</p></div>}
    </div>
    {data.some(r => r.value !== null) ? <>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><span>● Observed snapshot</span><span>– – Reconstructed month end</span></div>
      <div className="mt-3 h-[230px] min-w-0 sm:h-[265px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{width:620,height:230}}>
          <ComposedChart data={data} margin={{top:12,right:12,left:0,bottom:4}} accessibilityLayer>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 5" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#64748b'}} tickMargin={10} />
            <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0,'auto']} width={40} tick={{fontSize:11,fill:'#64748b'}} />
            <Tooltip content={({active,payload})=>{const row=payload?.[0]?.payload as typeof data[number] | undefined;return active&&row?<div className="rounded-xl border bg-white p-3 text-xs shadow-lg"><p className="font-semibold">{monthName(row.monthKey)} {annual.year}</p><p className="mt-1 text-cyan-800">Active enrollments: <strong>{count(row.value)}</strong></p><p className="mt-1 text-slate-500">{row.basis==='reconstructed'?'Reconstructed from recorded spans':row.basis==='observed_month_end'?'Observed month-end count':'Saved snapshot count'}{row.observedAt?' · '+showTime(row.observedAt)+' IST':''}</p></div>:null;}} />
            <Line type="linear" dataKey="estimate" stroke="#0e7490" strokeDasharray="5 4" strokeWidth={2.5} dot={{r:3,fill:'#fff',stroke:'#0e7490',strokeWidth:2}} connectNulls={false} isAnimationActive={false} />
            <Line type="linear" dataKey="bridge" stroke="#0e7490" strokeDasharray="5 4" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="linear" dataKey="observed" stroke="#0e7490" strokeWidth={3} dot={{r:4,fill:'#0e7490',stroke:'#fff',strokeWidth:1.5}} connectNulls={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {!reconstructed && data.filter(r=>r.value!==null).length===1 && <p className="mt-2 text-xs text-slate-500">Historical month-end figures will appear once the extended aggregate report is published.</p>}
    </> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No saved enrollment stock figures for this year yet.</p>}
    <p className="mt-3 text-xs leading-relaxed text-slate-500">Earlier reconstructed counts assume continuity between recorded lifecycle dates; historical pauses or reactivations may be missing. {annual.historicalActiveEnrollmentExclusions > 0 ? annual.historicalActiveEnrollmentExclusions+' ambiguous enrollment records excluded from reconstruction. ' : ''}One child may have multiple active courses.</p>
  </article>;
}

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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
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
  const validAnnual = annual?.year === year ? annual : null;
  const months = Array.from({ length: 12 }, (_, i) => year + '-' + String(i + 1).padStart(2, '0'));
  const columns = BUSINESS_METRICS[tab];
  const enrollmentStock = validAnnual ? monthlyActiveEnrollmentRows(validAnnual,current) : [];
  const rows = months.map(monthKey => ({ monthKey, metrics: validAnnual && monthKey <= businessSnapshotDay(validAnnual).slice(0, 7) ? validAnnual.months.find(m => m.monthKey === monthKey)?.metrics : undefined }));
  const key: BusinessMetric = tab === 'leads' ? 'leadEnquiries' : tab === 'payments' ? 'billedPaise' : 'newAdmissions';
  const summary = validAnnual ? businessTrendSummary(validAnnual, key) : null;
  const exits = validAnnual ? businessTrendSummary(validAnnual, 'studentExits') : null;
  const theme = palette[tab];
  const TabIcon = theme.icon;
  const latestLabel = summary?.latest ? period(summary.latest.monthKey) + (summary.latest.partial ? ' · month to date' : ' · full month') : 'Selected year';
  const fullCoverage = summary && summary.knownMonths === summary.elapsedMonths;
  const coverageLabel = summary ? summary.knownMonths + ' of ' + summary.elapsedMonths + ' elapsed months have saved values' : 'No saved values';
  const changeText = summary?.change != null && summary.lastComplete && summary.previousComplete
    ? (summary.change > 0 ? '+' : '') + summary.change.toFixed(1) + '% · ' + period(summary.lastComplete.monthKey) + ' vs ' + period(summary.previousComplete.monthKey)
    : 'Two comparable completed months not available';
  const rosterAsOf = current ? (current.throughDate ? showDay(current.throughDate) : showTime(current.updatedAt)) + ' IST' : 'Not available';
  const mismatched = validAnnual && current && validAnnual.updatedAt !== current.updatedAt;
  const refresh = () => {
    cache.current.delete('year:' + year);
    cache.current.delete('current');
    setNonce(n => n + 1);
  };
  const changeTab = (next: BusinessTab) => { setTab(next); setExpanded(false); setSelectedMonth(null); };
  return (
    <section className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-5 lg:p-6" aria-label="Monthly business trends">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Activity size={14} aria-hidden="true" /> Business intelligence</div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Monthly business trends</h3>
          <p className="mt-1 text-sm text-slate-500">Growth, billing and student movement at a glance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="business-trends-year" className="sr-only">Year</label>
          <select id="business-trends-year" aria-label="Year" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700" value={year} onChange={e => { setYear(e.target.value); setSelectedMonth(null); setExpanded(false); }}>
            {Array.from({ length: 15 }, (_, i) => String(Number(thisYear) - i)).map(y => <option key={y}>{y}</option>)}
          </select>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50" disabled={loading} onClick={refresh}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Reload saved report</button>
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Monthly trend sections" className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map(t => { const Icon = palette[t.id].icon; return <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => changeTab(t.id)} className={'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ' + (tab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100')}><Icon size={15} aria-hidden="true" />{t.label}</button>; })}
        </nav>
        {validAnnual && <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><Clock3 size={14} aria-hidden="true" /><span>{validAnnual.throughDate ? <>Data through <strong>{showDay(validAnnual.throughDate)}</strong> (IST)</> : <>Initial snapshot as of <strong>{showTime(validAnnual.updatedAt)}</strong> (IST)</>}</span></div>}
      </div>
      {loading && <div role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-500">Loading saved analytics…<div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div></div>}
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">A saved report could not be fetched. Reload to retry; no raw-data fallback is used.</p>}
      {!loading && !validAnnual && <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Verified historical analytics are not available for this year.</p>}
      {!loading && (validAnnual || (tab === 'enrollments' && current)) && <>
        {tab === 'enrollments' && <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span className="font-semibold uppercase tracking-wide">Current roster · all years</span><span>As of {rosterAsOf}</span></div>}
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tab === 'enrollments' ? <>
            <Kpi label="Active students" value={count(current?.activeStudents)} detail="Current active children" color={theme.color} />
            <Kpi label="Active enrollments" value={count(current?.activeEnrollments)} detail="Current active courses" color={theme.color} />
            <Kpi label="New admissions" value={count(summary?.latest?.value)} detail={latestLabel} color={theme.color} />
            <Kpi label="Student exits" value={count(exits?.latest?.value)} detail={latestLabel} color="#be123c" />
          </> : <>
            <Kpi label={tab === 'leads' ? 'Latest month enquiries' : 'Latest month billed'} value={display(key, summary?.latest?.value)} detail={latestLabel} color={theme.color} />
            <Kpi label="Peak completed month" value={display(key, summary?.peak?.value)} detail={period(summary?.peak?.monthKey)} color={theme.color} />
            <Kpi label={tab === 'leads' ? 'Recorded year total' : 'Recorded year billing'} value={display(key, summary?.total)} detail={coverageLabel} color={theme.color} />
            <Kpi label="Average completed month" value={display(key, summary?.average)} detail={(summary?.averageMonths ?? 0) + ' months with saved values (including recorded zeros)'} color={theme.color} />
          </>}
        </div>
        {tab === 'enrollments' && <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"><span>Paused students <strong className="ml-2 text-slate-900">{count(current?.pausedStudents)}</strong></span><span>Retained students <strong className="ml-2 text-slate-900">{count(current?.retainedStudents)}</strong></span>{mismatched && <span className="text-amber-800">Roster and year snapshot timestamps differ.</span>}</div>}
        {validAnnual && summary && <>
          <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
            <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-5 flex items-start gap-3">
                <span className="rounded-xl p-2.5" style={{ backgroundColor: theme.light, color: theme.color }}><TabIcon size={20} aria-hidden="true" /></span>
                <div><h4 className="font-semibold text-slate-900">{theme.label}</h4><p className="mt-0.5 text-xs text-slate-500">{theme.subtitle}</p></div>
              </div>
              <TrendChart tab={tab} annual={validAnnual} selected={selectedMonth} onSelect={setSelectedMonth} />
            </article>
            <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Trend insights">
              <div className="flex items-center gap-2"><BarChart3 size={19} style={{ color: theme.color }} aria-hidden="true" /><h4 className="font-semibold text-slate-900">Trend insights</h4></div>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed-month movement</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-slate-900">{summary.change == null ? 'Not available' : (summary.change > 0 ? '+' : '') + summary.change.toFixed(1) + '%'}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{summary.change == null ? changeText : period(summary.lastComplete?.monthKey) + ' vs ' + period(summary.previousComplete?.monthKey) + ' · ' + (tab === 'enrollments' ? 'new admissions' : tab === 'leads' ? 'enquiries' : 'billed charges')}</p>
                </div>
                <div><p className="text-xs font-medium text-slate-500">Highest completed month</p><p className="mt-1 font-semibold text-slate-900">{summary.peak ? period(summary.peak.monthKey) + ' · ' + display(key, summary.peak.value) : 'Not available'}</p></div>
                {tab === 'enrollments' ? <div><p className="text-xs font-medium text-slate-500">Recorded year movement</p><p className="mt-1 text-sm font-semibold text-slate-900">{count(summary.total)} admissions · {count(exits?.total)} exits</p><p className="mt-1 text-xs text-slate-500">Admissions and exits are flows, not an active student balance.</p></div> : <div><p className="text-xs font-medium text-slate-500">Recorded year total</p><p className="mt-1 font-semibold text-slate-900">{display(key, summary.total)}</p><p className="mt-1 text-xs text-slate-500">{coverageLabel}{!fullCoverage ? ' · incomplete coverage' : ''}</p></div>}
                {summary.latest?.partial && <div className="flex gap-2 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600"><CalendarDays size={16} className="shrink-0" aria-hidden="true" /><span>{period(summary.latest.monthKey)} is still in progress in this snapshot. Month-to-date values are not used for full-month growth comparisons.</span></div>}
              </div>
            </aside>
          </div>
          {tab === 'enrollments' && <EnrollmentStockChart annual={validAnnual} current={current} selected={selectedMonth} />}
          <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button type="button" aria-expanded={expanded} aria-controls="business-monthly-breakdown" onClick={() => setExpanded(v => !v)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50 sm:px-5">
              <span><span className="block text-sm font-semibold text-slate-900">Monthly breakdown</span><span className="mt-1 block text-xs text-slate-500">All saved metrics, including labelled estimates</span></span><ChevronDown size={18} className={expanded ? 'rotate-180' : ''} aria-hidden="true" />
            </button>
            {expanded && <div id="business-monthly-breakdown" className="overflow-x-auto border-t border-slate-200">
              <table className="w-full text-left text-sm tabular-nums"><caption className="sr-only">Exact monthly {tab} values for {year}</caption>
                <thead className="bg-slate-50 text-xs text-slate-600"><tr><th scope="col" className="sticky left-0 bg-slate-50 px-4 py-3">Month</th>{columns.map(([metric,label]) => <th key={metric} scope="col" className="whitespace-nowrap px-4 py-3 text-right">{label}</th>)}</tr></thead>
                <tbody>{rows.map(({monthKey,metrics}) => <tr key={monthKey} className="border-t border-slate-100 hover:bg-slate-50"><th scope="row" className="sticky left-0 whitespace-nowrap bg-white px-4 py-3 font-medium text-slate-800">{monthName(monthKey)}{summary.rows.find(r => r.monthKey === monthKey)?.partial ? ' · partial' : ''}</th>{columns.map(([metric]) => <td key={metric} className="whitespace-nowrap px-4 py-3 text-right">{metric === 'activeEnrollmentsAtClose' ? (() => { const stock = enrollmentStock.find(r => r.monthKey === monthKey); return stock?.value == null ? 'Not available' : count(stock.value) + (stock.basis === 'reconstructed' ? ' (est.)' : stock.basis === 'observed_snapshot' ? ' (snapshot)' : ''); })() : formatBusinessMetric(metric, metrics?.[metric])}</td>)}</tr>)}</tbody>
              </table>
            </div>}
          </div>
        </>}
      </>}
      <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
        <summary className="cursor-pointer font-medium"><span className="ml-1 inline-flex items-center gap-2"><CircleHelp size={14} aria-hidden="true" /> Data notes & report freshness</span></summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          {validAnnual?.throughDate ? <p>Data through {showDay(validAnnual.throughDate)} (IST); today's activity is excluded. A saved snapshot does not certify that scheduling is currently healthy.</p> : validAnnual && <p>Initial snapshot as of {showTime(validAnnual.updatedAt)} (IST); daily closed-day refresh is not yet reflected.</p>}
          {validAnnual?.availableRecords && <p>Historical totals use available recorded dates. A zero means no recorded value contributed to that month, not proof of complete historical coverage. {validAnnual.undatedRecords > 0 ? 'Some source records have missing dates or unresolved details and cannot be assigned reliably.' : 'No unresolved details were flagged in the supplied records.'}</p>}
          {!!validAnnual?.conflictingInquiryDates && <p>Some copies of a recorded submission disagree on the date; the earliest available inquiry date is used.</p>}
          {!!validAnnual?.correctionBasedAdmissions && <p>Some admission dates are based on corrected historical enrollment records.</p>}
          {!!current?.unresolvedRecords && <p>Current totals exclude records with unresolved identity or status.</p>}
          <p>Year and roster timestamps: {showTime(validAnnual?.updatedAt)} / {showTime(current?.updatedAt)} IST.</p>
          <p>Aggregate document fetch attempts this page session: {attempts}. Operational query calls from this panel: 0. Reload fetches saved aggregates only; fetch attempts are not billed-read totals.</p>
        </div>
      </details>
    </section>
  );
}
