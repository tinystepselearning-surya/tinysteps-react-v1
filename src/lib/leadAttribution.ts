import { deriveReferrerDomain } from './leadAcquisition';

const LANDING_PAGE_SESSION_KEY = 'ts_landing_page_v1';
const ATTRIBUTION_SESSION_KEY = 'ts_public_lead_attribution_v2';

export type LeadAttributionCapture = {
  landingPage?: string;
  submittedFromPath?: string;
  submittedFromUrl?: string;
  firstSeenAt?: string;
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

function sanitizeValue(value: string | null | undefined, maxLength = 300): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function compactObject<T extends Record<string, string | undefined>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry === 'string' && entry.length > 0)) as Partial<T>;
}

function resolveSubmittedFromPath(): string {
  if (typeof window === 'undefined') return '/';
  return sanitizeValue(window.location.pathname, 200) || '/';
}

function readStoredAttribution(): LeadAttributionCapture | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LeadAttributionCapture;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredAttribution(value: LeadAttributionCapture) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, JSON.stringify(value));
    if (value.landingPage) {
      window.sessionStorage.setItem(LANDING_PAGE_SESSION_KEY, value.landingPage);
    }
  } catch {
    // Browsers can disable storage. Attribution must never block lead submission.
  }
}

function resolveLegacyLandingPage(currentPath: string): string {
  if (typeof window === 'undefined') return currentPath;

  try {
    return sanitizeValue(window.sessionStorage.getItem(LANDING_PAGE_SESSION_KEY), 200) || currentPath;
  } catch {
    return currentPath;
  }
}

function resolveExternalReferrer(): { referrer?: string; referrerDomain?: string } {
  if (typeof window === 'undefined' || typeof document === 'undefined') return {};

  const referrer = sanitizeValue(document.referrer, 300);
  if (!referrer) return {};

  try {
    const parsed = new URL(referrer);
    if (parsed.origin === window.location.origin) return {};
  } catch {
    return {};
  }

  return {
    referrer,
    referrerDomain: sanitizeValue(deriveReferrerDomain(referrer), 160),
  };
}

export function captureLeadAttribution(): LeadAttributionCapture {
  if (typeof window === 'undefined') return {};

  const submittedFromPath = resolveSubmittedFromPath();
  const search = sanitizeValue(window.location.search, 400) || '';
  const params = new URLSearchParams(window.location.search);
  const existing = readStoredAttribution();
  const externalReferrer = resolveExternalReferrer();

  const next: LeadAttributionCapture = compactObject({
    landingPage: existing?.landingPage || resolveLegacyLandingPage(submittedFromPath),
    submittedFromPath,
    submittedFromUrl: sanitizeValue(`${submittedFromPath}${search}`, 400),
    firstSeenAt: existing?.firstSeenAt || new Date().toISOString(),
    referrer: existing?.referrer || externalReferrer.referrer,
    referrerDomain: existing?.referrerDomain || externalReferrer.referrerDomain,
    utmSource: existing?.utmSource || sanitizeValue(params.get('utm_source'), 120),
    utmMedium: existing?.utmMedium || sanitizeValue(params.get('utm_medium'), 120),
    utmCampaign: existing?.utmCampaign || sanitizeValue(params.get('utm_campaign'), 160),
    utmTerm: existing?.utmTerm || sanitizeValue(params.get('utm_term'), 160),
    utmContent: existing?.utmContent || sanitizeValue(params.get('utm_content'), 160),
    gclid: existing?.gclid || sanitizeValue(params.get('gclid'), 160),
    fbclid: existing?.fbclid || sanitizeValue(params.get('fbclid'), 160),
    msclkid: existing?.msclkid || sanitizeValue(params.get('msclkid'), 160),
  }) as LeadAttributionCapture;

  writeStoredAttribution(next);
  return next;
}
