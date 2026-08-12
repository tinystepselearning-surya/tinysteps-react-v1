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
  demoCount: number;
  admittedCount: number;
};

interface LeadSourceAnalysisProps {
  startDateKey?: string;
  endDateKey?: string;
  showFunnel?: boolean;
  showAttribution?: boolean;
}

const RANGE_OPTIONS = [7, 30, 90] as const;

const normalize = (value: unknown): string => String(value || '').trim();

const isDemoReached = (lead: LeadRow): boolean => {
  if (normalize(lead.demoSessionId)) return true;
  return [
    'demo_pending_schedule',
    'demo_booked',
    'demo_completed',
    'admission_follow_up',
    'admitted_confirmed',
  ].includes(normalize(lead.status).toLowerCase());
};

const isAdmitted = (lead: LeadRow): boolean => normalize(lead.status).toLowerCase() === 'admitted_confirmed';

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

    let queryRef;
    let label: string;

    if (controlledRange && startDateKey && endDateKey) {
      const start = istBoundaryDate(startDateKey);
      const end = istBoundaryDate(endDateKey, true);
      queryRef = query(
        collection(db, 'leads'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
      );
      label = `LeadSourceAnalysis:${startDateKey}:${endDateKey}`;
    } else {
      const start = new Date();
      start.setDate(start.getDate() - rangeDays);
      start.setHours(0, 0, 0, 0);
      queryRef = query(collection(db, 'leads'), where('createdAt', '>=', Timestamp.fromDate(start)));
      label = `LeadSourceAnalysis:${rangeDays}d`;
    }

    try {
      const snap = await getDocsLogged(label, queryRef, {
        source: 'src/pages/admin/LeadSourceAnalysis.tsx',
      });
      if (requestSequenceRef.current !== requestSequence) return;
      setRows(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<LeadRow, 'id'>) }))
          .filter((lead) => !(lead as LeadRow & { archived?: boolean }).archived),
      );
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
    const byLanding = new Map<string, { page: string; count: number; demoCount: number; admittedCount: number }>();
    let attributedCount = 0;
    let demoCount = 0;
    let admittedCount = 0;

    rows.forEach((lead) => {
      const resolved = resolveChannel(lead);
      const landingPage = resolveLandingPage(lead);
      const reachedDemo = isDemoReached(lead);
      const admitted = isAdmitted(lead);

      if (hasAttributionEvidence(lead)) attributedCount += 1;
      if (reachedDemo) demoCount += 1;
      if (admitted) admittedCount += 1;

      const channelBucket = byChannel.get(resolved.channel) || {
        channel: resolved.channel,
        label: resolved.label,
        count: 0,
        demoCount: 0,
        admittedCount: 0,
      };
      channelBucket.count += 1;
      if (reachedDemo) channelBucket.demoCount += 1;
      if (admitted) channelBucket.admittedCount += 1;
      byChannel.set(resolved.channel, channelBucket);

      const landingBucket = byLanding.get(landingPage) || {
        page: landingPage,
        count: 0,
        demoCount: 0,
        admittedCount: 0,
      };
      landingBucket.count += 1;
      if (reachedDemo) landingBucket.demoCount += 1;
      if (admitted) landingBucket.admittedCount += 1;
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
      demoCount,
      admittedCount,
      organicCount,
      paidCount,
      socialCount,
      channelRows,
      landingRows,
    };
  }, [rows]);

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
                First-touch acquisition, landing pages, demo progression and admissions from website enquiries.
              </p>
              {controlledRange ? (
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Reporting period: {startDateKey} to {endDateKey} · Asia/Kolkata
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

          {error ? (
            <div role="status" className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Leads', analysis.total],
              ['Attribution coverage', `${analysis.attributedCount} (${pct(analysis.attributedCount, analysis.total)})`],
              ['Reached demo', `${analysis.demoCount} (${pct(analysis.demoCount, analysis.total)})`],
              ['Admitted', `${analysis.admittedCount} (${pct(analysis.admittedCount, analysis.total)})`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold">{loading ? '…' : value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2.5 py-1">Organic {loading ? '…' : `${analysis.organicCount} (${pct(analysis.organicCount, analysis.total)})`}</span>
            <span className="rounded-full border px-2.5 py-1">Paid {loading ? '…' : `${analysis.paidCount} (${pct(analysis.paidCount, analysis.total)})`}</span>
            <span className="rounded-full border px-2.5 py-1">Social {loading ? '…' : `${analysis.socialCount} (${pct(analysis.socialCount, analysis.total)})`}</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border">
              <div className="border-b px-3 py-2 text-sm font-semibold">Acquisition channels</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Channel</th>
                    <th className="p-2 text-right">Leads</th>
                    <th className="p-2 text-right">Demo</th>
                    <th className="p-2 text-right">Admitted</th>
                    <th className="p-2 text-right">Lead → admitted</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.channelRows.length === 0 ? (
                    <tr><td className="p-3 text-muted-foreground" colSpan={5}>{loading ? 'Loading…' : 'No leads in this period.'}</td></tr>
                  ) : (
                    analysis.channelRows.map((row) => (
                      <tr key={row.channel} className="border-b last:border-b-0">
                        <td className="p-2 font-medium">{row.label}</td>
                        <td className="p-2 text-right">{row.count}</td>
                        <td className="p-2 text-right">{row.demoCount}</td>
                        <td className="p-2 text-right">{row.admittedCount}</td>
                        <td className="p-2 text-right font-semibold">{pct(row.admittedCount, row.count)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <div className="border-b px-3 py-2 text-sm font-semibold">Top first landing pages</div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-2">Landing page</th>
                    <th className="p-2 text-right">Leads</th>
                    <th className="p-2 text-right">Demo</th>
                    <th className="p-2 text-right">Admitted</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.landingRows.length === 0 ? (
                    <tr><td className="p-3 text-muted-foreground" colSpan={4}>{loading ? 'Loading…' : 'No landing-page data yet.'}</td></tr>
                  ) : (
                    analysis.landingRows.map((row) => (
                      <tr key={row.page} className="border-b last:border-b-0">
                        <td className="max-w-[300px] truncate p-2 font-mono text-xs" title={row.page}>{row.page}</td>
                        <td className="p-2 text-right">{row.count}</td>
                        <td className="p-2 text-right">{row.demoCount}</td>
                        <td className="p-2 text-right">{row.admittedCount}</td>
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
