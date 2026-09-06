import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, Timestamp, where } from 'firebase/firestore';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import type { AcquisitionChannel } from '../../lib/leadAcquisition';
import DemoSessionsManagement from './DemoSessionsManagement';
import {
  addDaysToDateKey,
  dateKeyInRange,
  leadReceivedDateKey,
  todayIstDateKey,
} from './leadFunnelAnalytics';
import {
  ANALYTICS_GRAIN_LABELS,
  ANALYTICS_METRIC_LABELS,
  analyticsCohortDescription,
  hasLeadDemoCompletedMilestone,
  hasLeadDemoCreatedMilestone,
  hasLeadEnrolledMilestone,
} from './analyticsMeasurementContract';
import {
  acquisitionGroupLabel,
  attributionDetail,
  hasAttributionEvidence,
  percentagePointDelta,
  resolveAcquisitionAnalytics,
  type AcquisitionGroupKey,
  type AttributionMap,
} from './leadAcquisitionAnalytics';

type LeadRow = {
  id: string;
  receivedAt?: Timestamp | null;
  requestedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  demoCompletedAt?: Timestamp | Date | number | string | null;
  status?: string | null;
  source?: string | null;
  sourceDetail?: string | null;
  sourcePath?: string | null;
  programInterest?: string | null;
  interestTrack?: string | null;
  mainConcern?: string | null;
  acquisitionChannel?: AcquisitionChannel | null;
  acquisitionSource?: string | null;
  landingPage?: string | null;
  conversionPage?: string | null;
  demoSessionId?: string | null;
  attribution?: AttributionMap | null;
};

type ChannelSummary = {
  key: string;
  label: string;
  group: AcquisitionGroupKey;
  count: number;
  demoCreatedCount: number;
  demoCompletedCount: number;
  enrolledCount: number;
  leads: LeadRow[];
};

type LandingSummary = {
  page: string;
  count: number;
  demoCreatedCount: number;
  demoCompletedCount: number;
  enrolledCount: number;
};

export interface LeadSourceAnalysisProps {
  startDateKey?: string;
  endDateKey?: string;
  showFunnel?: boolean;
  showAttribution?: boolean;
}

const RANGE_OPTIONS = [7, 30, 90] as const;
const GROUP_ORDER: AcquisitionGroupKey[] = [
  'ai_answer_engines',
  'organic_search',
  'paid',
  'social',
  'direct',
  'referral',
  'other_campaign',
  'legacy_unattributed',
];

