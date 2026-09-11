import { parseBlogLeadSourceDetail } from '../../lib/blogLeadAttribution';
import { getPublicBlogSlug } from '../../lib/blogWeekRenames.js';
import type { BlogConversionFamily } from '../../content/blog/shared/conversionFamilies';
import {
  hasLeadDemoCompletedMilestone,
  hasLeadDemoCreatedMilestone,
  hasLeadEnrolledMilestone,
} from './analyticsMeasurementContract';

export type BlogAttributionLead = {
  id: string;
  sourceDetail?: string | null;
  landingPage?: string | null;
  demoSessionId?: string | null;
  demoCompletedAt?: unknown;
  status?: string | null;
  attribution?: {
    landingPage?: string | null;
  } | null;
};

export type BlogLeadAttributionCredit = {
  firstTouchSlug: string | null;
  influencedSlug: string | null;
  family: BlogConversionFamily | null;
  ctaPosition: string | null;
};

export type BlogArticleAttributionRow = {
  slug: string;
  leadCount: number;
  firstTouchCount: number;
  influencedCount: number;
  demoCreatedCount: number;
  demoCompletedCount: number;
  enrolledCount: number;
  leadIds: string[];
  familyCounts: Partial<Record<BlogConversionFamily, number>>;
  ctaPositionCounts: Record<string, number>;
};

export type BlogLeadAttributionSummary = {
  uniqueBlogLeadCount: number;
  firstTouchBlogLeadCount: number;
  influencedBlogLeadCount: number;
  crossArticleJourneyCount: number;
  demoCreatedCount: number;
  demoCompletedCount: number;
  enrolledCount: number;
  articleRows: BlogArticleAttributionRow[];
};

type MutableArticleBucket = {
  slug: string;
  leadIds: Set<string>;
  firstTouchLeadIds: Set<string>;
  influencedLeadIds: Set<string>;
  demoCreatedLeadIds: Set<string>;
  demoCompletedLeadIds: Set<string>;
  enrolledLeadIds: Set<string>;
  familyCounts: Partial<Record<BlogConversionFamily, number>>;
  ctaPositionCounts: Record<string, number>;
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeBlogSlug = (value: unknown): string | null => {
  let slug = normalizeText(value).toLowerCase();
  if (!slug) return null;

  try {
    slug = decodeURIComponent(slug);
  } catch {
    // Keep the stored token if it is not valid URI encoding.
  }

  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(slug)) return null;
  const publicSlug = normalizeText(getPublicBlogSlug(slug)).toLowerCase();
  return /^[a-z0-9][a-z0-9-]{0,119}$/.test(publicSlug) ? publicSlug : slug;
};

