import { trackEvent } from './analytics';
import { captureLeadAttribution, type FunnelProgram } from './conversionTracking';
import type { BlogConversionFamily } from '../content/blog/shared/conversionFamilies';

export type BlogConversionEventContext = {
  article_slug: string;
  conversion_family: BlogConversionFamily;
  intent_cluster: string;
  authority_cluster?: string;
  program?: FunnelProgram;
  cta_position?: string;
  cta_label?: string;
  destination_path?: string;
};

function sanitize(value: string | undefined, maxLength = 160): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function getCurrentPagePath() {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
}

function buildAttributionParams() {
  const attribution = captureLeadAttribution();
  if (!attribution) return {};
  return {
    landing_page: attribution.landingPage,
    lead_utm_source: attribution.utmSource,
    lead_utm_medium: attribution.utmMedium,
    lead_utm_campaign: attribution.utmCampaign,
    lead_referrer_domain: attribution.referrerDomain,
  };
}

function buildBlogParams(context: BlogConversionEventContext) {
  return {
    page_path: getCurrentPagePath(),
    article_slug: sanitize(context.article_slug, 120),
    conversion_family: context.conversion_family,
    intent_cluster: sanitize(context.intent_cluster, 180),
    authority_cluster: sanitize(context.authority_cluster, 80),
    program: context.program || 'general',
    cta_position: sanitize(context.cta_position, 64),
    cta_label: sanitize(context.cta_label, 120),
    destination_path: sanitize(context.destination_path, 220),
    ...buildAttributionParams(),
  };
}

export function trackBlogArticleView(context: BlogConversionEventContext) {
  trackEvent('blog_article_view', buildBlogParams(context));
}

export function trackBlogCtaImpression(context: BlogConversionEventContext) {
  trackEvent('blog_cta_impression', buildBlogParams(context));
}

export function trackBlogCtaClick(context: BlogConversionEventContext) {
  trackEvent('blog_cta_click', buildBlogParams(context));
}

export function trackBlogProgramClick(context: BlogConversionEventContext) {
  trackEvent('blog_program_click', buildBlogParams(context));
}

export function trackBlogDemoStart(context: BlogConversionEventContext) {
  trackEvent('blog_demo_start', buildBlogParams(context));
}

export function trackBlogDemoSubmit(context: BlogConversionEventContext) {
  trackEvent('blog_demo_submit', buildBlogParams(context));
}
