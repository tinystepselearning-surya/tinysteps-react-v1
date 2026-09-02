import type { ExternalTrafficPeriod } from '../../lib/externalTrafficAnalytics';
import {
  blogSlugFromLandingPage,
  type BlogArticleAttributionRow,
  type BlogLeadAttributionSummary,
} from './blogLeadAttributionAnalytics';

export type ContentSeoSignal =
  | 'converting'
  | 'emerging'
  | 'traffic_rising'
  | 'traffic_declining'
  | 'visibility_rising'
  | 'visibility_declining'
  | 'ctr_opportunity'
  | 'ranking_gain'
  | 'ranking_decline'
  | 'stable'
  | 'no_measurement';

export type ContentSeoTrafficMetrics = {
  sessions: number;
  engagedSessions: number;
  clicks: number;
  impressions: number;
  averagePosition: number | null;
};

export type ContentSeoBusinessMetrics = {
  leads: number;
  demoCreated: number;
  demoCompleted: number;
  enrolled: number;
};

export type ContentSeoPeriodMetrics = ContentSeoTrafficMetrics & ContentSeoBusinessMetrics;

export type ContentSeoArticleRow = {
  slug: string;
  path: string;
  current: ContentSeoPeriodMetrics;
  previous: ContentSeoPeriodMetrics;
  sessionChangePct: number | null;
  clickChangePct: number | null;
  impressionChangePct: number | null;
  ctrCurrentPct: number | null;
  ctrPreviousPct: number | null;
  ctrDeltaPoints: number | null;
  positionImprovement: number | null;
  signals: ContentSeoSignal[];
  primarySignal: ContentSeoSignal;
};

export type ContentSeoSignalSummary = {
  winners: number;
  decliners: number;
  ctrOpportunities: number;
  emerging: number;
  converting: number;
  noMeasurement: number;
};

const ZERO_TRAFFIC: ContentSeoTrafficMetrics = {
  sessions: 0,
  engagedSessions: 0,
  clicks: 0,
  impressions: 0,
  averagePosition: null,
};

const ZERO_BUSINESS: ContentSeoBusinessMetrics = {
  leads: 0,
  demoCreated: 0,
  demoCompleted: 0,
  enrolled: 0,
};

const normalizeInventorySlug = (value: string): string | null =>
  blogSlugFromLandingPage(`/blog/${String(value || '').trim()}`);

const percentageChange = (current: number, previous: number): number | null => {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
};

const ctrPercent = (clicks: number, impressions: number): number | null =>
  impressions > 0 ? (clicks / impressions) * 100 : null;

type MutableTraffic = ContentSeoTrafficMetrics & { weightedPositionSum: number };

const trafficByBlogSlug = (period: ExternalTrafficPeriod): Map<string, ContentSeoTrafficMetrics> => {
  const map = new Map<string, MutableTraffic>();
  period.pages.forEach((page) => {
    const slug = blogSlugFromLandingPage(page.path);
    if (!slug) return;
    const bucket = map.get(slug) || { ...ZERO_TRAFFIC, weightedPositionSum: 0 };
    bucket.sessions += Math.max(0, Number(page.sessions) || 0);
    bucket.engagedSessions += Math.max(0, Number(page.engagedSessions) || 0);
    bucket.clicks += Math.max(0, Number(page.clicks) || 0);
    bucket.impressions += Math.max(0, Number(page.impressions) || 0);
    if (page.averagePosition != null && Number.isFinite(page.averagePosition) && page.impressions > 0) {
      bucket.weightedPositionSum += page.averagePosition * page.impressions;
    }
    map.set(slug, bucket);
  });

  return new Map(
    Array.from(map.entries()).map(([slug, bucket]) => [
      slug,
      {
        sessions: bucket.sessions,
        engagedSessions: bucket.engagedSessions,
        clicks: bucket.clicks,
        impressions: bucket.impressions,
        averagePosition: bucket.impressions > 0 && bucket.weightedPositionSum > 0
          ? bucket.weightedPositionSum / bucket.impressions
          : null,
      },
    ]),
  );
};

