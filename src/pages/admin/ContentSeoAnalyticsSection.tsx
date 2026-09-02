import React, { useCallback, useMemo, useState } from 'react';
import { collection, query, Timestamp, where } from 'firebase/firestore';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { db } from '../../lib/firebaseConfig';
import { getDocsLogged } from '../../lib/firestoreReadLogging';
import {
  loadExternalTrafficAnalytics,
  type ExternalTrafficAnalyticsResponse,
  type ExternalTrafficPeriod,
} from '../../lib/externalTrafficAnalytics';
import {
  aggregateBlogLeadAttribution,
  type BlogAttributionLead,
  type BlogLeadAttributionSummary,
} from './blogLeadAttributionAnalytics';
import {
  dateKeyInRange,
  leadReceivedDateKey,
  previousEqualLengthRange,
} from './leadFunnelAnalytics';
import {
  buildContentSeoArticleRows,
  summarizeBlogTraffic,
  summarizeContentSeoSignals,
  type ContentSeoArticleRow,
  type ContentSeoSignal,
} from './contentSeoAnalytics';

export type ContentSeoAnalyticsSectionProps = {
  startDateKey?: string;
  endDateKey?: string;
};

type ContentSeoLead = BlogAttributionLead & {
  receivedAt?: unknown;
  requestedAt?: unknown;
  createdAt?: unknown;
  archived?: boolean;
};

type FilterKey = 'all' | 'winners' | 'decliners' | 'ctr' | 'converting' | 'unmeasured';

const EMPTY_BLOG_SUMMARY: BlogLeadAttributionSummary = {
  uniqueBlogLeadCount: 0,
  firstTouchBlogLeadCount: 0,
  influencedBlogLeadCount: 0,
  crossArticleJourneyCount: 0,
  demoCreatedCount: 0,
  demoCompletedCount: 0,
  enrolledCount: 0,
  articleRows: [],
};

const SIGNAL_LABELS: Record<ContentSeoSignal, string> = {
  converting: 'Converting',
  emerging: 'New visibility',
  traffic_rising: 'Traffic rising',
  traffic_declining: 'Traffic declining',
  visibility_rising: 'Search visibility rising',
  visibility_declining: 'Search visibility declining',
  ctr_opportunity: 'CTR opportunity',
  ranking_gain: 'Ranking gain',
  ranking_decline: 'Ranking decline',
  stable: 'Stable',
  no_measurement: 'No measured activity',
};

const formatNumber = (value: number): string => Math.round(value).toLocaleString('en-IN');
const formatPct = (value: number | null): string => value == null || !Number.isFinite(value) ? '—' : `${value.toFixed(1)}%`;
const formatPosition = (value: number | null): string => value == null || !Number.isFinite(value) ? '—' : value.toFixed(1);

const percentDeltaLabel = (current: number, previous: number, delta: number | null): string => {
  if (previous <= 0) return current > 0 ? 'new vs prior' : '—';
  if (delta == null) return '—';
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs prior`;
};

const countDeltaLabel = (current: number, previous: number): string => {
  const delta = current - previous;
  if (delta === 0) return 'no change';
  return `${delta > 0 ? '+' : ''}${delta} vs prior`;
};

const pointDeltaLabel = (value: number | null): string =>
  value == null || !Number.isFinite(value) ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(1)} pp vs prior`;

const positionDeltaLabel = (value: number | null): string => {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) < 0.05) return 'no change';
  return value > 0 ? `↑ ${value.toFixed(1)} positions` : `↓ ${Math.abs(value).toFixed(1)} positions`;
};

const humanizeSlug = (slug: string): string =>
  slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const istBoundaryDate = (dateKey: string, endOfDay = false): Date =>
  new Date(`${dateKey}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+05:30`);

