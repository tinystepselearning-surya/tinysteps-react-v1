import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { collection, query, Timestamp, where } from 'firebase/firestore';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import {
  acquisitionChannelLabel,
  classifyLeadAcquisition,
  type AcquisitionChannel,
} from '../../lib/leadAcquisition';
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
  hasLeadDemoCreatedMilestone,
  hasLeadEnrolledMilestone,
} from './analyticsMeasurementContract';

type LeadAttributionMap = {
  landingPage?: string | null;
  conversionPage?: string | null;
  referrer?: string | null;
  referrerDomain?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  acquisitionChannel?: AcquisitionChannel | null;
  acquisitionSource?: string | null;
};

type LeadRow = {
  id: string;
  receivedAt?: Timestamp | null;
  requestedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
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
  attribution?: LeadAttributionMap | null;
};

type ChannelSummary = {
  channel: string;
  label: string;
  count: number;
  demoCreatedCount: number;
  enrolledCount: number;
};

interface LeadSourceAnalysisProps {
  startDateKey?: string;
  endDateKey?: string;
  showFunnel?: boolean;
  showAttribution?: boolean;
}

const RANGE_OPTIONS = [7, 30, 90] as const;

const normalize = (value: unknown): string => String(value || '').trim();

const hasAttributionEvidence = (lead: LeadRow): boolean => {
  const a = lead.attribution || {};
  return Boolean(
    lead.acquisitionChannel ||
      lead.landingPage ||
      a.acquisitionChannel ||
      a.referrerDomain ||
      a.referrer ||
      a.utm_source ||
      a.utm_medium ||
      a.utm_campaign ||
      a.gclid ||
      a.fbclid ||
      a.msclkid,
  );
};

const resolveChannel = (lead: LeadRow): { channel: string; label: string } => {
  const a = lead.attribution || {};
  const explicit = lead.acquisitionChannel || a.acquisitionChannel;
  if (explicit) {
    return { channel: explicit, label: acquisitionChannelLabel(explicit) };
  }

  const classified = classifyLeadAcquisition({
    referrer: normalize(a.referrer) || undefined,
    referrerDomain: normalize(a.referrerDomain) || undefined,
    utmSource: normalize(a.utm_source) || undefined,
    utmMedium: normalize(a.utm_medium) || undefined,
    utmCampaign: normalize(a.utm_campaign) || undefined,
    gclid: normalize(a.gclid) || undefined,
    fbclid: normalize(a.fbclid) || undefined,
    msclkid: normalize(a.msclkid) || undefined,
  });

  if (hasAttributionEvidence(lead)) {
    return { channel: classified.channel, label: classified.label };
  }

  const legacySource = normalize(lead.source).toLowerCase();
  if (legacySource === 'instagram') return { channel: 'instagram', label: 'Instagram (legacy)' };
  if (legacySource === 'referral') return { channel: 'referral', label: 'Referral (legacy)' };
  if (legacySource === 'whatsapp') return { channel: 'legacy_whatsapp', label: 'WhatsApp (legacy)' };
  if (legacySource === 'manual') return { channel: 'legacy_manual', label: 'Manual (legacy)' };

  return { channel: 'legacy_unattributed', label: 'Legacy / unattributed' };
};

const resolveLandingPage = (lead: LeadRow): string => {
  const a = lead.attribution || {};
  return normalize(lead.landingPage || a.landingPage) || 'Legacy / unknown';
};

const pct = (part: number, total: number): string => (total > 0 ? `${Math.round((part / total) * 100)}%` : '0%');

const istBoundaryDate = (dateKey: string, endOfDay = false): Date =>
  new Date(`${dateKey}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+05:30`);