const businessByBlogSlug = (summary: BlogLeadAttributionSummary): Map<string, ContentSeoBusinessMetrics> =>
  new Map(summary.articleRows.map((row: BlogArticleAttributionRow) => [
    row.slug,
    {
      leads: row.leadCount,
      demoCreated: row.demoCreatedCount,
      demoCompleted: row.demoCompletedCount,
      enrolled: row.enrolledCount,
    },
  ]));

const resolveSignals = (
  current: ContentSeoPeriodMetrics,
  previous: ContentSeoPeriodMetrics,
  sessionChangePct: number | null,
  impressionChangePct: number | null,
  ctrDeltaPoints: number | null,
  positionImprovement: number | null,
): ContentSeoSignal[] => {
  const signals: ContentSeoSignal[] = [];
  const currentMeasured = current.sessions > 0 || current.clicks > 0 || current.impressions > 0 || current.leads > 0;
  const previousMeasured = previous.sessions > 0 || previous.clicks > 0 || previous.impressions > 0 || previous.leads > 0;

  if (!currentMeasured && !previousMeasured) return ['no_measurement'];
  if (current.enrolled > 0) signals.push('converting');
  if (!previousMeasured && currentMeasured) signals.push('emerging');
  if (sessionChangePct != null && sessionChangePct >= 20 && current.sessions >= 5) signals.push('traffic_rising');
  if (sessionChangePct != null && sessionChangePct <= -20 && previous.sessions >= 5) signals.push('traffic_declining');
  if (impressionChangePct != null && impressionChangePct >= 20 && current.impressions >= 50) signals.push('visibility_rising');
  if (impressionChangePct != null && impressionChangePct <= -20 && previous.impressions >= 50) signals.push('visibility_declining');
  if (ctrDeltaPoints != null && ctrDeltaPoints <= -0.5 && current.impressions >= 100) signals.push('ctr_opportunity');
  if (positionImprovement != null && positionImprovement >= 1 && current.impressions >= 20) signals.push('ranking_gain');
  if (positionImprovement != null && positionImprovement <= -1 && previous.impressions >= 20) signals.push('ranking_decline');
  if (signals.length === 0) signals.push('stable');
  return signals;
};

const PRIMARY_SIGNAL_PRIORITY: ContentSeoSignal[] = [
  'converting',
  'traffic_declining',
  'ctr_opportunity',
  'visibility_declining',
  'ranking_decline',
  'traffic_rising',
  'visibility_rising',
  'ranking_gain',
  'emerging',
  'stable',
  'no_measurement',
];

const primarySignal = (signals: ContentSeoSignal[]): ContentSeoSignal =>
  PRIMARY_SIGNAL_PRIORITY.find((signal) => signals.includes(signal)) || 'stable';

const signalSortRank = (signal: ContentSeoSignal): number => {
  const rank = PRIMARY_SIGNAL_PRIORITY.indexOf(signal);
  return rank >= 0 ? rank : PRIMARY_SIGNAL_PRIORITY.length;
};

