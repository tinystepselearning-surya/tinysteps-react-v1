import { parseBlogLeadSourceDetail } from './blogLeadAttribution';

export type LeadAttributionLike = {
  source?: unknown;
  sourceDetail?: unknown;
  acquisitionChannel?: unknown;
  acquisitionSource?: unknown;
  landingPage?: unknown;
  conversionPage?: unknown;
  attribution?: {
    utm_source?: unknown;
    utm_medium?: unknown;
    utm_campaign?: unknown;
    referrerDomain?: unknown;
  } | null;
};

export type LeadAttributionDisplay = {
  acquisitionLabel: string;
  contentInfluenceLabel: string | null;
  detailLabel: string | null;
  blogArticleSlug: string | null;
  blogFamily: string | null;
  ctaPosition: string | null;
};

const ACQUISITION_LABELS: Record<string, string> = {
  google_organic: 'Google Organic',
  google_ads: 'Google Ads',
  bing_organic: 'Bing Organic',
  microsoft_ads: 'Microsoft Ads',
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  referral: 'Referral',
  direct: 'Direct',
  other: 'Other',
};

const normalizeText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizePath = (value: unknown): string => {
  const path = normalizeText(value);
  return path.startsWith('/') ? path : '';
};

const humanizeToken = (value: string): string =>
  value
    .replace(/^\/blog\//, '')
    .replace(/^\//, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

function resolveAcquisitionLabel(lead: LeadAttributionLike): string {
  const channel = normalizeText(lead.acquisitionChannel).toLowerCase();
  if (channel && ACQUISITION_LABELS[channel]) return ACQUISITION_LABELS[channel];

  const utmSource = normalizeText(lead.attribution?.utm_source);
  if (utmSource) return humanizeToken(utmSource);

  const acquisitionSource = normalizeText(lead.acquisitionSource);
  if (acquisitionSource) return humanizeToken(acquisitionSource);

  const referrerDomain = normalizeText(lead.attribution?.referrerDomain);
  if (referrerDomain) return referrerDomain;

  const source = normalizeText(lead.source);
  return source ? humanizeToken(source) : 'Source unavailable';
}

export function buildLeadAttributionDisplay(lead: LeadAttributionLike): LeadAttributionDisplay {
  const sourceDetail = normalizeText(lead.sourceDetail);
  const blogContext = parseBlogLeadSourceDetail(sourceDetail);
  const landingPage = normalizePath(lead.landingPage);
  const conversionPage = normalizePath(lead.conversionPage);

  const blogLandingSlug = landingPage.startsWith('/blog/')
    ? landingPage.slice('/blog/'.length).split(/[?#]/)[0]
    : '';
  const effectiveBlogSlug = blogContext?.articleSlug || blogLandingSlug || null;

  const contentInfluenceLabel = blogContext
    ? `Blog · ${humanizeToken(blogContext.articleSlug)}`
    : blogLandingSlug
      ? `First touch blog · ${humanizeToken(blogLandingSlug)}`
      : landingPage && landingPage !== '/'
        ? `Landing · ${landingPage}`
        : null;

  const detailParts = [
    landingPage ? `First touch ${landingPage}` : '',
    conversionPage && conversionPage !== landingPage ? `Converted ${conversionPage}` : '',
    blogContext?.ctaPosition ? `CTA ${humanizeToken(blogContext.ctaPosition)}` : '',
  ].filter(Boolean);

  return {
    acquisitionLabel: resolveAcquisitionLabel(lead),
    contentInfluenceLabel,
    detailLabel: detailParts.length ? detailParts.join(' · ') : null,
    blogArticleSlug: effectiveBlogSlug,
    blogFamily: blogContext?.family || null,
    ctaPosition: blogContext?.ctaPosition || null,
  };
}
