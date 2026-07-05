const LANDING_PAGE_SESSION_KEY = 'ts_landing_page_v1';

export type LeadAttributionCapture = {
  landingPage?: string;
  submittedFromPath?: string;
  submittedFromUrl?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
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

function resolveLandingPage(currentPath: string): string {
  if (typeof window === 'undefined') return currentPath;

  try {
    const existing = sanitizeValue(window.sessionStorage.getItem(LANDING_PAGE_SESSION_KEY), 200);
    if (existing) return existing;
    window.sessionStorage.setItem(LANDING_PAGE_SESSION_KEY, currentPath);
  } catch {
    return currentPath;
  }

  return currentPath;
}

export function captureLeadAttribution(): LeadAttributionCapture {
  if (typeof window === 'undefined') return {};

  const submittedFromPath = resolveSubmittedFromPath();
  const search = sanitizeValue(window.location.search, 400) || '';
  const params = new URLSearchParams(window.location.search);

  return compactObject({
    landingPage: resolveLandingPage(submittedFromPath),
    submittedFromPath,
    submittedFromUrl: sanitizeValue(`${submittedFromPath}${search}`, 400),
    referrer: sanitizeValue(typeof document !== 'undefined' ? document.referrer : '', 300),
    utmSource: sanitizeValue(params.get('utm_source'), 120),
    utmMedium: sanitizeValue(params.get('utm_medium'), 120),
    utmCampaign: sanitizeValue(params.get('utm_campaign'), 160),
    utmTerm: sanitizeValue(params.get('utm_term'), 160),
    utmContent: sanitizeValue(params.get('utm_content'), 160),
    gclid: sanitizeValue(params.get('gclid'), 160),
    fbclid: sanitizeValue(params.get('fbclid'), 160),
  });
}

