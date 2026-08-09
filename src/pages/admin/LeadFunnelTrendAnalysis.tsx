import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DemoSession } from '../../types/models';
import {
  addDaysToDateKey,
  buildLeadFunnelAnalytics,
  funnelRate,
  leadReceivedDateKey,
  todayIstDateKey,
  type FunnelRangePreset,
  type LeadFunnelLead,
} from './leadFunnelAnalytics';

interface LeadFunnelTrendAnalysisProps {
  leads: LeadFunnelLead[];
  demos: DemoSession[];
}

const metricCards = [
  { key: 'received', label: 'Leads Received', className: 'border-blue-200 bg-blue-50/40' },
  { key: 'demoCreated', label: 'Demo Created', className: 'border-indigo-200 bg-indigo-50/40' },
  { key: 'assigned', label: 'Assigned', className: 'border-amber-200 bg-amber-50/40' },
  { key: 'completed', label: 'Completed', className: 'border-emerald-200 bg-emerald-50/40' },
  { key: 'enrolled', label: 'Enrolled', className: 'border-pink-200 bg-pink-50/40' },
  { key: 'cancelled', label: 'Cancelled', className: 'border-slate-200 bg-slate-50/60' },
] as const;

const dateInput = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

const earliestLeadDate = (leads: LeadFunnelLead[], fallback: string): string => {
  let earliest = '';
  leads.forEach((lead) => {
    const key = leadReceivedDateKey(lead);
    if (key && (!earliest || key < earliest)) earliest = key;
  });
  return earliest || fallback;
};

const pct = (value: number): string => `${value.toFixed(1)}%`;

export default function LeadFunnelTrendAnalysis({ leads, demos }: LeadFunnelTrendAnalysisProps) {
  const todayKey = todayIstDateKey();
  const [preset, setPreset] = useState<FunnelRangePreset>('month');
  const [customStart, setCustomStart] = useState(todayKey ? `${todayKey.slice(0, 7)}-01` : '');
  const [customEnd, setCustomEnd] = useState(todayKey);

  const bounds = useMemo(() => {
    const today = todayKey;
    if (!today) return { startKey: '', endKey: '' };
    if (preset === 'week') return { startKey: addDaysToDateKey(today, -6), endKey: today };
    if (preset === 'month') return { startKey: `${today.slice(0, 7)}-01`, endKey: today };
    if (preset === 'till_date') return { startKey: earliestLeadDate(leads, today), endKey: today };

    let startKey = dateInput(customStart) ? customStart : today;
    let endKey = dateInput(customEnd) ? customEnd : today;
    if (startKey > endKey) [startKey, endKey] = [endKey, startKey];
    return { startKey, endKey };
  }, [customEnd, customStart, leads, preset, todayKey]);

  const analytics = useMemo(
    () => buildLeadFunnelAnalytics(leads, demos, bounds.startKey, bounds.endKey),
    [bounds.endKey, bounds.startKey, demos, leads],
  );

  const { cohortTotals, operational } = analytics;
  const leadToDemo = funnelRate(cohortTotals.demoCreated, cohortTotals.received);
  const demoToComplete = funnelRate(cohortTotals.completed, cohortTotals.demoCreated);
  const completedToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.completed);
  const leadToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.received);

  return (
    <div className="space-y-4">
      <Card className="border-emerald-100 bg-gradient-to-b from-emerald-50/45 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Lead &amp; Demo Funnel Analytics</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              One funnel from first enquiry through demo assignment, teacher completion, and successful enrollment.
              Received is measured from the original lead timestamp and never from the later demo-creation date.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Cohort: {bounds.startKey || '—'} to {bounds.endKey || '—'} · Business timezone: Asia/Kolkata
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={preset === 'week' ? 'default' : 'outline'} onClick={() => setPreset('week')}>
              Week
            </Button>
            <Button size="sm" variant={preset === 'month' ? 'default' : 'outline'} onClick={() => setPreset('month')}>
              Month
            </Button>
            <Button size="sm" variant={preset === 'till_date' ? 'default' : 'outline'} onClick={() => setPreset('till_date')}>
              Till Date
            </Button>
            <Button size="sm" variant={preset === 'custom' ? 'default' : 'outline'} onClick={() => setPreset('custom')}>
              Custom
            </Button>
          </div>
        </div>

        {preset === 'custom' ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <div>
              <label htmlFor="lead-funnel-start" className="mb-1 block text-xs font-medium text-slate-600">Start date</label>
              <Input id="lead-funnel-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </div>
            <div>
              <label htmlFor="lead-funnel-end" className="mb-1 block text-xs font-medium text-slate-600">End date</label>
              <Input id="lead-funnel-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map((card) => (
            <div key={card.key} className={`rounded-xl border p-3 ${card.className}`}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{cohortTotals[card.key]}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Lead → Demo</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(leadToDemo)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Demo → Completed</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(demoToComplete)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Completed → Enrolled</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(completedToEnroll)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Lead → Enrollment</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(leadToEnroll)}</div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-white p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Daily funnel activity</div>
              <div className="text-xs text-muted-foreground">Event date trend; cohort cards above follow leads first received in the selected period.</div>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.activity} margin={{ top: 12, right: 20, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={22} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="received" name="Received" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="demoCreated" name="Demo Created" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="assigned" name="Assigned" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="enrolled" name="Enrolled" stroke="#db2777" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="border-b bg-slate-50/70 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Source performance</div>
            <div className="text-xs text-muted-foreground">Conversion of leads first received during the selected period.</div>
          </div>
          {analytics.sourcePerformance.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No leads received in this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Leads</th>
                    <th className="px-3 py-2 text-right">Demos</th>
                    <th className="px-3 py-2 text-right">Completed</th>
                    <th className="px-3 py-2 text-right">Enrolled</th>
                    <th className="px-3 py-2 text-right">Demo completion</th>
                    <th className="px-4 py-2 text-right">Lead → enrollment</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.sourcePerformance.map((row) => (
                    <tr key={row.source} className="border-t">
                      <td className="px-4 py-2 font-medium text-slate-900">{row.source}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.received}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.demoCreated}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.completed}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.enrolled}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{pct(row.demoCompletionRate)}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{pct(row.leadToEnrollmentRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Current demo operations</div>
          <p className="mt-1 text-xs text-muted-foreground">Live workload across all active demo records.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Open</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.open}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Assigned</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.assigned}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Awaiting admin decision</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.completedAwaitingAdmin}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Cancelled</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.cancelled}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