export const buildContentSeoArticleRows = (
  currentTraffic: ExternalTrafficPeriod,
  previousTraffic: ExternalTrafficPeriod,
  currentBusiness: BlogLeadAttributionSummary,
  previousBusiness: BlogLeadAttributionSummary,
  inventorySlugs: string[] = [],
): ContentSeoArticleRow[] => {
  const currentTrafficBySlug = trafficByBlogSlug(currentTraffic);
  const previousTrafficBySlug = trafficByBlogSlug(previousTraffic);
  const currentBusinessBySlug = businessByBlogSlug(currentBusiness);
  const previousBusinessBySlug = businessByBlogSlug(previousBusiness);
  const slugs = new Set<string>();

  inventorySlugs.forEach((slug) => {
    const normalized = normalizeInventorySlug(slug);
    if (normalized) slugs.add(normalized);
  });
  currentTrafficBySlug.forEach((_value, slug) => slugs.add(slug));
  previousTrafficBySlug.forEach((_value, slug) => slugs.add(slug));
  currentBusinessBySlug.forEach((_value, slug) => slugs.add(slug));
  previousBusinessBySlug.forEach((_value, slug) => slugs.add(slug));

  return Array.from(slugs).map((slug) => {
    const currentTrafficMetrics = currentTrafficBySlug.get(slug) || ZERO_TRAFFIC;
    const previousTrafficMetrics = previousTrafficBySlug.get(slug) || ZERO_TRAFFIC;
    const currentBusinessMetrics = currentBusinessBySlug.get(slug) || ZERO_BUSINESS;
    const previousBusinessMetrics = previousBusinessBySlug.get(slug) || ZERO_BUSINESS;
    const current = { ...currentTrafficMetrics, ...currentBusinessMetrics };
    const previous = { ...previousTrafficMetrics, ...previousBusinessMetrics };
    const sessionChangePct = percentageChange(current.sessions, previous.sessions);
    const clickChangePct = percentageChange(current.clicks, previous.clicks);
    const impressionChangePct = percentageChange(current.impressions, previous.impressions);
    const ctrCurrentPct = ctrPercent(current.clicks, current.impressions);
    const ctrPreviousPct = ctrPercent(previous.clicks, previous.impressions);
    const ctrDeltaPoints = ctrCurrentPct != null && ctrPreviousPct != null
      ? ctrCurrentPct - ctrPreviousPct
      : null;
    const positionImprovement = current.averagePosition != null && previous.averagePosition != null
      ? previous.averagePosition - current.averagePosition
      : null;
    const signals = resolveSignals(
      current,
      previous,
      sessionChangePct,
      impressionChangePct,
      ctrDeltaPoints,
      positionImprovement,
    );

    return {
      slug,
      path: `/blog/${slug}`,
      current,
      previous,
      sessionChangePct,
      clickChangePct,
      impressionChangePct,
      ctrCurrentPct,
      ctrPreviousPct,
      ctrDeltaPoints,
      positionImprovement,
      signals,
      primarySignal: primarySignal(signals),
    };
  }).sort((a, b) =>
    signalSortRank(a.primarySignal) - signalSortRank(b.primarySignal) ||
    b.current.sessions - a.current.sessions ||
    b.current.impressions - a.current.impressions ||
    a.slug.localeCompare(b.slug),
  );
};

export const summarizeContentSeoSignals = (rows: ContentSeoArticleRow[]): ContentSeoSignalSummary => ({
  winners: rows.filter((row) => row.signals.some((signal) =>
    ['traffic_rising', 'visibility_rising', 'ranking_gain'].includes(signal))).length,
  decliners: rows.filter((row) => row.signals.some((signal) =>
    ['traffic_declining', 'visibility_declining', 'ranking_decline'].includes(signal))).length,
  ctrOpportunities: rows.filter((row) => row.signals.includes('ctr_opportunity')).length,
  emerging: rows.filter((row) => row.signals.includes('emerging')).length,
  converting: rows.filter((row) => row.signals.includes('converting')).length,
  noMeasurement: rows.filter((row) => row.signals.includes('no_measurement')).length,
});

export const summarizeBlogTraffic = (rows: ContentSeoArticleRow[], period: 'current' | 'previous') => {
  let sessions = 0;
  let engagedSessions = 0;
  let clicks = 0;
  let impressions = 0;
  let weightedPositionSum = 0;
  rows.forEach((row) => {
    const metrics = row[period];
    sessions += metrics.sessions;
    engagedSessions += metrics.engagedSessions;
    clicks += metrics.clicks;
    impressions += metrics.impressions;
    if (metrics.averagePosition != null && metrics.impressions > 0) {
      weightedPositionSum += metrics.averagePosition * metrics.impressions;
    }
  });
  return {
    sessions,
    engagedSessions,
    clicks,
    impressions,
    ctrPct: impressions > 0 ? (clicks / impressions) * 100 : null,
    averagePosition: impressions > 0 && weightedPositionSum > 0 ? weightedPositionSum / impressions : null,
  };
};
