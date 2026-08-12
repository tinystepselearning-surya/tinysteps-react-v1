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
  startKey?: string;
  endKey?: string;
  variant?: 'full' | 'summary';
}

const metricCards = [
  { key: 'received', label: 'Leads Received' },
  { key: 'demoCreated', label: 'Demo Created' },
  { key: 'completed', label: 'Demo Completed' },
  { key: 'enrolled', label: 'Enrolled' },
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

const FunnelStage = ({ label, value }: { label: string; value: number }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{value}</div>
  </div>
);

const FunnelConnector = ({ label, rate }: { label: string; rate: number }) => (
  <div className="flex items-center justify-center gap-2 py-1 text-center text-xs text-slate-500 xl:flex-col xl:gap-0">
    <span aria-hidden="true" className="text-lg text-slate-300">→</span>
    <span className="font-semibold tabular-nums text-slate-700">{pct(rate)}</span>
    <span className="sr-only">{label}</span>
  </div>
);

export default function LeadFunnelTrendAnalysis({
  leads,
  demos,
  startKey: controlledStartKey,
  endKey: controlledEndKey,
  variant = 'full',
}: LeadFunnelTrendAnalysisProps) {
  const todayKey = todayIstDateKey();
  const [preset, setPreset] = useState<FunnelRangePreset>('month');
  const [customStart, setCustomStart] = useState(todayKey ? `${todayKey.slice(0, 7)}-01` : '');
  const [customEnd, setCustomEnd] = useState(todayKey);
  const controlledRange = Boolean(controlledStartKey && controlledEndKey);

  const bounds = useMemo(() => {
    if (controlledRange) {
      let startKey = controlledStartKey || '';
      let endKey = controlledEndKey || '';
      if (startKey > endKey) [startKey, endKey] = [endKey, startKey];
      return { startKey, endKey };
    }

    const today = todayKey;
    if (!today) return { startKey: '', endKey: '' };
    if (preset === 'week') return { startKey: addDaysToDateKey(today, -6), endKey: today };
    if (preset === 'month') return { startKey: `${today.slice(0, 7)}-01`, endKey: today };
    if (preset === 'till_date') return { startKey: earliestLeadDate(leads, today), endKey: today };

    let startKey = dateInput(customStart) ? customStart : today;
    let endKey = dateInput(customEnd) ? customEnd : today;
    if (startKey > endKey) [startKey, endKey] = [endKey, startKey];
    return { startKey, endKey };
  }, [controlledEndKey, controlledRange, controlledStartKey, customEnd, customStart, leads, preset, todayKey]);

  const analytics = useMemo(
    () => buildLeadFunnelAnalytics(leads, demos, bounds.startKey, bounds.endKey),
    [bounds.endKey, bounds.startKey, demos, leads],
  );

  const { cohortTotals, operational } = analytics;
  const leadToDemo = funnelRate(cohortTotals.demoCreated, cohortTotals.received);
  const demoToComplete = funnelRate(cohortTotals.completed, cohortTotals.demoCreated);
  const completedToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.completed);
  const leadToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.received);

  if (variant === 'summary') {
    return (
      <Card className="border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="executive-funnel-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="executive-funnel-heading" className="text-base font-semibold text-slate-950">Growth &amp; Admissions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Lead-level progression for {bounds.startKey || '—'} to {bounds.endKey || '—'} · Asia/Kolkata
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Lead → enrollment {pct(leadToEnroll)}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-center">
          <FunnelStage label="Leads Received" value={cohortTotals.received} />
          <FunnelConnector label="Lead to demo" rate={leadToDemo} />
          <FunnelStage label="Demo Created" value={cohortTotals.demoCreated} />
          <FunnelConnector label="Demo to completed" rate={demoToComplete} />
          <FunnelStage label="Demo Completed" value={cohortTotals.completed} />
          <FunnelConnector label="Completed to enrolled" rate={completedToEnroll} />
          <FunnelStage label="Enrolled" value={cohortTotals.enrolled} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs">
          <span className="font-medium text-slate-500">Live demo workload:</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800">{operational.open} awaiting assignment</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800">{operational.assigned} assigned</span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-800">{operational.completedAwaitingAdmin} decisions pending</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Funnel stages count leads. Live workload counts demo records, so retries, reschedules, or replacements can make the totals differ legitimately.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Lead → Admission Funnel</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Lead-level conversion from first enquiry through demo creation, demo completion, and successful enrollment.
              Received is measured from the original lead timestamp, not a later demo-creation date.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              Cohort: {bounds.startKey || '—'} to {bounds.endKey || '—'} · Business timezone: Asia/Kolkata
            </p>
          </div>
          {!controlledRange ? (
            <div className="flex flex-wrap gap-2" aria-label="Lead funnel date range">
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
          ) : null}
        </div>

        {!controlledRange && preset === 'custom' ? (
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <div key={card.key} className="rounded-xl border border-slate-200 bg-slate-50/55 p-3">
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
              <div className="text-xs text-muted-foreground">
                Event-date trend: Received counts leads; demo series count demo records. Cohort cards above count lead-level milestones for leads first received in the selected period.
              </div>
            </div>
          </div>
          <div
            className="h-[320px] w-full"
            role="img"
            aria-label="Daily lead and demo event activity for the selected date range"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.activity} margin={{ top: 12, right: 20, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" minTickGap={22} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="received" name="Received" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="demoCreated" name="Demo Created" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name="Demo Completed" stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="enrolled" name="Enrolled" stroke="#db2777" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.75fr]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="border-b bg-slate-50/70 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Funnel performance by intake source</div>
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
          <div className="text-sm font-semibold text-slate-900">Demo operations snapshot</div>
          <p className="mt-1 text-xs text-muted-foreground">Live workload across active demo records, independent of the cohort range above.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Awaiting assignment</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.open}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Assigned</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.assigned}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Completed · decision pending</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.completedAwaitingAdmin}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Cancelled demo records</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.cancelled}</div>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Funnel metrics are lead-level milestones. This snapshot counts demo records, so one lead can contribute more than one demo record after a retry, reschedule, or replacement.
          </p>
        </Card>
      </div>
    </div>
  );
}
