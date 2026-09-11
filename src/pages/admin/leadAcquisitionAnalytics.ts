import {
  acquisitionChannelLabel,
  classifyLeadAcquisition,
  type AcquisitionChannel,
} from '../../lib/leadAcquisition';

export type AttributionMap = {
  landingPage?: string | null;
  conversionPage?: string | null;
  referrer?: string | null;
  referrerDomain?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  acquisitionChannel?: AcquisitionChannel | null;
  acquisitionSource?: string | null;
};

export type AcquisitionAnalyticsLead = {
  id: string;
  source?: string | null;
  acquisitionChannel?: AcquisitionChannel | null;
  acquisitionSource?: string | null;
  landingPage?: string | null;
  attribution?: AttributionMap | null;
};

export type AcquisitionGroupKey =
  | 'ai_answer_engines'
  | 'organic_search'
  | 'paid'
  | 'social'
  | 'direct'
  | 'referral'
  | 'other_campaign'
  | 'legacy_unattributed';

export type AnswerEngineKey = 'chatgpt' | 'perplexity' | 'gemini' | 'copilot' | 'claude';

export type AcquisitionResolved = {
  key: string;
  label: string;
  group: AcquisitionGroupKey;
  canonicalChannel: string;
  rawSource: string;
  answerEngine?: AnswerEngineKey;
};

export type AttributionDetail = {
  rawSource: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrerDomain: string;
  landingPage: string;
};

const normalize = (value: unknown): string => String(value || '').trim();
const lower = (value: unknown): string => normalize(value).toLowerCase();

const normalizeDomain = (value: unknown): string =>
  lower(value)
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/^www\./, '')
    .replace(/:\d+$/, '');

const domainFromReferrer = (value: unknown): string => {
  const raw = normalize(value);
  if (!raw) return '';
  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return normalizeDomain(raw);
  }
};

const domainMatches = (value: string, domain: string): boolean =>
  value === domain || value.endsWith(`.${domain}`);

const sourceTokenMatches = (value: string, aliases: readonly string[]): boolean => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!normalized) return false;
  return aliases.some((alias) => normalized === alias || normalized.split(' ').includes(alias));
};

const ANSWER_ENGINES: Array<{
  key: AnswerEngineKey;
  label: string;
  domains: readonly string[];
  sourceAliases: readonly string[];
}> = [
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    domains: ['chatgpt.com', 'chat.openai.com'],
    sourceAliases: ['chatgpt'],
  },
  {
    key: 'perplexity',
    label: 'Perplexity',
    domains: ['perplexity.ai'],
    sourceAliases: ['perplexity'],
  },
  {
    key: 'gemini',
    label: 'Gemini',
    domains: ['gemini.google.com'],
    sourceAliases: ['gemini', 'bard'],
  },
  {
    key: 'copilot',
    label: 'Microsoft Copilot',
    domains: ['copilot.microsoft.com'],
    sourceAliases: ['copilot'],
  },
  {
    key: 'claude',
    label: 'Claude',
    domains: ['claude.ai'],
    sourceAliases: ['claude'],
  },
];

export const hasAttributionEvidence = (lead: AcquisitionAnalyticsLead): boolean => {
  const attribution = lead.attribution || {};
  return Boolean(
    lead.acquisitionChannel ||
      lead.acquisitionSource ||
      lead.landingPage ||
      attribution.acquisitionChannel ||
      attribution.acquisitionSource ||
      attribution.referrerDomain ||
      attribution.referrer ||
      attribution.utm_source ||
      attribution.utm_medium ||
      attribution.utm_campaign ||
      attribution.gclid ||
      attribution.fbclid ||
      attribution.msclkid,
  );
};

export const detectAnswerEngine = (
  lead: AcquisitionAnalyticsLead,
): { key: AnswerEngineKey; label: string } | null => {
  const attribution = lead.attribution || {};
  const domains = [
    normalizeDomain(attribution.referrerDomain),
    domainFromReferrer(attribution.referrer),
    normalizeDomain(lead.acquisitionSource),
    normalizeDomain(attribution.acquisitionSource),
  ].filter(Boolean);
  const sources = [
    lower(lead.acquisitionSource),
    lower(attribution.acquisitionSource),
    lower(attribution.utm_source),
  ].filter(Boolean);

  for (const engine of ANSWER_ENGINES) {
    if (domains.some((candidate) => engine.domains.some((domain) => domainMatches(candidate, domain)))) {
      return { key: engine.key, label: engine.label };
    }
    if (sources.some((candidate) => sourceTokenMatches(candidate, engine.sourceAliases))) {
      return { key: engine.key, label: engine.label };
    }
  }

  return null;
};

const groupForChannel = (channel: string): AcquisitionGroupKey => {
  if (channel === 'google_organic' || channel === 'bing_organic') return 'organic_search';
  if (channel === 'google_ads' || channel === 'microsoft_ads') return 'paid';
  if (['instagram', 'facebook', 'linkedin', 'youtube'].includes(channel)) return 'social';
  if (channel === 'direct') return 'direct';
  if (channel === 'referral') return 'referral';
  if (channel === 'other') return 'other_campaign';
  return 'legacy_unattributed';
};

