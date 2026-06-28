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

export type FunnelProgram = 'phonics' | 'grammar' | 'speaking' | 'summer_camp' | 'general';

type LeadAttribution = {
  landingPage: string;
  firstSeenAt: string;
  referrer?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
};

const WEBSITE_LEAD_FUNNEL_NAME = 'website_lead_funnel';
const LEAD_ATTRIBUTION_STORAGE_KEY = 'ts_lead_attribution_v1';
const FUNNEL_LANDING_PATHS = new Set([
  '/',
  '/phonics',
  '/grammar',
  '/speaking',
  '/summer-camps',
  '/pricing',
  '/book-demo',
  '/class-samples',
  '/courses',
  '/curriculum',
  '/contact',
]);

export const HIGH_INTENT_ROUTE_CLUSTER: Record<string, Exclude<PageCluster, 'blog' | 'parent_hub' | 'other'>> = {
  '/phonics': 'authority',
  '/grammar': 'authority',
  '/speaking': 'authority',

  '/reading-classes-for-kids': 'money',
  '/spoken-english-classes-for-kids-online': 'money',
  '/writing-classes-for-kids': 'money',
  '/phonics-fees-india': 'money',
  '/best-online-phonics-classes-for-kids-in-india': 'money',
  '/online-english-classes-for-kids': 'money',

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

export function isProgramPagePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return path === '/phonics' || path === '/grammar' || path === '/speaking';
}

export function isFreeResourcePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return (
    path === '/free-letter-tracing-game-for-kids' ||
    path === '/letter-tracing-with-sounds-game' ||
    path === '/phonics-learning-games'
  );
}

export function inferProgramFromPath(pathname: string): FunnelProgram {
  const path = normalizePath(pathname);
  if (path === '/phonics' || path.includes('phonics')) return 'phonics';
  if (path === '/grammar' || path.includes('grammar')) return 'grammar';
  if (path === '/speaking' || path.includes('speaking')) return 'speaking';
  if (path === '/summer-camps' || path.includes('summer')) return 'summer_camp';
  return 'general';
}

export function isFunnelLandingPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return FUNNEL_LANDING_PATHS.has(path) || isHighIntentPath(path);
}

function resolvePagePath(pathname?: string): string {
  if (pathname) return normalizePath(pathname);
  if (typeof window !== 'undefined') return normalizePath(window.location.pathname);
  return '/';
}

function resolveProgram(program: FunnelProgram | undefined, pagePath: string): FunnelProgram {
  if (program) return program;
  return inferProgramFromPath(pagePath);
}

function sanitizeField(value: string | null | undefined, maxLength = 160): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function safeParseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

function readLeadAttribution(): LeadAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LEAD_ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadAttribution;
  } catch {
    return null;
  }
}

function writeLeadAttribution(attribution: LeadAttribution) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LEAD_ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    return;
  }
}

function collectAttributionPatch(pagePath: string): Partial<LeadAttribution> {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const referrerUrl = sanitizeField(document.referrer, 300);
  const parsedReferrer = referrerUrl ? safeParseUrl(referrerUrl) : null;
  const externalReferrer =
    parsedReferrer && parsedReferrer.origin !== window.location.origin ? parsedReferrer : null;

  return {
    landingPage: pagePath,
    firstSeenAt: new Date().toISOString(),
    referrer: externalReferrer?.toString(),
    referrerDomain: externalReferrer?.hostname,
    utmSource: sanitizeField(params.get('utm_source')),
    utmMedium: sanitizeField(params.get('utm_medium')),
    utmCampaign: sanitizeField(params.get('utm_campaign')),
    utmTerm: sanitizeField(params.get('utm_term')),
    utmContent: sanitizeField(params.get('utm_content')),
    gclid: sanitizeField(params.get('gclid')),
    fbclid: sanitizeField(params.get('fbclid')),
    msclkid: sanitizeField(params.get('msclkid')),
  };
}

export function captureLeadAttribution(pathname?: string): LeadAttribution | null {
  const pagePath = resolvePagePath(pathname);
  const patch = collectAttributionPatch(pagePath);
  const existing = readLeadAttribution();

  const next: LeadAttribution = {
    landingPage: existing?.landingPage || patch.landingPage || pagePath,
    firstSeenAt: existing?.firstSeenAt || patch.firstSeenAt || new Date().toISOString(),
    referrer: existing?.referrer || patch.referrer,
    referrerDomain: existing?.referrerDomain || patch.referrerDomain,
    utmSource: existing?.utmSource || patch.utmSource,
    utmMedium: existing?.utmMedium || patch.utmMedium,
    utmCampaign: existing?.utmCampaign || patch.utmCampaign,
    utmTerm: existing?.utmTerm || patch.utmTerm,
    utmContent: existing?.utmContent || patch.utmContent,
    gclid: existing?.gclid || patch.gclid,
    fbclid: existing?.fbclid || patch.fbclid,
    msclkid: existing?.msclkid || patch.msclkid,
  };

  writeLeadAttribution(next);
  return next;
}

function buildAttributionEventParams(pathname?: string) {
  const attribution = captureLeadAttribution(pathname);
  if (!attribution) return {};

  return {
    landing_page: attribution.landingPage,
    lead_utm_source: attribution.utmSource,
    lead_utm_medium: attribution.utmMedium,
    lead_utm_campaign: attribution.utmCampaign,
    lead_referrer_domain: attribution.referrerDomain,
  };
}

