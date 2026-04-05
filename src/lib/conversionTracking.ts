import { trackEvent } from './analytics';

export type PageCluster =
  | 'authority'
  | 'money'
  | 'age'
  | 'problem'
  | 'program'
  | 'seasonal'
  | 'blog'
  | 'parent_hub'
  | 'other';

export const HIGH_INTENT_ROUTE_CLUSTER: Record<string, Exclude<PageCluster, 'blog' | 'parent_hub' | 'other'>> = {
  '/phonics': 'authority',
  '/grammar': 'authority',
  '/speaking': 'authority',

  '/reading-classes-for-kids': 'money',
  '/spoken-english-classes-for-kids': 'money',
  '/writing-classes-for-kids': 'money',
  '/phonics-fees-india': 'money',
  '/online-english-classes-for-kids-india': 'money',

  '/english-classes-for-4-year-old': 'age',
  '/english-classes-for-5-year-old': 'age',
  '/english-classes-for-6-year-old': 'age',
  '/english-classes-for-7-10-year-old': 'age',

  '/child-not-reading-properly': 'problem',
  '/slow-reader-child-help': 'problem',
  '/shy-child-speaking-confidence': 'problem',

  '/reading-fluency-program': 'program',
  '/confidence-building-program-kids': 'program',
  '/english-foundation-program': 'program',

  '/summer-camp-for-kids-india': 'seasonal',
  '/summer-reading-program-kids': 'seasonal',
  '/summer-speaking-camp-kids': 'seasonal',
};

const DISABLED_PREFIXES = ['/admin', '/teacher', '/parent', '/kid', '/lp', '/dev', '/surya'];

export function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const path = pathname.toLowerCase();
  if (path !== '/' && path.endsWith('/')) return path.replace(/\/+$/, '');
  return path;
}

export function isMarketingPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return !DISABLED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function getPageCluster(pathname: string): PageCluster {
  const path = normalizePath(pathname);
  const mapped = HIGH_INTENT_ROUTE_CLUSTER[path];
  if (mapped) return mapped;
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/parents')) return 'parent_hub';
  return 'other';
}

export function getPageType(pathname: string): string {
  return getPageCluster(pathname);
}

export function isHighIntentPath(pathname: string): boolean {
  return Boolean(HIGH_INTENT_ROUTE_CLUSTER[normalizePath(pathname)]);
}

export function sanitizeLabel(label: string): string {
  return label.replace(/\s+/g, ' ').trim().slice(0, 120);
}

export function extractDestinationPathFromHref(rawHref: string): string | undefined {
  if (!rawHref) return undefined;

  if (rawHref.startsWith('/')) return rawHref;

  try {
    const url = new URL(rawHref, window.location.origin);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function isWhatsAppDestination(rawHref: string | undefined): boolean {
  if (!rawHref) return false;
  return /wa\.me|whatsapp\.com/i.test(rawHref);
}

export function isBookDemoDestination(destinationPath: string | undefined): boolean {
  if (!destinationPath) return false;
  const path = destinationPath.toLowerCase();
  return path.startsWith('/book-demo') || path.includes('book=1');
}

export function isBookDemoLabel(label: string): boolean {
  const normalized = label.toLowerCase();
  return (
    normalized.includes('book demo') ||
    normalized.includes('book free assessment') ||
    normalized.includes('free assessment')
  );
}

export function isHighIntentCtaLabel(label: string): boolean {
  const normalized = label.toLowerCase();
  return (
    normalized.startsWith('explore') ||
    normalized.includes('view pricing') ||
    normalized.includes('get started') ||
    normalized.includes('start your journey')
  );
}

export function trackConversionEvent(
  eventName: 'book_demo_click' | 'whatsapp_click' | 'lead_form_submit' | 'high_intent_page_cta_click',
  params: Record<string, unknown>
) {
  trackEvent(eventName, params);
}

export function buildBaseConversionParams(pathname: string) {
  const pagePath = normalizePath(pathname);
  const pageCluster = getPageCluster(pagePath);

  return {
    page_path: pagePath,
    page_type: getPageType(pagePath),
    page_cluster: pageCluster,
  };
}