const legacyResolution = (lead: AcquisitionAnalyticsLead): AcquisitionResolved => {
  const source = lower(lead.source);
  if (source === 'instagram') {
    return { key: 'legacy:instagram', label: 'Instagram (legacy)', group: 'social', canonicalChannel: 'legacy_instagram', rawSource: 'instagram' };
  }
  if (source === 'referral') {
    return { key: 'legacy:referral', label: 'Referral (legacy)', group: 'referral', canonicalChannel: 'legacy_referral', rawSource: 'referral' };
  }
  if (source === 'whatsapp') {
    return { key: 'legacy:whatsapp', label: 'WhatsApp (legacy)', group: 'legacy_unattributed', canonicalChannel: 'legacy_whatsapp', rawSource: 'whatsapp' };
  }
  if (source === 'manual') {
    return { key: 'legacy:manual', label: 'Manual (legacy)', group: 'legacy_unattributed', canonicalChannel: 'legacy_manual', rawSource: 'manual' };
  }
  return {
    key: 'legacy:unattributed',
    label: 'Legacy / unattributed',
    group: 'legacy_unattributed',
    canonicalChannel: 'legacy_unattributed',
    rawSource: source || 'legacy',
  };
};

export const resolveAcquisitionAnalytics = (lead: AcquisitionAnalyticsLead): AcquisitionResolved => {
  const engine = detectAnswerEngine(lead);
  const attribution = lead.attribution || {};
  const rawSource = normalize(
    lead.acquisitionSource ||
      attribution.acquisitionSource ||
      attribution.utm_source ||
      attribution.referrerDomain ||
      domainFromReferrer(attribution.referrer),
  );

  if (engine) {
    return {
      key: `ai:${engine.key}`,
      label: engine.label,
      group: 'ai_answer_engines',
      canonicalChannel: 'ai_answer_engine',
      rawSource: rawSource || engine.label,
      answerEngine: engine.key,
    };
  }

  if (!hasAttributionEvidence(lead)) return legacyResolution(lead);

  const explicit = lead.acquisitionChannel || attribution.acquisitionChannel;
  const classified = explicit
    ? {
        channel: explicit,
        label: acquisitionChannelLabel(explicit),
        source: rawSource || normalize(explicit),
      }
    : classifyLeadAcquisition({
        referrer: normalize(attribution.referrer) || undefined,
        referrerDomain: normalize(attribution.referrerDomain) || undefined,
        utmSource: normalize(attribution.utm_source) || undefined,
        utmMedium: normalize(attribution.utm_medium) || undefined,
        utmCampaign: normalize(attribution.utm_campaign) || undefined,
        gclid: normalize(attribution.gclid) || undefined,
        fbclid: normalize(attribution.fbclid) || undefined,
        msclkid: normalize(attribution.msclkid) || undefined,
      });

  const channel = classified.channel;
  const group = groupForChannel(channel);
  const source = normalize(classified.source || rawSource) || channel;
  let label = classified.label || acquisitionChannelLabel(channel);
  let key: string = channel;

  if (channel === 'referral' && source && source !== 'referral') {
    const domain = normalizeDomain(source);
    label = domain ? `Referral: ${domain}` : `Referral: ${source}`;
    key = `referral:${domain || source.toLowerCase()}`;
  }

  if (channel === 'other') {
    label = 'Other campaign';
    key = 'other_campaign';
  }

  return {
    key,
    label,
    group,
    canonicalChannel: channel,
    rawSource: rawSource || source,
  };
};

export const acquisitionGroupLabel = (group: AcquisitionGroupKey): string => {
  switch (group) {
    case 'ai_answer_engines':
      return 'AI / Answer Engines';
    case 'organic_search':
      return 'Organic Search';
    case 'paid':
      return 'Paid';
    case 'social':
      return 'Social';
    case 'direct':
      return 'Direct';
    case 'referral':
      return 'Referral';
    case 'other_campaign':
      return 'Other Campaign';
    default:
      return 'Legacy / Unattributed';
  }
};

export const attributionDetail = (lead: AcquisitionAnalyticsLead): AttributionDetail => {
  const attribution = lead.attribution || {};
  return {
    rawSource: normalize(
      lead.acquisitionSource ||
        attribution.acquisitionSource ||
        attribution.utm_source ||
        attribution.referrerDomain ||
        domainFromReferrer(attribution.referrer),
    ) || '—',
    utmSource: normalize(attribution.utm_source) || '—',
    utmMedium: normalize(attribution.utm_medium) || '—',
    utmCampaign: normalize(attribution.utm_campaign) || '—',
    referrerDomain: normalize(attribution.referrerDomain) || domainFromReferrer(attribution.referrer) || '—',
    landingPage: normalize(lead.landingPage || attribution.landingPage) || 'Legacy / unknown',
  };
};

export const percentagePointDelta = (part: number, total: number, benchmarkPart: number, benchmarkTotal: number): number => {
  if (total <= 0 || benchmarkTotal <= 0) return 0;
  return (part / total) * 100 - (benchmarkPart / benchmarkTotal) * 100;
};
