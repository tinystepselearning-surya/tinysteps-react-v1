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
  buildDemoOperationalDiagnostics,
  buildLeadFunnelAnalytics,
  funnelRate,
  leadReceivedDateKey,
  previousEqualLengthRange,
  todayIstDateKey,
  type DemoAgeBuckets,
  type FunnelRangePreset,
  type LeadFunnelLead,
} from './leadFunnelAnalytics';
import {
  ANALYTICS_GRAIN_LABELS,
  ANALYTICS_METRIC_LABELS,
  analyticsCohortDescription,
} from './analyticsMeasurementContract';

interface LeadFunnelTrendAnalysisProps {
  leads: LeadFunnelLead[];
  demos: DemoSession[];
  startKey?: string;
  endKey?: string;
  variant?: 'full' | 'summary';
}

const metricCards = [
  { key: 'received', label: ANALYTICS_METRIC_LABELS.leadsReceived },
  { key: 'demoCreated', label: ANALYTICS_METRIC_LABELS.demoCreated },
  { key: 'completed', label: ANALYTICS_METRIC_LABELS.demoCompleted },
  { key: 'enrolled', label: ANALYTICS_METRIC_LABELS.enrolled },
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
const signedPp = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(1)} pp`;
const countChange = (current: number, previous: number): string => {
  if (previous === 0) return current === 0 ? 'No change' : 'No prior baseline';
  const delta = ((current - previous) / previous) * 100;
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`;
};

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