const loadLeadCohort = async (startKey: string, endKey: string, label: string): Promise<ContentSeoLead[]> => {
  const start = istBoundaryDate(startKey);
  const end = istBoundaryDate(endKey, true);
  const timestampFields = ['receivedAt', 'requestedAt', 'createdAt'] as const;
  const snapshots = await Promise.all(timestampFields.map((field, index) =>
    getDocsLogged(
      index === 0 ? label : `${label}:${field}`,
      query(
        collection(db, 'leads'),
        where(field, '>=', Timestamp.fromDate(start)),
        where(field, '<=', Timestamp.fromDate(end)),
      ),
      { source: 'src/pages/admin/ContentSeoAnalyticsSection.tsx' },
    )
  ));
  const deduped = new Map<string, ContentSeoLead>();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((document) => {
    deduped.set(document.id, { id: document.id, ...(document.data() as Omit<ContentSeoLead, 'id'>) });
  }));
  return Array.from(deduped.values()).filter((lead) =>
    lead.archived !== true && dateKeyInRange(leadReceivedDateKey(lead), startKey, endKey));
};

const loadBlogInventory = async (): Promise<string[]> => {
  const response = await fetch('/sitemap-blog.xml', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Blog sitemap returned HTTP ${response.status}.`);
  const xml = await response.text();
  const slugs = new Set<string>();
  const pattern = /<loc>https?:\/\/[^<]+\/blog\/([^<]+)<\/loc>/gi;
  for (const match of xml.matchAll(pattern)) {
    const raw = String(match[1] || '').split(/[?#]/)[0].replace(/\/+$/, '');
    if (!raw || raw.includes('/')) continue;
    try {
      slugs.add(decodeURIComponent(raw));
    } catch {
      slugs.add(raw);
    }
  }
  return Array.from(slugs);
};

const providerPeriodComplete = (period: ExternalTrafficPeriod, provider: 'ga4' | 'gsc'): boolean => {
  const metrics = period[provider];
  return metrics.coverageDays === period.expectedDays && metrics.partialDays === 0 && metrics.truncatedDays === 0;
};

const rowMatchesFilter = (row: ContentSeoArticleRow, filter: FilterKey): boolean => {
  if (filter === 'all') return true;
  if (filter === 'winners') return row.signals.some((signal) =>
    ['traffic_rising', 'visibility_rising', 'ranking_gain'].includes(signal));
  if (filter === 'decliners') return row.signals.some((signal) =>
    ['traffic_declining', 'visibility_declining', 'ranking_decline'].includes(signal));
  if (filter === 'ctr') return row.signals.includes('ctr_opportunity');
  if (filter === 'converting') return row.signals.includes('converting');
  return row.signals.includes('no_measurement');
};

const MetricCell = ({ value, delta, available = true }: { value: string; delta: string; available?: boolean }) => (
  <div className="text-right">
    <div className="font-medium tabular-nums text-slate-900">{available ? value : '—'}</div>
    <div className="mt-0.5 text-[10px] text-muted-foreground">{available ? delta : 'Unavailable'}</div>
  </div>
);

export default function ContentSeoAnalyticsSection({
  startDateKey,
  endDateKey,
}: ContentSeoAnalyticsSectionProps): JSX.Element {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trafficData, setTrafficData] = useState<ExternalTrafficAnalyticsResponse | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<BlogLeadAttributionSummary>(EMPTY_BLOG_SUMMARY);
  const [previousBusiness, setPreviousBusiness] = useState<BlogLeadAttributionSummary>(EMPTY_BLOG_SUMMARY);
  const [inventorySlugs, setInventorySlugs] = useState<string[]>([]);
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');

  const hasRange = Boolean(startDateKey && endDateKey);
  const previousRange = useMemo(
    () => previousEqualLengthRange(startDateKey || '', endDateKey || ''),
    [endDateKey, startDateKey],
  );

  const load = useCallback(async () => {
    if (!startDateKey || !endDateKey || !previousRange.startKey || !previousRange.endKey) return;
    setLoading(true);
    setTrafficError(null);
    setBusinessError(null);
    setInventoryError(null);

    const [trafficResult, currentLeadsResult, previousLeadsResult, inventoryResult] = await Promise.allSettled([
      loadExternalTrafficAnalytics(startDateKey, endDateKey),
      loadLeadCohort(startDateKey, endDateKey, `ContentSeo:current:${startDateKey}:${endDateKey}`),
      loadLeadCohort(previousRange.startKey, previousRange.endKey, `ContentSeo:previous:${previousRange.startKey}:${previousRange.endKey}`),
      loadBlogInventory(),
    ]);

    if (trafficResult.status === 'fulfilled') {
      setTrafficData(trafficResult.value);
    } else {
      setTrafficData(null);
      setTrafficError(trafficResult.reason instanceof Error ? trafficResult.reason.message : 'Traffic/search cache could not be loaded.');
    }

    if (currentLeadsResult.status === 'fulfilled' && previousLeadsResult.status === 'fulfilled') {
      setCurrentBusiness(aggregateBlogLeadAttribution(currentLeadsResult.value));
      setPreviousBusiness(aggregateBlogLeadAttribution(previousLeadsResult.value));
    } else {
      setCurrentBusiness(EMPTY_BLOG_SUMMARY);
      setPreviousBusiness(EMPTY_BLOG_SUMMARY);
      const reason = currentLeadsResult.status === 'rejected'
        ? currentLeadsResult.reason
        : previousLeadsResult.status === 'rejected' ? previousLeadsResult.reason : null;
      setBusinessError(reason instanceof Error ? reason.message : 'Blog business attribution could not be loaded.');
    }

    if (inventoryResult.status === 'fulfilled') {
      setInventorySlugs(inventoryResult.value);
    } else {
      setInventorySlugs([]);
      setInventoryError(inventoryResult.reason instanceof Error ? inventoryResult.reason.message : 'Blog inventory could not be loaded.');
    }
    setLoading(false);
  }, [endDateKey, previousRange.endKey, previousRange.startKey, startDateKey]);

  const openAnalysis = () => {
    setOpened(true);
    if (!trafficData && !loading) void load();
  };

  const rows = useMemo(() => {
    if (!trafficData) return [];
    return buildContentSeoArticleRows(
      trafficData.current,
      trafficData.previous,
      currentBusiness,
      previousBusiness,
      inventorySlugs,
    );
  }, [currentBusiness, inventorySlugs, previousBusiness, trafficData]);

  const visibleRows = useMemo(() => rows.filter((row) => rowMatchesFilter(row, filter)), [filter, rows]);
  const signals = useMemo(() => summarizeContentSeoSignals(rows), [rows]);
  const currentTraffic = useMemo(() => summarizeBlogTraffic(rows, 'current'), [rows]);
  const previousTraffic = useMemo(() => summarizeBlogTraffic(rows, 'previous'), [rows]);

  const ga4Configured = Boolean(trafficData?.configuration.ga4Configured);
  const gscConfigured = Boolean(trafficData?.configuration.gscConfigured);
  const ga4Available = Boolean(trafficData && ga4Configured && trafficData.current.ga4.coverageDays > 0);
  const gscAvailable = Boolean(trafficData && gscConfigured && trafficData.current.gsc.coverageDays > 0);
  const businessAvailable = !businessError && !loading;
  const comparisonProvisional = Boolean(trafficData && (
    (ga4Configured && (!providerPeriodComplete(trafficData.current, 'ga4') || !providerPeriodComplete(trafficData.previous, 'ga4'))) ||
    (gscConfigured && (!providerPeriodComplete(trafficData.current, 'gsc') || !providerPeriodComplete(trafficData.previous, 'gsc')))
  ));

  return (
    <Card className="border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">Content &amp; SEO Analytics</h3>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Brick 7</span>
          </div>
          <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
            Compare blog traffic and Google Search performance with the immediately preceding equal-length period, then view explicit blog-attributed leads, demo completion and enrollment beside those metrics without treating them as the same event grain.
          </p>
        </div>
        <div className="flex gap-2">
          {opened ? (
            <Button type="button" size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
              {loading ? 'Refreshing…' : 'Refresh analysis'}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant={opened ? 'outline' : 'default'} disabled={!hasRange} onClick={() => opened ? setOpened(false) : openAnalysis()}>
            {opened ? 'Close' : 'Open Content & SEO'}
          </Button>
        </div>
      </div>

      {!opened ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-xs leading-5 text-slate-600">
          This specialist view is lazy. It does not issue its bounded current/previous lead-cohort reads until an admin opens it. The public blog sitemap is used as the article inventory so published blogs with zero measured activity can still appear after loading.
        </div>
      ) : null}

      {opened ? (
        <div className="mt-4 space-y-4">
          {loading && !trafficData ? (
            <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
              Loading current and previous traffic/search read models plus bounded blog lead cohorts…
            </div>
          ) : null}

          {trafficError || businessError ? (
            <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              {trafficError ? `Traffic/search unavailable: ${trafficError} ` : ''}
              {businessError ? `Business attribution unavailable: ${businessError}` : ''}
              Missing sources stay unavailable instead of being converted to believable zeroes.
            </div>
          ) : null}
          {inventoryError ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Blog sitemap inventory could not be loaded ({inventoryError}). Measured or attributed blog pages are still shown.
            </div>
          ) : null}
          {comparisonProvisional ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Current-vs-prior signals are provisional because at least one configured provider has partial, truncated or missing day coverage. The underlying values remain visible, but do not treat a provisional winner/decliner label as final.
            </div>
          ) : null}

          {trafficData ? (
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Current: {trafficData.current.startDateKey} → {trafficData.current.endDateKey}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">Previous: {trafficData.previous.startDateKey} → {trafficData.previous.endDateKey}</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{inventorySlugs.length || rows.length} blog pages in inventory</span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <MetricCell value={formatNumber(currentTraffic.sessions)} delta={percentDeltaLabel(currentTraffic.sessions, previousTraffic.sessions, previousTraffic.sessions > 0 ? ((currentTraffic.sessions - previousTraffic.sessions) / previousTraffic.sessions) * 100 : null)} available={ga4Available} />
            <MetricCell value={formatNumber(currentTraffic.clicks)} delta={percentDeltaLabel(currentTraffic.clicks, previousTraffic.clicks, previousTraffic.clicks > 0 ? ((currentTraffic.clicks - previousTraffic.clicks) / previousTraffic.clicks) * 100 : null)} available={gscAvailable} />
            <MetricCell value={formatNumber(currentTraffic.impressions)} delta={percentDeltaLabel(currentTraffic.impressions, previousTraffic.impressions, previousTraffic.impressions > 0 ? ((currentTraffic.impressions - previousTraffic.impressions) / previousTraffic.impressions) * 100 : null)} available={gscAvailable} />
            <MetricCell value={formatPct(currentTraffic.ctrPct)} delta={pointDeltaLabel(currentTraffic.ctrPct != null && previousTraffic.ctrPct != null ? currentTraffic.ctrPct - previousTraffic.ctrPct : null)} available={gscAvailable} />
            <MetricCell value={String(currentBusiness.uniqueBlogLeadCount)} delta={countDeltaLabel(currentBusiness.uniqueBlogLeadCount, previousBusiness.uniqueBlogLeadCount)} available={businessAvailable} />
            <MetricCell value={String(currentBusiness.demoCompletedCount)} delta={countDeltaLabel(currentBusiness.demoCompletedCount, previousBusiness.demoCompletedCount)} available={businessAvailable} />
            <MetricCell value={String(currentBusiness.enrolledCount)} delta={countDeltaLabel(currentBusiness.enrolledCount, previousBusiness.enrolledCount)} available={businessAvailable} />
            <MetricCell value={formatPosition(currentTraffic.averagePosition)} delta={positionDeltaLabel(currentTraffic.averagePosition != null && previousTraffic.averagePosition != null ? previousTraffic.averagePosition - currentTraffic.averagePosition : null)} available={gscAvailable} />
          </div>
          <div className="-mt-2 grid grid-cols-2 gap-3 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid-cols-4 xl:grid-cols-8">
            <span>Blog sessions</span><span>GSC clicks</span><span>Impressions</span><span>CTR</span><span>Attributed leads</span><span>Demo completed</span><span>Enrolled</span><span>Avg position</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ['all', `All ${rows.length}`],
              ['winners', `Winners ${signals.winners}`],
              ['decliners', `Decliners ${signals.decliners}`],
              ['ctr', `CTR opportunities ${signals.ctrOpportunities}`],
              ['converting', `Converting ${signals.converting}`],
              ['unmeasured', `No measured activity ${signals.noMeasurement}`],
            ] as Array<[FilterKey, string]>).map(([key, label]) => (
              <Button key={key} type="button" size="sm" variant={filter === key ? 'default' : 'outline'} onClick={() => setFilter(key)}>
                {label}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1380px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs text-muted-foreground">
                  <th className="p-2">Blog article</th>
                  <th className="p-2">Signals</th>
                  <th className="p-2 text-right">Sessions</th>
                  <th className="p-2 text-right">GSC clicks</th>
                  <th className="p-2 text-right">Impressions</th>
                  <th className="p-2 text-right">CTR</th>
                  <th className="p-2 text-right">Avg position</th>
                  <th className="p-2 text-right">Attributed leads</th>
                  <th className="p-2 text-right">Demo completed</th>
                  <th className="p-2 text-right">Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={10}>{loading ? 'Loading Content & SEO analytics…' : 'No blog articles match this filter.'}</td></tr>
                ) : visibleRows.map((row) => (
                  <tr key={row.slug} className="border-b last:border-b-0 align-top">
                    <td className="max-w-[340px] p-2">
                      <a href={row.path} target="_blank" rel="noreferrer" className="font-medium text-slate-950 underline decoration-slate-300 underline-offset-2">
                        {humanizeSlug(row.slug)}
                      </a>
                      <div className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground" title={row.path}>{row.path}</div>
                    </td>
                    <td className="max-w-[260px] p-2">
                      <div className="flex flex-wrap gap-1">
                        {row.signals.map((signal) => (
                          <span key={signal} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">{SIGNAL_LABELS[signal]}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2"><MetricCell value={formatNumber(row.current.sessions)} delta={percentDeltaLabel(row.current.sessions, row.previous.sessions, row.sessionChangePct)} available={ga4Available} /></td>
                    <td className="p-2"><MetricCell value={formatNumber(row.current.clicks)} delta={percentDeltaLabel(row.current.clicks, row.previous.clicks, row.clickChangePct)} available={gscAvailable} /></td>
                    <td className="p-2"><MetricCell value={formatNumber(row.current.impressions)} delta={percentDeltaLabel(row.current.impressions, row.previous.impressions, row.impressionChangePct)} available={gscAvailable} /></td>
                    <td className="p-2"><MetricCell value={formatPct(row.ctrCurrentPct)} delta={pointDeltaLabel(row.ctrDeltaPoints)} available={gscAvailable} /></td>
                    <td className="p-2"><MetricCell value={formatPosition(row.current.averagePosition)} delta={positionDeltaLabel(row.positionImprovement)} available={gscAvailable} /></td>
                    <td className="p-2"><MetricCell value={String(row.current.leads)} delta={countDeltaLabel(row.current.leads, row.previous.leads)} available={businessAvailable} /></td>
                    <td className="p-2"><MetricCell value={String(row.current.demoCompleted)} delta={countDeltaLabel(row.current.demoCompleted, row.previous.demoCompleted)} available={businessAvailable} /></td>
                    <td className="p-2"><MetricCell value={String(row.current.enrolled)} delta={countDeltaLabel(row.current.enrolled, row.previous.enrolled)} available={businessAvailable} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3 text-[11px] leading-5 text-slate-600">
            <span className="font-semibold text-slate-800">Signal rules:</span> traffic/visibility changes require at least ±20%; ranking changes require at least one position; CTR opportunity requires at least 100 current impressions and a ≥0.5 percentage-point CTR decline. Low-volume safeguards prevent tiny changes from being promoted as management signals. “Converting” means at least one explicitly attributed enrolled lead in the selected lead cohort.
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            No session-to-lead or click-to-lead conversion rate is calculated here. GA4 sessions, Search Console clicks and Firestore lead attribution have different identity and attribution models, so Brick 7 places them side-by-side for diagnosis without pretending they form one event-level funnel.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
