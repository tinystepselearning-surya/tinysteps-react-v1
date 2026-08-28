import type { BlogConversionFamily } from '../content/blog/shared/conversionFamilies';

const BLOG_CONVERSION_SESSION_KEY = 'ts_blog_conversion_attribution_v1';

export type BlogConversionAttribution = {
  firstArticleSlug?: string;
  firstArticlePath?: string;
  firstFamily?: BlogConversionFamily;
  firstIntentCluster?: string;
  firstSeenAt?: string;
  lastArticleSlug?: string;
  lastArticlePath?: string;
  lastFamily?: BlogConversionFamily;
  lastIntentCluster?: string;
  lastSeenAt?: string;
  lastCtaLabel?: string;
  lastCtaPosition?: string;
  lastDestinationPath?: string;
};

export type BlogArticleConversionContext = {
  slug: string;
  family: BlogConversionFamily;
  intentCluster: string;
  path?: string;
};

export type BlogCtaConversionContext = BlogArticleConversionContext & {
  ctaLabel: string;
  ctaPosition: string;
  destinationPath: string;
};

function sanitizeSlug(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/.test(normalized)) return undefined;
  return normalized;
}

function sanitizeText(value: string | null | undefined, maxLength = 160): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function sanitizePath(value: string | null | undefined): string | undefined {
  const normalized = sanitizeText(value, 220);
  if (!normalized || !normalized.startsWith('/')) return undefined;
  return normalized;
}

function sanitizeFamily(value: string | null | undefined): BlogConversionFamily | undefined {
  switch (value) {
    case 'phonics-diagnostic':
    case 'phonics-practice':
    case 'reading-fluency':
    case 'grammar-diagnostic':
    case 'sentence-building':
    case 'speaking-confidence':
    case 'general-english':
    case 'schools-partnership':
      return value;
    default:
      return undefined;
  }
}

function readStoredBlogAttribution(): BlogConversionAttribution {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(BLOG_CONVERSION_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BlogConversionAttribution;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredBlogAttribution(value: BlogConversionAttribution) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(BLOG_CONVERSION_SESSION_KEY, JSON.stringify(value));
  } catch {
    // Attribution must never block article reading or lead conversion.
  }
}

function resolveArticlePath(slug: string, explicitPath?: string): string {
  return sanitizePath(explicitPath) || `/blog/${slug}`;
}

export function getBlogConversionAttribution(): BlogConversionAttribution {
  return readStoredBlogAttribution();
}

export function captureBlogArticleContext(context: BlogArticleConversionContext) {
  const slug = sanitizeSlug(context.slug);
  const family = sanitizeFamily(context.family);
  const intentCluster = sanitizeText(context.intentCluster, 180);
  if (!slug || !family) return readStoredBlogAttribution();

  const existing = readStoredBlogAttribution();
  const path = resolveArticlePath(slug, context.path);
  const now = new Date().toISOString();
  const next: BlogConversionAttribution = {
    ...existing,
    firstArticleSlug: existing.firstArticleSlug || slug,
    firstArticlePath: existing.firstArticlePath || path,
    firstFamily: existing.firstFamily || family,
    firstIntentCluster: existing.firstIntentCluster || intentCluster,
    firstSeenAt: existing.firstSeenAt || now,
    lastArticleSlug: slug,
    lastArticlePath: path,
    lastFamily: family,
    lastIntentCluster: intentCluster,
    lastSeenAt: now,
  };

  writeStoredBlogAttribution(next);
  return next;
}

export function captureBlogCtaContext(context: BlogCtaConversionContext) {
  const base = captureBlogArticleContext(context);
  const next: BlogConversionAttribution = {
    ...base,
    lastCtaLabel: sanitizeText(context.ctaLabel, 120),
    lastCtaPosition: sanitizeText(context.ctaPosition, 64),
    lastDestinationPath: sanitizePath(context.destinationPath),
  };

  writeStoredBlogAttribution(next);
  return next;
}

export function buildBlogDemoPath(
  context: Pick<BlogCtaConversionContext, 'slug' | 'family' | 'ctaPosition'>,
): string {
  const slug = sanitizeSlug(context.slug);
  const family = sanitizeFamily(context.family);
  const position = sanitizeText(context.ctaPosition, 64);
  if (!slug || !family) return '/book-demo';

  const params = new URLSearchParams({
    from: 'blog',
    article: slug,
    intent: family,
  });
  if (position) params.set('cta', position);
  return `/book-demo?${params.toString()}`;
}

export type ParsedBlogLeadSource = {
  articleSlug: string;
  family: BlogConversionFamily;
  ctaPosition: string;
};

export function resolveBlogLeadSourceDetail(search?: string): string | null {
  const params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''));
  const queryIsBlog = params.get('from') === 'blog';
  const stored = readStoredBlogAttribution();

  const articleSlug = queryIsBlog
    ? sanitizeSlug(params.get('article'))
    : sanitizeSlug(stored.lastArticleSlug);
  const family = queryIsBlog
    ? sanitizeFamily(params.get('intent'))
    : sanitizeFamily(stored.lastFamily);
  const ctaPosition = queryIsBlog
    ? sanitizeText(params.get('cta'), 64)
    : sanitizeText(stored.lastCtaPosition, 64);

  if (!articleSlug || !family) return null;
  return `blog|${articleSlug}|${family}|${ctaPosition || 'influenced'}`;
}

export function parseBlogLeadSourceDetail(source: string | null | undefined): ParsedBlogLeadSource | null {
  if (typeof source !== 'string' || !source.startsWith('blog|')) return null;
  const [, rawSlug, rawFamily, rawPosition] = source.split('|');
  const articleSlug = sanitizeSlug(rawSlug);
  const family = sanitizeFamily(rawFamily);
  const ctaPosition = sanitizeText(rawPosition, 64);
  if (!articleSlug || !family || !ctaPosition) return null;

  return {
    articleSlug,
    family,
    ctaPosition,
  };
}