export default function LeadSourceAnalysis({
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
  const requestSequenceRef = useRef(0);
  const controlledRange = Boolean(startDateKey && endDateKey);

  const load = useCallback(async () => {
    if (!showAttribution) return;

    const requestSequence = ++requestSequenceRef.current;
    setLoading(true);
    setError(null);
    // Never show the previous range's totals under the newly selected range label.
    setRows([]);

    const resolvedEndKey = controlledRange && endDateKey ? endDateKey : todayIstDateKey();
    const resolvedStartKey = controlledRange && startDateKey
      ? startDateKey
      : addDaysToDateKey(resolvedEndKey, -(rangeDays - 1));
    const start = istBoundaryDate(resolvedStartKey);
    const end = istBoundaryDate(resolvedEndKey, true);
    const label = controlledRange
      ? `LeadSourceAnalysis:${resolvedStartKey}:${resolvedEndKey}`
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
          { source: 'src/pages/admin/LeadSourceAnalysis.tsx' },
        )
      ));
      if (requestSequenceRef.current !== requestSequence) return;
      const deduped = new Map<string, LeadRow>();
      snapshots.forEach((snap) => snap.docs.forEach((d) => {
        deduped.set(d.id, { id: d.id, ...(d.data() as Omit<LeadRow, 'id'>) });
      }));
      setRows(Array.from(deduped.values()).filter((lead) => {
        if ((lead as LeadRow & { archived?: boolean }).archived) return false;
        return dateKeyInRange(leadReceivedDateKey(lead), resolvedStartKey, resolvedEndKey);
      }));
    } catch (err: any) {
      if (requestSequenceRef.current !== requestSequence) return;
      console.error('[LeadSourceAnalysis] load failed', err);
      setError(err?.message || 'Could not load lead attribution analytics.');
      setRows([]);
    } finally {
      if (requestSequenceRef.current === requestSequence) {
        setLoading(false);
      }
    }
  }, [controlledRange, endDateKey, rangeDays, showAttribution, startDateKey]);

  useEffect(() => {
    if (!showAttribution) return undefined;
    void load();
    return () => {
      // Invalidate any in-flight request when the range/refresh changes or the component unmounts.
      requestSequenceRef.current += 1;
    };
  }, [load, refreshKey, showAttribution]);

  const analysis = useMemo(() => {
    const byChannel = new Map<string, ChannelSummary>();
    const byLanding = new Map<string, { page: string; count: number; demoCreatedCount: number; enrolledCount: number }>();
    let attributedCount = 0;
    let demoCreatedCount = 0;
    let enrolledCount = 0;

    rows.forEach((lead) => {
      const resolved = resolveChannel(lead);
      const landingPage = resolveLandingPage(lead);
      const demoCreated = hasLeadDemoCreatedMilestone(lead);
      const enrolled = hasLeadEnrolledMilestone(lead);

      if (hasAttributionEvidence(lead)) attributedCount += 1;
      if (demoCreated) demoCreatedCount += 1;
      if (enrolled) enrolledCount += 1;

      const channelBucket = byChannel.get(resolved.channel) || {
        channel: resolved.channel,
        label: resolved.label,
        count: 0,
        demoCreatedCount: 0,
        enrolledCount: 0,
      };
      channelBucket.count += 1;
      if (demoCreated) channelBucket.demoCreatedCount += 1;
      if (enrolled) channelBucket.enrolledCount += 1;
      byChannel.set(resolved.channel, channelBucket);

      const landingBucket = byLanding.get(landingPage) || {
        page: landingPage,
        count: 0,
        demoCreatedCount: 0,
        enrolledCount: 0,
      };
      landingBucket.count += 1;
      if (demoCreated) landingBucket.demoCreatedCount += 1;
      if (enrolled) landingBucket.enrolledCount += 1;
      byLanding.set(landingPage, landingBucket);
    });

    const channelRows = Array.from(byChannel.values()).sort((a, b) => b.count - a.count);
    const landingRows = Array.from(byLanding.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const organicCount = channelRows
      .filter((row) => row.channel === 'google_organic' || row.channel === 'bing_organic')
      .reduce((sum, row) => sum + row.count, 0);
    const paidCount = channelRows
      .filter((row) => row.channel === 'google_ads' || row.channel === 'microsoft_ads')
      .reduce((sum, row) => sum + row.count, 0);
    const socialCount = channelRows
      .filter((row) => ['instagram', 'facebook', 'linkedin', 'youtube'].includes(row.channel))
      .reduce((sum, row) => sum + row.count, 0);

    return {
      total: rows.length,
      attributedCount,
      demoCreatedCount,
      enrolledCount,
      organicCount,
      paidCount,
      socialCount,
      channelRows,
      landingRows,
    };
  }, [rows]);

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

  return (
    <div className="space-y-4">
      {showFunnel ? (
        <section aria-labelledby="growth-admissions-heading" className="space-y-3">
          <div>
            <h2 id="growth-admissions-heading" className="text-lg font-semibold text-slate-950">Growth &amp; Admissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lead conversion performance and current demo workload.
            </p>
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
              <h3 className="text-base font-semibold">Marketing Attribution</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                First-touch lead attribution by acquisition channel and lead-origin landing page. This is not a total website-traffic report.
              </p>
              {controlledRange ? (
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  {analyticsCohortDescription(startDateKey, endDateKey)}
                </p>
              ) : null}
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
              <Button type="button" size="sm" variant="outline" onClick={() => setRefreshKey((v) => v + 1)}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{ANALYTICS_GRAIN_LABELS.leadCohort}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">First-touch attribution</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Not total page traffic</span>
          </div>

          {error ? (
            <div role="status" className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error} Metrics are shown as unavailable rather than zero so a read failure cannot look like real performance.
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Leads', analysis.total],
              ['Attribution coverage', `${analysis.attributedCount} (${pct(analysis.attributedCount, analysis.total)})`],
              [ANALYTICS_METRIC_LABELS.demoCreated, `${analysis.demoCreatedCount} (${pct(analysis.demoCreatedCount, analysis.total)})`],
              [ANALYTICS_METRIC_LABELS.enrolled, `${analysis.enrolledCount} (${pct(analysis.enrolledCount, analysis.total)})`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold">{renderMetricValue(value)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2.5 py-1">Organic {renderMetricValue(`${analysis.organicCount} (${pct(analysis.organicCount, analysis.total)})`)}</span>
            <span className="rounded-full border px-2.5 py-1">Paid {renderMetricValue(`${analysis.paidCount} (${pct(analysis.paidCount, analysis.total)})`)}</span>
            <span className="rounded-full border px-2.5 py-1">Social {renderMetricValue(`${analysis.socialCount} (${pct(analysis.socialCount, analysis.total)})`)}</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border">
              <div className="border-b px-3 py-2 text-sm font-semibold">Acquisition channels</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Channel</th>
                    <th className="p-2 text-right">Leads</th>
                    <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
                    <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
                    <th className="p-2 text-right">Lead → Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.channelRows.length === 0 ? (
                    <tr><td className="p-3 text-muted-foreground" colSpan={5}>{unavailableMessage || 'No leads in this period.'}</td></tr>
                  ) : (
                    analysis.channelRows.map((row) => (
                      <tr key={row.channel} className="border-b last:border-b-0">
                        <td className="p-2 font-medium">{row.label}</td>
                        <td className="p-2 text-right">{row.count}</td>
                        <td className="p-2 text-right">{row.demoCreatedCount}</td>
                        <td className="p-2 text-right">{row.enrolledCount}</td>
                        <td className="p-2 text-right font-semibold">{pct(row.enrolledCount, row.count)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <div className="border-b px-3 py-2">
                <div className="text-sm font-semibold">Top lead-origin landing pages</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Pages where attributed leads first entered; this does not rank pages by total visits.</div>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Landing page</th>
                    <th className="p-2 text-right">Leads</th>
                    <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.demoCreated}</th>
                    <th className="p-2 text-right">{ANALYTICS_METRIC_LABELS.enrolled}</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.landingRows.length === 0 ? (
                    <tr><td className="p-3 text-muted-foreground" colSpan={4}>{unavailableMessage || 'No landing-page data yet.'}</td></tr>
                  ) : (
                    analysis.landingRows.map((row) => (
                      <tr key={row.page} className="border-b last:border-b-0">
                        <td className="max-w-[300px] truncate p-2 font-mono text-xs" title={row.page}>{row.page}</td>
                        <td className="p-2 text-right">{row.count}</td>
                        <td className="p-2 text-right">{row.demoCreatedCount}</td>
                        <td className="p-2 text-right">{row.enrolledCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Older leads without stored first-touch data remain labelled legacy/unattributed rather than being guessed as direct traffic.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