const normalize = (value: unknown): string => String(value || '').trim();
const pct = (part: number, total: number): string => (total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0.0%');
const ppLabel = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)} pp`;

const istBoundaryDate = (dateKey: string, endOfDay = false): Date =>
  new Date(`${dateKey}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+05:30`);

const formatDateKey = (dateKey: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return dateKey;
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
};

const resolveLandingPage = (lead: LeadRow): string =>
  normalize(lead.landingPage || lead.attribution?.landingPage) || 'Legacy / unknown';

export default function LeadSourceAnalysisV3({
  startDateKey,
  endDateKey,
  showFunnel = true,
  showAttribution = true,
}: LeadSourceAnalysisProps): JSX.Element {
  const [rangeDays, setRangeDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedChannelKey, setSelectedChannelKey] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);
  const controlledRange = Boolean(startDateKey && endDateKey);

  const resolvedRange = useMemo(() => {
    const endKey = controlledRange && endDateKey ? endDateKey : todayIstDateKey();
    const startKey = controlledRange && startDateKey
      ? startDateKey
      : addDaysToDateKey(endKey, -(rangeDays - 1));
    return { startKey, endKey };
  }, [controlledRange, endDateKey, rangeDays, startDateKey]);

  const load = useCallback(async () => {
    if (!showAttribution) return;
    const requestSequence = ++requestSequenceRef.current;
    setLoading(true);
    setError(null);
    setRows([]);
    setSelectedChannelKey(null);

    const start = istBoundaryDate(resolvedRange.startKey);
    const end = istBoundaryDate(resolvedRange.endKey, true);
    const label = controlledRange
      ? `LeadSourceAnalysis:${resolvedRange.startKey}:${resolvedRange.endKey}`
      : `LeadSourceAnalysis:${rangeDays}d`;
    const timestampFields = ['receivedAt', 'requestedAt', 'createdAt'] as const;

    try {
      const snapshots = await Promise.all(timestampFields.map((field, index) =>
        getDocsLogged(
          index === 0 ? label : `${label}:${field}`,
          query(
            collection(db, 'leads'),
            where(field, '>=', Timestamp.fromDate(start)),
            where(field, '<=', Timestamp.fromDate(end)),
          ),
          { source: 'src/pages/admin/LeadSourceAnalysisV3.tsx' },
        )
      ));
      if (requestSequenceRef.current !== requestSequence) return;

      const deduped = new Map<string, LeadRow>();
      snapshots.forEach((snapshot) => snapshot.docs.forEach((document) => {
        deduped.set(document.id, { id: document.id, ...(document.data() as Omit<LeadRow, 'id'>) });
      }));
      setRows(Array.from(deduped.values()).filter((lead) => {
        if ((lead as LeadRow & { archived?: boolean }).archived) return false;
        return dateKeyInRange(
          leadReceivedDateKey(lead),
          resolvedRange.startKey,
          resolvedRange.endKey,
        );
      }));
    } catch (err: any) {
      if (requestSequenceRef.current !== requestSequence) return;
      console.error('[LeadSourceAnalysisV3] load failed', err);
      setError(err?.message || 'Could not load lead attribution analytics.');
      setRows([]);
    } finally {
      if (requestSequenceRef.current === requestSequence) setLoading(false);
    }
  }, [controlledRange, rangeDays, resolvedRange.endKey, resolvedRange.startKey, showAttribution]);

  useEffect(() => {
    if (!showAttribution) return undefined;
    void load();
    return () => {
      requestSequenceRef.current += 1;
    };
  }, [load, refreshKey, showAttribution]);

  const analysis = useMemo(() => {
    const byChannel = new Map<string, ChannelSummary>();
    const byLanding = new Map<string, LandingSummary>();
    const groupCounts = GROUP_ORDER.reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<AcquisitionGroupKey, number>,
    );
    let attributedCount = 0;
    let demoCreatedCount = 0;
    let demoCompletedCount = 0;
    let enrolledCount = 0;

    rows.forEach((lead) => {
      const resolved = resolveAcquisitionAnalytics(lead);
      const landingPage = resolveLandingPage(lead);
      const demoCreated = hasLeadDemoCreatedMilestone(lead);
      const demoCompleted = hasLeadDemoCompletedMilestone(lead);
      const enrolled = hasLeadEnrolledMilestone(lead);

      if (hasAttributionEvidence(lead)) attributedCount += 1;
      if (demoCreated) demoCreatedCount += 1;
      if (demoCompleted) demoCompletedCount += 1;
      if (enrolled) enrolledCount += 1;
      groupCounts[resolved.group] += 1;

      const channelBucket = byChannel.get(resolved.key) || {
        key: resolved.key,
        label: resolved.label,
        group: resolved.group,
        count: 0,
        demoCreatedCount: 0,
        demoCompletedCount: 0,
        enrolledCount: 0,
        leads: [],
      };
      channelBucket.count += 1;
      if (demoCreated) channelBucket.demoCreatedCount += 1;
      if (demoCompleted) channelBucket.demoCompletedCount += 1;
      if (enrolled) channelBucket.enrolledCount += 1;
      channelBucket.leads.push(lead);
      byChannel.set(resolved.key, channelBucket);

      const landingBucket = byLanding.get(landingPage) || {
        page: landingPage,
        count: 0,
        demoCreatedCount: 0,
        demoCompletedCount: 0,
        enrolledCount: 0,
      };
      landingBucket.count += 1;
      if (demoCreated) landingBucket.demoCreatedCount += 1;
      if (demoCompleted) landingBucket.demoCompletedCount += 1;
      if (enrolled) landingBucket.enrolledCount += 1;
      byLanding.set(landingPage, landingBucket);
    });

    const channelRows = Array.from(byChannel.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.label.localeCompare(b.label);
    });
    const landingRows = Array.from(byLanding.values())
      .sort((a, b) => b.count - a.count || a.page.localeCompare(b.page))
      .slice(0, 15);

    return {
      total: rows.length,
      attributedCount,
      demoCreatedCount,
      demoCompletedCount,
      enrolledCount,
      groupCounts,
      channelRows,
      landingRows,
    };
  }, [rows]);

  const selectedChannel = useMemo(
    () => analysis.channelRows.find((row) => row.key === selectedChannelKey) || null,
    [analysis.channelRows, selectedChannelKey],
  );

  const renderMetricValue = (value: string | number): string | number => {
    if (error) return '—';
    if (loading) return '…';
    return value;
  };

  const unavailableMessage = error
    ? 'Unavailable because attribution data could not be loaded.'
    : loading
      ? 'Loading…'
      : null;
  const asOfKey = todayIstDateKey();
  const cohortStillMaturing = resolvedRange.endKey >= asOfKey;

  return (
    <div className="space-y-4">
      {showFunnel ? (
        <section aria-labelledby="growth-admissions-heading" className="space-y-3">
          <div>
            <h2 id="growth-admissions-heading" className="text-lg font-semibold text-slate-950">Growth &amp; Admissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Lead conversion performance and current demo workload.</p>
          </div>
          <DemoSessionsManagement
            mode="trend_only"
            showTrendAnalytics
            analyticsStartKey={startDateKey}
            analyticsEndKey={endDateKey}
          />
        </section>
      ) : null}

      {showAttribution ? (
        <Card className="p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">Acquisition V3 · Source Quality</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                First-touch lead attribution from acquisition source through Demo Created, Demo Completed and Enrolled. This is not a total website-traffic report.
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {analyticsCohortDescription(resolvedRange.startKey, resolvedRange.endKey)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Outcomes measured as of {formatDateKey(asOfKey)}{cohortStillMaturing ? ' · cohort still maturing' : ''}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2" aria-label="Marketing attribution date range">
              {!controlledRange ? RANGE_OPTIONS.map((days) => (
                <Button
                  key={days}
                  type="button"
                  size="sm"
                  variant={rangeDays === days ? 'default' : 'outline'}
                  onClick={() => setRangeDays(days)}
                >
                  {days}d
                </Button>
              )) : null}
              <Button type="button" size="sm" variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{ANALYTICS_GRAIN_LABELS.leadCohort}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">First-touch attribution</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Outcome quality</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Not total page traffic</span>
          </div>

          {error ? (
            <div role="status" className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error} Metrics are shown as unavailable rather than zero so a read failure cannot look like real performance.
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Leads', analysis.total],
              ['Attribution coverage', `${analysis.attributedCount} (${pct(analysis.attributedCount, analysis.total)})`],
              [ANALYTICS_METRIC_LABELS.demoCreated, `${analysis.demoCreatedCount} (${pct(analysis.demoCreatedCount, analysis.total)})`],
              [ANALYTICS_METRIC_LABELS.demoCompleted, `${analysis.demoCompletedCount} (${pct(analysis.demoCompletedCount, analysis.total)})`],
              [ANALYTICS_METRIC_LABELS.enrolled, `${analysis.enrolledCount} (${pct(analysis.enrolledCount, analysis.total)})`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold">{renderMetricValue(value)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {GROUP_ORDER.map((group) => (
              <span key={group} className="rounded-full border px-2.5 py-1">
                {acquisitionGroupLabel(group)} {renderMetricValue(`${analysis.groupCounts[group]} (${pct(analysis.groupCounts[group], analysis.total)})`)}
              </span>
            ))}
          </div>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Attribution coverage means a stored first-touch record exists. A legitimately tracked direct visit can therefore be covered while still labelled Direct.
          </p>

          <div className="mt-5 overflow-x-auto rounded-lg border">
            <div className="border-b px-3 py-2">
              <div className="text-sm font-semibold">Acquisition source quality</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                AI/answer-engine referrals are normalized for reporting while raw first-touch values remain available under Inspect.
              </div>
            </div>
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Source</th>
                  <th className="p-2 text-right">Leads</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCompleted}</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
                  <th className="p-2 text-right">Lead → Demo Completed</th>
                  <th className="p-2 text-right">Lead → Enrolled</th>
                  <th className="p-2 text-right">Completed → Enrolled</th>
                  <th className="p-2 text-right">vs cohort</th>
                  <th className="p-2 text-right">Detail</th>
                </tr>
              </thead>
              <tbody>
                {analysis.channelRows.length === 0 ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={10}>{unavailableMessage || 'No leads in this period.'}</td></tr>
                ) : analysis.channelRows.map((row) => {
                  const benchmarkDelta = percentagePointDelta(
                    row.enrolledCount,
                    row.count,
                    analysis.enrolledCount,
                    analysis.total,
                  );
                  return (
                    <tr key={row.key} className="border-b last:border-b-0">
                      <td className="p-2">
                        <div className="font-medium">{row.label}</div>
                        <div className="text-[11px] text-muted-foreground">{acquisitionGroupLabel(row.group)}</div>
                      </td>
                      <td className="p-2 text-right">{row.count}</td>
                      <td className="p-2 text-right">{row.demoCreatedCount}</td>
                      <td className="p-2 text-right">{row.demoCompletedCount}</td>
                      <td className="p-2 text-right">{row.enrolledCount}</td>
                      <td className="p-2 text-right">{pct(row.demoCompletedCount, row.count)}</td>
                      <td className="p-2 text-right font-semibold">{pct(row.enrolledCount, row.count)}</td>
                      <td className="p-2 text-right">{pct(row.enrolledCount, row.demoCompletedCount)}</td>
                      <td className="p-2 text-right">{ppLabel(benchmarkDelta)}</td>
                      <td className="p-2 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant={selectedChannelKey === row.key ? 'default' : 'outline'}
                          onClick={() => setSelectedChannelKey((current) => current === row.key ? null : row.key)}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedChannel ? (
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50/40">
              <div className="border-b px-3 py-2">
                <div className="text-sm font-semibold">First-touch detail · {selectedChannel.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  Raw UTM/referrer values are preserved. No historical source is guessed or rewritten.
                </div>
              </div>
              <table className="w-full min-w-[900px] text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="p-2">Lead</th>
                    <th className="p-2">Raw source</th>
                    <th className="p-2">UTM source</th>
                    <th className="p-2">UTM medium</th>
                    <th className="p-2">UTM campaign</th>
                    <th className="p-2">Referrer</th>
                    <th className="p-2">Landing page</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedChannel.leads.slice(0, 25).map((lead) => {
                    const detail = attributionDetail(lead);
                    return (
                      <tr key={lead.id} className="border-b last:border-b-0">
                        <td className="p-2 font-mono">{lead.id}</td>
                        <td className="p-2">{detail.rawSource}</td>
                        <td className="p-2">{detail.utmSource}</td>
                        <td className="p-2">{detail.utmMedium}</td>
                        <td className="max-w-[220px] truncate p-2" title={detail.utmCampaign}>{detail.utmCampaign}</td>
                        <td className="max-w-[220px] truncate p-2" title={detail.referrerDomain}>{detail.referrerDomain}</td>
                        <td className="max-w-[260px] truncate p-2 font-mono" title={detail.landingPage}>{detail.landingPage}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {selectedChannel.leads.length > 25 ? (
                <p className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                  Showing the first 25 of {selectedChannel.leads.length} cohort leads for this source.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto rounded-lg border">
            <div className="border-b px-3 py-2">
              <div className="text-sm font-semibold">Top lead-origin landing pages</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Pages where cohort leads first entered; this does not rank pages by total visits. Traffic analytics arrives in the later GA4/GSC bricks.
              </div>
            </div>
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-2">Landing page</th>
                  <th className="p-2 text-right">Leads</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCompleted}</th>
                  <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
                  <th className="p-2 text-right">Lead → Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {analysis.landingRows.length === 0 ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={6}>{unavailableMessage || 'No landing-page data yet.'}</td></tr>
                ) : analysis.landingRows.map((row) => (
                  <tr key={row.page} className="border-b last:border-b-0">
                    <td className="max-w-[360px] truncate p-2 font-mono text-xs" title={row.page}>{row.page}</td>
                    <td className="p-2 text-right">{row.count}</td>
                    <td className="p-2 text-right">{row.demoCreatedCount}</td>
                    <td className="p-2 text-right">{row.demoCompletedCount}</td>
                    <td className="p-2 text-right">{row.enrolledCount}</td>
                    <td className="p-2 text-right font-semibold">{pct(row.enrolledCount, row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            First-touch attribution stays immutable for reporting. Older leads without stored first-touch evidence remain Legacy / Unattributed instead of being guessed as Direct.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