export function buildLeadAttributionPayload(pathname?: string) {
  const pagePath = resolvePagePath(pathname);
  const attribution = captureLeadAttribution(pagePath);

  return {
    attribution: attribution
      ? {
          landingPage: attribution.landingPage,
          conversionPage: pagePath,
          firstSeenAt: attribution.firstSeenAt,
          referrer: attribution.referrer,
          referrerDomain: attribution.referrerDomain,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
          utmTerm: attribution.utmTerm,
          utmContent: attribution.utmContent,
          gclid: attribution.gclid,
          fbclid: attribution.fbclid,
          msclkid: attribution.msclkid,
        }
      : undefined,
  };
}

type FunnelBaseParams = {
  page_path?: string;
  funnel_name?: string;
  program?: FunnelProgram;
  source_context?: string;
};

type FunnelLandingParams = FunnelBaseParams & {
  page_title?: string;
};

type FunnelCtaParams = FunnelBaseParams & {
  cta_label: string;
  cta_location: string;
  destination_path?: string;
};

type FunnelLeadFormParams = FunnelBaseParams & {
  form_name?: string;
};

type FunnelLeadFormErrorParams = FunnelLeadFormParams & {
  error_fields?: string[];
  error_message?: string;
};

type GenerateLeadParams = FunnelLeadFormParams & {
  lead_channel?: string;
  lead_type?: string;
  submission_id?: string;
};

type FunnelDemoBookingCompleteParams = FunnelBaseParams & {
  booking_type: string;
};

export function trackLandingPageView(params: FunnelLandingParams) {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('funnel_landing_page_view', {
    page_path: pagePath,
    page_title: params.page_title || (typeof document !== 'undefined' ? document.title : ''),
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'route_tracker',
    ...buildAttributionEventParams(pagePath),
  });
}

export function trackCtaClick(params: FunnelCtaParams) {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('funnel_cta_click', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    ...buildAttributionEventParams(pagePath),
  });
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

export const trackBookDemoClick = (location: string) => {
  const pagePath = resolvePagePath();
  trackEvent('book_assessment_click', {
    location,
    page_path: pagePath,
    ...buildAttributionEventParams(pagePath),
  });
  trackEvent('book_demo_click', {
    location,
    page: pagePath,
  });
};

export const trackWhatsappClick = (location: string) => {
  const pagePath = resolvePagePath();
  trackEvent('whatsapp_click', {
    location,
    page: pagePath,
    page_path: pagePath,
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackPhoneClick = (location: string) => {
  const pagePath = resolvePagePath();
  trackEvent('phone_click', {
    location,
    page_path: pagePath,
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackEmailClick = (location: string) => {
  const pagePath = resolvePagePath();
  trackEvent('email_click', {
    location,
    page_path: pagePath,
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackProgramCtaClick = (params: FunnelCtaParams) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('program_cta_click', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'program_page',
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackPricingCtaClick = (params: FunnelCtaParams) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('pricing_cta_click', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'pricing_page',
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackFreeResourceStart = (resourceName: string, pathname?: string) => {
  const pagePath = resolvePagePath(pathname);
  trackEvent('free_resource_start', {
    page_path: pagePath,
    resource_name: sanitizeLabel(resourceName),
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackFreeResourceToTrialClick = (params: FunnelCtaParams) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('free_resource_to_trial_click', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    program: resolveProgram(params.program, pagePath),
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackLeadFormStart = (params: FunnelLeadFormParams = {}) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('lead_form_start', {
    page: pagePath,
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    ...buildAttributionEventParams(pagePath),
  });
  trackEvent('funnel_form_start', {
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'unknown',
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackLeadFormSubmit = (params: FunnelLeadFormParams = {}) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('lead_form_submit', {
    page: pagePath,
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    ...buildAttributionEventParams(pagePath),
  });
  trackEvent('funnel_form_submit', {
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'unknown',
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackLeadFormError = (params: FunnelLeadFormErrorParams = {}) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('form_error', {
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    error_fields: Array.isArray(params.error_fields) ? params.error_fields.join(',') : undefined,
    error_message: params.error_message,
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'unknown',
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackGenerateLead = (params: GenerateLeadParams = {}) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('generate_lead', {
    page_path: pagePath,
    form_name: params.form_name || 'unknown_form',
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'unknown',
    lead_channel: params.lead_channel || 'form_submit',
    lead_type: params.lead_type || 'parent_inquiry',
    submission_id: params.submission_id,
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackCoursePageCtaClick = (params: FunnelCtaParams) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('course_page_cta_click', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    ...buildAttributionEventParams(pagePath),
  });
};

export const trackParentCourseInterest = (params: FunnelCtaParams) => {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('parent_course_interest', {
    page_path: pagePath,
    cta_label: sanitizeLabel(params.cta_label),
    cta_location: params.cta_location,
    destination_path: params.destination_path,
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    ...buildAttributionEventParams(pagePath),
  });
};

export function trackDemoBookingComplete(params: FunnelDemoBookingCompleteParams) {
  const pagePath = resolvePagePath(params.page_path);
  trackEvent('funnel_demo_booking_complete', {
    page_path: pagePath,
    booking_type: params.booking_type,
    funnel_name: params.funnel_name || WEBSITE_LEAD_FUNNEL_NAME,
    program: resolveProgram(params.program, pagePath),
    source_context: params.source_context || 'unknown',
    ...buildAttributionEventParams(pagePath),
  });
}

export function trackConversionEvent(
  eventName:
    | 'book_demo_click'
    | 'whatsapp_click'
    | 'lead_form_submit'
    | 'form_error'
    | 'course_page_cta_click'
    | 'parent_course_interest'
    | 'high_intent_page_cta_click'
    | 'funnel_landing_page_view'
    | 'funnel_cta_click'
    | 'funnel_form_start'
    | 'funnel_form_submit'
    | 'funnel_demo_booking_complete',
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
