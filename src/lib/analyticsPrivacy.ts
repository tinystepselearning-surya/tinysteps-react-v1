import { isPublicAnalyticsPath } from './publicAnalyticsPathPolicy.js';

const SENSITIVE_KEYS = new Set([
  'birthdate', 'dateofbirth', 'dob', 'name', 'firstname', 'lastname',
  'parentname', 'childname', 'studentname', 'email', 'emailaddress', 'phone',
  'phonenumber', 'mobile', 'mobilenumber', 'whatsapp', 'whatsappnumber',
  'childage', 'mainconcern', 'urgency', 'interest', 'message', 'notes',
  'prompt', 'answer', 'searchterm', 'token', 'authtoken', 'authorization',
  'gclid', 'fbclid', 'msclkid', 'utmterm', 'utmcontent',
]);
const PATH_KEYS = new Set(['pagepath', 'page', 'sourcepath', 'landingpage', 'destinationpath']);
const CAMPAIGN_KEYS = new Set(['utmsource', 'utmmedium', 'utmcampaign', 'leadutmsource', 'leadutmmedium', 'leadutmcampaign']);
const CAMPAIGN_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const CONTACT_VALUE = /(?:@|%40|(?:mailto|tel|javascript):|(?:\d[\s().+-]*){8,})/i;
const UNSAFE_URL_KEYS = new Set(['pagelocation', 'pagereferrer', 'linkurl', 'url', 'href', 'referrer', 'formdestination']);

function campaignLabel(value: string): boolean {
  return /^[a-z0-9_-]{1,64}$/i.test(value) && !CONTACT_VALUE.test(value);
}

function publicPath(value: string): string | undefined {
  const path = value.split(/[?#]/, 1)[0];
  if (!/^\/(?:[a-z0-9_-]+\/?)*$/i.test(path) || CONTACT_VALUE.test(path)) return undefined;
  return isPublicAnalyticsPath(path) ? path : undefined;
}

export function analyticsPageContext(href: string, referrer: string) {
  const url = new URL(href);
  const page = new URL(publicPath(url.pathname) || '/', url.origin);
  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = url.searchParams.get(key);
    if (value && campaignLabel(value)) page.searchParams.set(key, value);
  }

  let safeReferrer = '';
  if (referrer) {
    try {
      const previous = new URL(referrer);
      if (previous.protocol === 'https:' || previous.protocol === 'http:') {
        safeReferrer = previous.origin === url.origin
          ? previous.origin + (publicPath(previous.pathname) || '/')
          : previous.origin + '/';
      }
    } catch {
      // Use an explicit empty referrer rather than letting the tag infer it.
    }
  }

  return { page_location: page.href, page_referrer: safeReferrer };
}

export function safeAnalyticsParameters(
  params: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (
      SENSITIVE_KEYS.has(normalized) || UNSAFE_URL_KEYS.has(normalized) ||
      /^(?:(?:kid|child|student|parent|enrollment|submission|lead|user|actor|record|doc|document|phone|contact|session|class|payment|billing|invoice)(?:id|uid|identifier|number)|id|uid)$/.test(normalized)
    ) continue;

    if (PATH_KEYS.has(normalized)) {
      const path = typeof value === 'string' ? publicPath(value) : undefined;
      if (path) safe[key] = path;
      continue;
    }

    if (CAMPAIGN_KEYS.has(normalized)) {
      if (typeof value === 'string' && campaignLabel(value)) safe[key] = value;
      continue;
    }

    if (typeof value === 'string' && !CONTACT_VALUE.test(value) && !/\?|https?:\/\/|%3f/i.test(value)) {
      safe[key] = value;
    } else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      safe[key] = value;
    }
  }
  return safe;
}