const pathFromStoredValue = (value: unknown): string => {
  const raw = normalizeText(value);
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname;
    } catch {
      return '';
    }
  }

  if (!raw.startsWith('/')) return '';
  return raw.split(/[?#]/)[0];
};

export const blogSlugFromLandingPage = (value: unknown): string | null => {
  const path = pathFromStoredValue(value).replace(/\/+$/, '');
  if (!path.startsWith('/blog/')) return null;
  const slugToken = path.slice('/blog/'.length);
  if (!slugToken || slugToken.includes('/')) return null;
  return normalizeBlogSlug(slugToken);
};

export const resolveBlogLeadAttributionCredit = (
  lead: BlogAttributionLead,
): BlogLeadAttributionCredit | null => {
  const parsed = parseBlogLeadSourceDetail(lead.sourceDetail);
  const firstTouchSlug = blogSlugFromLandingPage(
    lead.landingPage || lead.attribution?.landingPage,
  );
  const influencedSlug = parsed ? normalizeBlogSlug(parsed.articleSlug) : null;

  if (!firstTouchSlug && !influencedSlug) return null;

  return {
    firstTouchSlug,
    influencedSlug,
    family: parsed?.family || null,
    ctaPosition: parsed?.ctaPosition || null,
  };
};

export const blogAttributionModeForSlug = (
  credit: BlogLeadAttributionCredit,
  slug: string,
): 'first_touch' | 'influenced' | 'both' | null => {
  const normalizedSlug = normalizeBlogSlug(slug);
  if (!normalizedSlug) return null;
  const firstTouch = credit.firstTouchSlug === normalizedSlug;
  const influenced = credit.influencedSlug === normalizedSlug;
  if (firstTouch && influenced) return 'both';
  if (firstTouch) return 'first_touch';
  if (influenced) return 'influenced';
  return null;
};

const createBucket = (slug: string): MutableArticleBucket => ({
  slug,
  leadIds: new Set<string>(),
  firstTouchLeadIds: new Set<string>(),
  influencedLeadIds: new Set<string>(),
  demoCreatedLeadIds: new Set<string>(),
  demoCompletedLeadIds: new Set<string>(),
  enrolledLeadIds: new Set<string>(),
  familyCounts: {},
  ctaPositionCounts: {},
});

const incrementRecord = <T extends string>(
  record: Partial<Record<T, number>>,
  key: T | null | undefined,
) => {
  if (!key) return;
  record[key] = (record[key] || 0) + 1;
};

export const aggregateBlogLeadAttribution = (
  leads: BlogAttributionLead[],
): BlogLeadAttributionSummary => {
  const seenLeadIds = new Set<string>();
  const uniqueBlogLeadIds = new Set<string>();
  const firstTouchBlogLeadIds = new Set<string>();
  const influencedBlogLeadIds = new Set<string>();
  const crossArticleJourneyLeadIds = new Set<string>();
  const demoCreatedLeadIds = new Set<string>();
  const demoCompletedLeadIds = new Set<string>();
  const enrolledLeadIds = new Set<string>();
  const articleBuckets = new Map<string, MutableArticleBucket>();

  leads.forEach((lead) => {
    const leadId = normalizeText(lead.id);
    if (!leadId || seenLeadIds.has(leadId)) return;
    seenLeadIds.add(leadId);

    const credit = resolveBlogLeadAttributionCredit(lead);
    if (!credit) return;

    uniqueBlogLeadIds.add(leadId);
    if (credit.firstTouchSlug) firstTouchBlogLeadIds.add(leadId);
    if (credit.influencedSlug) influencedBlogLeadIds.add(leadId);
    if (
      credit.firstTouchSlug &&
      credit.influencedSlug &&
      credit.firstTouchSlug !== credit.influencedSlug
    ) {
      crossArticleJourneyLeadIds.add(leadId);
    }

    const demoCreated = hasLeadDemoCreatedMilestone(lead);
    const demoCompleted = hasLeadDemoCompletedMilestone(lead);
    const enrolled = hasLeadEnrolledMilestone(lead);
    if (demoCreated) demoCreatedLeadIds.add(leadId);
    if (demoCompleted) demoCompletedLeadIds.add(leadId);
    if (enrolled) enrolledLeadIds.add(leadId);

    const creditedSlugs = new Set(
      [credit.firstTouchSlug, credit.influencedSlug].filter(Boolean) as string[],
    );

    creditedSlugs.forEach((slug) => {
      const bucket = articleBuckets.get(slug) || createBucket(slug);
      bucket.leadIds.add(leadId);
      if (credit.firstTouchSlug === slug) bucket.firstTouchLeadIds.add(leadId);
      if (credit.influencedSlug === slug) {
        bucket.influencedLeadIds.add(leadId);
        incrementRecord(bucket.familyCounts, credit.family);
        incrementRecord(bucket.ctaPositionCounts, credit.ctaPosition);
      }
      if (demoCreated) bucket.demoCreatedLeadIds.add(leadId);
      if (demoCompleted) bucket.demoCompletedLeadIds.add(leadId);
      if (enrolled) bucket.enrolledLeadIds.add(leadId);
      articleBuckets.set(slug, bucket);
    });
  });

  const articleRows = Array.from(articleBuckets.values())
    .map<BlogArticleAttributionRow>((bucket) => ({
      slug: bucket.slug,
      leadCount: bucket.leadIds.size,
      firstTouchCount: bucket.firstTouchLeadIds.size,
      influencedCount: bucket.influencedLeadIds.size,
      demoCreatedCount: bucket.demoCreatedLeadIds.size,
      demoCompletedCount: bucket.demoCompletedLeadIds.size,
      enrolledCount: bucket.enrolledLeadIds.size,
      leadIds: Array.from(bucket.leadIds),
      familyCounts: bucket.familyCounts,
      ctaPositionCounts: bucket.ctaPositionCounts,
    }))
    .sort((a, b) =>
      b.enrolledCount - a.enrolledCount ||
      b.demoCompletedCount - a.demoCompletedCount ||
      b.leadCount - a.leadCount ||
      a.slug.localeCompare(b.slug),
    );

  return {
    uniqueBlogLeadCount: uniqueBlogLeadIds.size,
    firstTouchBlogLeadCount: firstTouchBlogLeadIds.size,
    influencedBlogLeadCount: influencedBlogLeadIds.size,
    crossArticleJourneyCount: crossArticleJourneyLeadIds.size,
    demoCreatedCount: demoCreatedLeadIds.size,
    demoCompletedCount: demoCompletedLeadIds.size,
    enrolledCount: enrolledLeadIds.size,
    articleRows,
  };
};
