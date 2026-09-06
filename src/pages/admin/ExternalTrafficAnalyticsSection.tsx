import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import {
  loadExternalTrafficAnalytics,
  syncExternalTrafficAnalytics,
  type ExternalTrafficAnalyticsResponse,
  type ExternalTrafficPeriod,
  type ExternalTrafficProviderStatus,
} from '../../lib/externalTrafficAnalytics';

export type ExternalTrafficAnalyticsSectionProps = {
  startDateKey?: string;
  endDateKey?: string;
};

const formatNumber = (value: number): string => Math.round(value).toLocaleString('en-IN');
const pct = (part: number, total: number): string =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0.0%';
const formatPosition = (value: number | null): string =>
  value == null || !Number.isFinite(value) ? '—' : value.toFixed(1);

const providerStatusLabel = (
  configured: boolean,
  status: ExternalTrafficProviderStatus | undefined,
): string => {
  if (!configured) return 'Not configured';
  if (!status?.status) return 'Configured · no sync status yet';
  if (status.status === 'ok') return 'Connected';
  if (status.status === 'credential_error') return 'Credential setup required';
  if (status.status === 'error') return 'Sync error';
  return 'Not configured';
};

const coverageLabel = (
  configured: boolean,
  period: ExternalTrafficPeriod,
  provider: 'ga4' | 'gsc',
): string => {
  if (!configured) return 'Unavailable until configured';
  const metrics = period[provider];
  const warnings = [
    metrics.partialDays > 0 ? `${metrics.partialDays} partial` : '',
    metrics.truncatedDays > 0 ? `${metrics.truncatedDays} truncated` : '',
  ].filter(Boolean);
  const suffix = warnings.length ? ` · ${warnings.join(' · ')}` : '';
  return `${metrics.coverageDays}/${period.expectedDays} synced days${suffix}`;
};

const MetricCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) => (
  <Card className="border-slate-200 bg-white p-3 shadow-none">
    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{value}</div>
    <div className="mt-1 text-[11px] leading-4 text-muted-foreground">{sub}</div>
  </Card>
);

const safeMetric = (available: boolean, value: string): string => available ? value : '—';