const ComparisonCard = ({
  label,
  current,
  previous,
  delta,
}: {
  label: string;
  current: string | number;
  previous: string | number;
  delta: string;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <div className="text-xs font-medium text-slate-600">{label}</div>
    <div className="mt-1 flex items-baseline gap-2">
      <span className="text-xl font-semibold tabular-nums text-slate-950">{current}</span>
      <span className="text-xs font-semibold tabular-nums text-slate-600">{delta}</span>
    </div>
    <div className="mt-1 text-[11px] text-slate-500">Previous: {previous}</div>
  </div>
);

const AgeRow = ({ label, buckets }: { label: string; buckets: DemoAgeBuckets }) => (
  <tr className="border-t">
    <td className="px-3 py-2 font-medium text-slate-800">{label}</td>
    <td className="px-2 py-2 text-right tabular-nums">{buckets.age0To2}</td>
    <td className="px-2 py-2 text-right tabular-nums">{buckets.age3To7}</td>
    <td className="px-2 py-2 text-right tabular-nums">{buckets.age8To30}</td>
    <td className="px-2 py-2 text-right tabular-nums">{buckets.age31Plus}</td>
    <td className="px-3 py-2 text-right tabular-nums">{buckets.missingTimestamp}</td>
  </tr>
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

  const previousRange = useMemo(
    () => previousEqualLengthRange(bounds.startKey, bounds.endKey),
    [bounds.endKey, bounds.startKey],
  );
  const previousAnalytics = useMemo(
    () => buildLeadFunnelAnalytics(leads, demos, previousRange.startKey, previousRange.endKey),
    [demos, leads, previousRange.endKey, previousRange.startKey],
  );
  const operationalDiagnostics = useMemo(
    () => buildDemoOperationalDiagnostics(demos),
    [demos],
  );

  const { cohortTotals, operational } = analytics;
  const previousTotals = previousAnalytics.cohortTotals;
  const leadToDemo = funnelRate(cohortTotals.demoCreated, cohortTotals.received);
  const demoToComplete = funnelRate(cohortTotals.completed, cohortTotals.demoCreated);
  const completedToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.completed);
  const leadToEnroll = funnelRate(cohortTotals.enrolled, cohortTotals.received);
  const previousDemoToComplete = funnelRate(previousTotals.completed, previousTotals.demoCreated);
  const previousLeadToEnroll = funnelRate(previousTotals.enrolled, previousTotals.received);

  const stageGaps = [
    {
      label: 'Lead → Demo Created',
      description: 'Leads without a linked demo record yet',
      count: Math.max(0, cohortTotals.received - cohortTotals.demoCreated),
      rate: funnelRate(Math.max(0, cohortTotals.received - cohortTotals.demoCreated), cohortTotals.received),
    },
    {
      label: 'Demo Created → Completed',
      description: 'Demo-created leads without a delivered completed demo yet',
      count: Math.max(0, cohortTotals.demoCreated - cohortTotals.completed),
      rate: funnelRate(Math.max(0, cohortTotals.demoCreated - cohortTotals.completed), cohortTotals.demoCreated),
    },
    {
      label: 'Demo Completed → Enrolled',
      description: 'Completed-demo leads not yet enrolled',
      count: Math.max(0, cohortTotals.completed - cohortTotals.enrolled),
      rate: funnelRate(Math.max(0, cohortTotals.completed - cohortTotals.enrolled), cohortTotals.completed),
    },
  ];
  const largestStageGap = stageGaps.reduce(
    (largest, gap) => gap.count > largest.count ? gap : largest,
    stageGaps[0],
  );

  if (variant === 'summary') {
    return (
      <Card className="border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="executive-funnel-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="executive-funnel-heading" className="text-base font-semibold text-slate-950">Growth &amp; Admissions</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {analyticsCohortDescription(bounds.startKey, bounds.endKey)}
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Lead → Enrolled {pct(leadToEnroll)}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-center">
          <FunnelStage label={ANALYTICS_METRIC_LABELS.leadsReceived} value={cohortTotals.received} />
          <FunnelConnector label="Lead to Demo Created" rate={leadToDemo} />
          <FunnelStage label={ANALYTICS_METRIC_LABELS.demoCreated} value={cohortTotals.demoCreated} />
          <FunnelConnector label="Demo Created to Demo Completed" rate={demoToComplete} />
          <FunnelStage label={ANALYTICS_METRIC_LABELS.demoCompleted} value={cohortTotals.completed} />
          <FunnelConnector label="Demo Completed to Enrolled" rate={completedToEnroll} />
          <FunnelStage label={ANALYTICS_METRIC_LABELS.enrolled} value={cohortTotals.enrolled} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs">
          <span className="font-medium text-slate-500">{ANALYTICS_GRAIN_LABELS.liveDemoRecords}:</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800">{operational.open} awaiting assignment</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800">{operational.assigned} assigned</span>
          <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-800">{operational.completedAwaitingAdmin} decisions pending</span>
          {operationalDiagnostics.staleOpenOver7Days > 0 ? (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 font-medium text-rose-800">{operationalDiagnostics.staleOpenOver7Days} open &gt;7d</span>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Largest current cohort gap by volume: {largestStageGap.label} · {largestStageGap.count} not yet progressed. Stage gaps are open cohort states, not automatically lost leads.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Lead → Enrollment Funnel</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Lead-level conversion from first enquiry through demo creation, demo completion, and successful enrollment.
              Received is measured from the original lead timestamp, not a later demo-creation date.
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {analyticsCohortDescription(bounds.startKey, bounds.endKey)}
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

        <div className="mt-4 grid gap-2 md:grid-cols-3" aria-label="Analytics measurement guide">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
            <div className="text-xs font-semibold text-slate-800">{ANALYTICS_GRAIN_LABELS.leadCohort}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-slate-500">Cards and source conversion count each lead once, anchored to when the lead was first received.</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
            <div className="text-xs font-semibold text-slate-800">{ANALYTICS_GRAIN_LABELS.eventActivity}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-slate-500">The daily chart counts events on the day they happened, including demos belonging to earlier lead cohorts.</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2">
            <div className="text-xs font-semibold text-slate-800">{ANALYTICS_GRAIN_LABELS.liveDemoRecords}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-slate-500">The workload snapshot counts demo records now, independent of the selected historical cohort.</div>
          </div>
        </div>

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
            <div className="text-xs text-muted-foreground">Lead → Demo Created</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(leadToDemo)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Demo Created → Completed</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(demoToComplete)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Demo Completed → Enrolled</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(completedToEnroll)}</div>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs text-muted-foreground">Lead → Enrolled</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">{pct(leadToEnroll)}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-slate-200 bg-slate-50/45 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Stage-gap diagnosis</div>
                <div className="mt-1 text-xs text-slate-500">Where this lead cohort has not yet progressed to the next milestone.</div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">Not a lost-lead count</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {stageGaps.map((gap) => (
                <div key={gap.label} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-800">{gap.label}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums text-slate-950">{gap.count}</span>
                    <span className="text-xs font-medium tabular-nums text-slate-500">{pct(gap.rate)}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-4 text-slate-500">{gap.description}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Largest gap by volume: <strong>{largestStageGap.label}</strong> · {largestStageGap.count} leads not yet progressed. Cohorts can continue to mature after the reporting period.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/45 p-4">
            <div className="text-sm font-semibold text-slate-900">Previous-period comparison</div>
            <div className="mt-1 text-xs text-slate-500">
              Same-length preceding lead cohort: {previousRange.startKey || '—'} to {previousRange.endKey || '—'}.
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <ComparisonCard
                label="Leads Received"
                current={cohortTotals.received}
                previous={previousTotals.received}
                delta={countChange(cohortTotals.received, previousTotals.received)}
              />
              <ComparisonCard
                label="Demo Completion"
                current={pct(demoToComplete)}
                previous={pct(previousDemoToComplete)}
                delta={signedPp(demoToComplete - previousDemoToComplete)}
              />
              <ComparisonCard
                label="Lead → Enrolled"
                current={pct(leadToEnroll)}
                previous={pct(previousLeadToEnroll)}
                delta={signedPp(leadToEnroll - previousLeadToEnroll)}
              />
            </div>
            <p className="mt-3 text-[11px] leading-4 text-slate-500">
              This is a live cohort snapshot, not a fixed historical close. Later demo completions or enrollments can improve either cohort after its lead-receipt window ends.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-white p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">{ANALYTICS_GRAIN_LABELS.eventActivity}</div>
              <div className="text-xs text-muted-foreground">
                Events are plotted on the date they occurred. Demo Created and Demo Completed can therefore include demos for leads first received before the selected period; the cohort cards above do not.
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
                <Line type="monotone" dataKey="demoCreated" name={ANALYTICS_METRIC_LABELS.demoCreated} stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completed" name={ANALYTICS_METRIC_LABELS.demoCompleted} stroke="#16a34a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="enrolled" name={ANALYTICS_METRIC_LABELS.enrolled} stroke="#db2777" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="border-b bg-slate-50/70 px-4 py-3">
            <div className="text-sm font-semibold text-slate-900">Funnel performance by intake source</div>
            <div className="text-xs text-muted-foreground">Lead-cohort conversion by intake source, benchmarked against the selected cohort overall.</div>
          </div>
          {analytics.sourcePerformance.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No leads received in this period.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Leads</th>
                    <th className="px-3 py-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
                    <th className="px-3 py-2 text-right">{ANALYTICS_METRIC_LABELS.demoCompleted}</th>
                    <th className="px-3 py-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
                    <th className="px-3 py-2 text-right">Demo completion</th>
                    <th className="px-3 py-2 text-right">Lead → Enrolled</th>
                    <th className="px-4 py-2 text-right">vs cohort</th>
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
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{pct(row.leadToEnrollmentRate)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-600">{signedPp(row.leadToEnrollmentRate - leadToEnroll)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Live demo workload health</div>
              <p className="mt-1 text-xs text-muted-foreground">Aging diagnostics for current demo records. This is independent of the selected lead cohort.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">Demo-record grain</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Awaiting assignment</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.open}</div>
              <div className="mt-1 text-[11px] text-slate-500">{operationalDiagnostics.staleOpenOver7Days} older than 7 days</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Assigned</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.assigned}</div>
              <div className="mt-1 text-[11px] text-slate-500">{operationalDiagnostics.staleAssignedOver7Days} assigned &gt;7 days</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Decision pending</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operational.completedAwaitingAdmin}</div>
              <div className="mt-1 text-[11px] text-slate-500">{operationalDiagnostics.staleDecisionOver7Days} pending &gt;7 days</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Very old open records</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{operationalDiagnostics.veryStaleOpenOver30Days}</div>
              <div className="mt-1 text-[11px] text-slate-500">Awaiting assignment &gt;30 days</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[520px] text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Status age</th>
                  <th className="px-2 py-2 text-right">0–2d</th>
                  <th className="px-2 py-2 text-right">3–7d</th>
                  <th className="px-2 py-2 text-right">8–30d</th>
                  <th className="px-2 py-2 text-right">31+d</th>
                  <th className="px-3 py-2 text-right">No date</th>
                </tr>
              </thead>
              <tbody>
                <AgeRow label="Awaiting assignment" buckets={operationalDiagnostics.openAge} />
                <AgeRow label="Assigned" buckets={operationalDiagnostics.assignedAge} />
                <AgeRow label="Decision pending" buckets={operationalDiagnostics.decisionAge} />
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">{operational.cancelled} cancelled records</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">{operationalDiagnostics.activeRescheduleLinked} active reschedule-linked</span>
            {operationalDiagnostics.missingAgeTimestamp > 0 ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-800">{operationalDiagnostics.missingAgeTimestamp} missing age timestamp</span>
            ) : null}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Older records are flagged for investigation only; age alone does not prove a record is invalid. This view is designed to reveal whether a large awaiting-assignment total is mostly recent workload or historical/stale backlog.
          </p>
        </Card>
      </div>
    </div>
  );
}