export default function ExternalTrafficAnalyticsSection({
  startDateKey,
  endDateKey,
}: ExternalTrafficAnalyticsSectionProps): JSX.Element {
  const [data, setData] = useState<ExternalTrafficAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const hasRange = Boolean(startDateKey && endDateKey);

  const load = useCallback(async () => {
    if (!startDateKey || !endDateKey) return;
    setLoading(true);
    setError(null);
    try {
      const response = await loadExternalTrafficAnalytics(startDateKey, endDateKey);
      setData(response);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Could not load external traffic analytics.');
    } finally {
      setLoading(false);
    }
  }, [endDateKey, startDateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSync = async () => {
    if (!startDateKey || !endDateKey || syncing) return;
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const result = await syncExternalTrafficAnalytics(startDateKey, endDateKey);
      const providerSummary = [
        `GA4: ${result.providers.ga4.status || 'unknown'}`,
        `GSC: ${result.providers.gsc.status || 'unknown'}`,
      ].join(' · ');
      setSyncMessage(`Sync finished · ${providerSummary}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync external traffic analytics.');
    } finally {
      setSyncing(false);
    }
  };

  const current = data?.current;
  const ga4Configured = Boolean(data?.configuration.ga4Configured);
  const gscConfigured = Boolean(data?.configuration.gscConfigured);
  const ga4Available = Boolean(current && ga4Configured && current.ga4.coverageDays > 0);
  const gscAvailable = Boolean(current && gscConfigured && current.gsc.coverageDays > 0);
  const ga4Status = data?.sync?.providers?.ga4;
  const gscStatus = data?.sync?.providers?.gsc;

  const topPages = useMemo(() => current?.pages.slice(0, 20) || [], [current]);
  const canSync = hasRange && Boolean(data && (ga4Configured || gscConfigured));
  const setupRequired = Boolean(data && !ga4Configured && !gscConfigured);

  return (
    <section aria-labelledby="external-traffic-heading" className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="external-traffic-heading" className="text-lg font-semibold text-slate-950">
            Brick 6 · Traffic &amp; Search
          </h3>
          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Server-side GA4 and Google Search Console read models for the selected reporting period. GA4 sessions and Search Console clicks are separate measurements and are never treated as the same event.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={!hasRange || loading || syncing}>
            {loading ? 'Loading…' : 'Reload cache'}
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSync()} disabled={!canSync || loading || syncing}>
            {syncing ? 'Syncing…' : 'Sync selected period'}
          </Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700">
          <span className="font-semibold">GA4 · {providerStatusLabel(ga4Configured, ga4Status)}</span>
          <span className="ml-2 text-muted-foreground">
            {current ? coverageLabel(ga4Configured, current, 'ga4') : 'Loading coverage…'}
          </span>
          {ga4Status?.error ? <div className="mt-1 text-amber-700">{ga4Status.error}</div> : null}
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700">
          <span className="font-semibold">Search Console · {providerStatusLabel(gscConfigured, gscStatus)}</span>
          <span className="ml-2 text-muted-foreground">
            {current ? coverageLabel(gscConfigured, current, 'gsc') : 'Loading coverage…'}
          </span>
          {gscStatus?.error ? <div className="mt-1 text-amber-700">{gscStatus.error}</div> : null}
        </div>
      </div>

      {setupRequired ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
          External analytics is not configured on the server yet. Set <span className="font-mono">GA4_PROPERTY_ID</span> and/or <span className="font-mono">GSC_SITE_URL</span>, then add the dedicated analytics-reader service-account JSON to Secret Manager. No Google credential is shipped to the browser.
        </div>
      ) : null}

      {error ? (
        <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {error} External metrics remain unavailable rather than falling back to believable zeroes.
        </div>
      ) : null}
      {syncMessage ? (
        <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          {syncMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          label="GA4 Sessions"
          value={safeMetric(ga4Available, formatNumber(current?.ga4.sessions || 0))}
          sub="Additive website sessions"
        />
        <MetricCard
          label="Engaged Sessions"
          value={safeMetric(ga4Available, formatNumber(current?.ga4.engagedSessions || 0))}
          sub="GA4 engaged sessions"
        />
        <MetricCard
          label="Engagement Rate"
          value={safeMetric(ga4Available, pct(current?.ga4.engagedSessions || 0, current?.ga4.sessions || 0))}
          sub="Engaged sessions ÷ sessions"
        />
        <MetricCard
          label="GSC Clicks"
          value={safeMetric(gscAvailable, formatNumber(current?.gsc.clicks || 0))}
          sub="Google Search clicks"
        />
        <MetricCard
          label="GSC Impressions"
          value={safeMetric(gscAvailable, formatNumber(current?.gsc.impressions || 0))}
          sub="Google Search impressions"
        />
        <MetricCard
          label="Search CTR"
          value={safeMetric(gscAvailable, pct(current?.gsc.clicks || 0, current?.gsc.impressions || 0))}
          sub="Clicks ÷ impressions"
        />
        <MetricCard
          label="Avg Position"
          value={safeMetric(gscAvailable, formatPosition(current?.gsc.averagePosition ?? null))}
          sub="Impression-weighted page/day position"
        />
      </div>

      <Card className="overflow-hidden border-slate-200 bg-white shadow-none">
        <div className="border-b border-slate-200 px-3 py-2">
          <div className="text-sm font-semibold text-slate-950">Page-level traffic &amp; search read model</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Cached daily page metrics from the two external providers. This table is the data foundation for the Content &amp; SEO analytics brick; it does not join a GSC click directly to a GA4 session or lead.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="p-2">Page</th>
                <th className="p-2 text-right">Sessions</th>
                <th className="p-2 text-right">Engaged</th>
                <th className="p-2 text-right">GSC Clicks</th>
                <th className="p-2 text-right">Impressions</th>
                <th className="p-2 text-right">CTR</th>
                <th className="p-2 text-right">Avg position</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data ? (
                <tr><td className="p-3 text-muted-foreground" colSpan={7}>Loading external analytics cache…</td></tr>
              ) : topPages.length === 0 ? (
                <tr><td className="p-3 text-muted-foreground" colSpan={7}>No synced page-level traffic/search data for this period.</td></tr>
              ) : topPages.map((row) => (
                <tr key={row.path} className="border-b last:border-b-0">
                  <td className="max-w-[420px] truncate p-2 font-mono text-xs" title={row.path}>{row.path}</td>
                  <td className="p-2 text-right">{formatNumber(row.sessions)}</td>
                  <td className="p-2 text-right">{formatNumber(row.engagedSessions)}</td>
                  <td className="p-2 text-right">{formatNumber(row.clicks)}</td>
                  <td className="p-2 text-right">{formatNumber(row.impressions)}</td>
                  <td className="p-2 text-right">{pct(row.clicks, row.impressions)}</td>
                  <td className="p-2 text-right">{formatPosition(row.averagePosition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-[11px] leading-5 text-muted-foreground">
        The scheduled backend refreshes the latest seven days daily so delayed Search Console data can mature without rewriting business attribution. Missing, partial or truncated provider coverage is surfaced explicitly. Cached traffic/search documents are read models only; GA4, Search Console and operational Firestore remain the underlying sources of truth.
      </p>
    </section>
  );
}
