export type AcquisitionChannel =
  | 'google_organic'
  | 'google_ads'
  | 'bing_organic'
  | 'microsoft_ads'
  | 'chatgpt'
  | 'google_gemini'
  | 'perplexity'
  | 'microsoft_copilot'
  | 'claude'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'referral'
  | 'direct'
  | 'other';

export type AcquisitionInput = {
  referrer?: string;
  referrerDomain?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
};

export type AcquisitionClassification = {
  channel: AcquisitionChannel;
  source: string;
  label: string;
};

const normalize = (value: string | null | undefined): string => String(value || '').trim().toLowerCase();

const isPaidMedium = (medium: string): boolean =>
  /(^|[_\-])(cpc|ppc|paid|paidsearch|paid_search|display|retargeting|remarketing)([_\-]|$)/.test(medium);

const matchesSource = (value: string, aliases: string[]): boolean => aliases.includes(value);

const matchesDomain = (domain: string, roots: string[]): boolean =>
  roots.some((root) => domain === root || domain.endsWith(`.${root}`));

const isGoogleDomain = (domain: string): boolean =>
  /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain);

export function deriveReferrerDomain(referrer?: string): string | undefined {
  const raw = String(referrer || '').trim();
  if (!raw) return undefined;

  try {
    return new URL(raw).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function classifyLeadAcquisition(input: AcquisitionInput): AcquisitionClassification {
  const utmSource = normalize(input.utmSource);
  const utmMedium = normalize(input.utmMedium);
  const referrerDomain = normalize(input.referrerDomain || deriveReferrerDomain(input.referrer));

  // Explicit paid click IDs are stronger evidence than referrer/source labels.
  if (input.gclid) {
    return { channel: 'google_ads', source: utmSource || 'google', label: 'Google Ads' };
  }
  if (input.msclkid) {
    return { channel: 'microsoft_ads', source: utmSource || 'microsoft', label: 'Microsoft Ads' };
  }

  const hasChatGpt =
    matchesSource(utmSource, ['chatgpt', 'chatgpt.com', 'openai', 'openai.com']) ||
    matchesDomain(referrerDomain, ['chatgpt.com', 'openai.com']);
  const hasGemini =
    matchesSource(utmSource, ['gemini', 'google_gemini', 'google-gemini', 'gemini.google.com']) ||
    matchesDomain(referrerDomain, ['gemini.google.com']);
  const hasPerplexity =
    matchesSource(utmSource, ['perplexity', 'perplexity_ai', 'perplexity-ai', 'perplexity.ai']) ||
    matchesDomain(referrerDomain, ['perplexity.ai']);
  const hasCopilot =
    matchesSource(utmSource, ['copilot', 'microsoft_copilot', 'microsoft-copilot', 'copilot.microsoft.com', 'copilot.com']) ||
    matchesDomain(referrerDomain, ['copilot.microsoft.com', 'copilot.com']);
  const hasClaude =
    matchesSource(utmSource, ['claude', 'claude.ai', 'anthropic', 'anthropic.com']) ||
    matchesDomain(referrerDomain, ['claude.ai', 'anthropic.com']);

  if (hasChatGpt) {
    return { channel: 'chatgpt', source: utmSource || referrerDomain || 'chatgpt', label: 'ChatGPT / OpenAI' };
  }

  if (hasGemini) {
    return { channel: 'google_gemini', source: utmSource || referrerDomain || 'gemini', label: 'Google Gemini' };
  }

  if (hasPerplexity) {
    return { channel: 'perplexity', source: utmSource || referrerDomain || 'perplexity', label: 'Perplexity' };
  }

  if (hasCopilot) {
    return { channel: 'microsoft_copilot', source: utmSource || referrerDomain || 'copilot', label: 'Microsoft Copilot' };
  }

  if (hasClaude) {
    return { channel: 'claude', source: utmSource || referrerDomain || 'claude', label: 'Claude' };
  }

  const hasGoogle =
    matchesSource(utmSource, ['google', 'google_ads', 'google-ads', 'googleads', 'adwords']) ||
    isGoogleDomain(referrerDomain);
  const hasBing =
    matchesSource(utmSource, ['bing', 'microsoft', 'microsoft_ads', 'microsoft-ads']) ||
    matchesDomain(referrerDomain, ['bing.com', 'microsoft.com']);
  const hasInstagram =
    matchesSource(utmSource, ['instagram', 'instagram_ads', 'instagram-ads', 'ig']) ||
    matchesDomain(referrerDomain, ['instagram.com']);
  const hasFacebook =
    matchesSource(utmSource, ['facebook', 'facebook_ads', 'facebook-ads', 'fb', 'meta', 'meta_ads', 'meta-ads']) ||
    matchesDomain(referrerDomain, ['facebook.com', 'fb.com', 'meta.com']);
  const hasLinkedIn =
    matchesSource(utmSource, ['linkedin', 'linkedin_ads', 'linkedin-ads']) ||
    matchesDomain(referrerDomain, ['linkedin.com']);
  const hasYouTube =
    matchesSource(utmSource, ['youtube', 'youtube_ads', 'youtube-ads']) ||
    matchesDomain(referrerDomain, ['youtube.com', 'youtu.be']);

  if (input.gclid || (hasGoogle && isPaidMedium(utmMedium))) {
    return { channel: 'google_ads', source: utmSource || 'google', label: 'Google Ads' };
  }

  if (input.msclkid || (hasBing && isPaidMedium(utmMedium))) {
    return { channel: 'microsoft_ads', source: utmSource || 'microsoft', label: 'Microsoft Ads' };
  }

  if (hasInstagram) {
    return { channel: 'instagram', source: utmSource || referrerDomain || 'instagram', label: 'Instagram' };
  }

  if (hasFacebook || input.fbclid) {
    return { channel: 'facebook', source: utmSource || referrerDomain || 'facebook', label: 'Facebook / Meta' };
  }

  if (hasLinkedIn) {
    return { channel: 'linkedin', source: utmSource || referrerDomain || 'linkedin', label: 'LinkedIn' };
  }

  if (hasYouTube) {
    return { channel: 'youtube', source: utmSource || referrerDomain || 'youtube', label: 'YouTube' };
  }

  if (hasGoogle) {
    return { channel: 'google_organic', source: referrerDomain || utmSource || 'google', label: 'Google Organic' };
  }

  if (hasBing) {
    return { channel: 'bing_organic', source: referrerDomain || utmSource || 'bing', label: 'Bing Organic' };
  }

  if (utmSource) {
    return {
      channel: 'other',
      source: utmSource,
      label: utmMedium ? `${utmSource} / ${utmMedium}` : utmSource,
    };
  }

  if (referrerDomain) {
    return { channel: 'referral', source: referrerDomain, label: `Referral: ${referrerDomain}` };
  }

  return { channel: 'direct', source: 'direct', label: 'Direct / unknown' };
}

export type StoredLeadAcquisitionEvidence = AcquisitionInput & {
  acquisitionChannel?: string | null;
  acquisitionSource?: string | null;
};

const ACQUISITION_CHANNELS = new Set<AcquisitionChannel>([
  'google_organic',
  'google_ads',
  'bing_organic',
  'microsoft_ads',
  'chatgpt',
  'google_gemini',
  'perplexity',
  'microsoft_copilot',
  'claude',
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'referral',
  'direct',
  'other',
]);

export function resolveStoredLeadAcquisition(
  input: StoredLeadAcquisitionEvidence,
): AcquisitionClassification {
  const inferred = classifyLeadAcquisition(input);
  const explicit = normalize(input.acquisitionChannel) as AcquisitionChannel;
  const hasExplicit = ACQUISITION_CHANNELS.has(explicit);

  // Preserve specific stored channels, but do not let a historical generic "other"
  // value hide stronger raw UTM/referrer evidence such as utm_source=chatgpt.com.
  if (hasExplicit && explicit !== 'other') {
    return {
      channel: explicit,
      source: normalize(input.acquisitionSource) || inferred.source || explicit,
      label: acquisitionChannelLabel(explicit),
    };
  }

  if (explicit === 'other' && inferred.channel !== 'other' && inferred.channel !== 'direct') {
    return inferred;
  }

  if (explicit === 'other') {
    return {
      channel: 'other',
      source: normalize(input.acquisitionSource) || inferred.source || 'other',
      label: acquisitionChannelLabel('other'),
    };
  }

  return inferred;
}

export function acquisitionChannelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case 'google_organic':
      return 'Google Organic';
    case 'google_ads':
      return 'Google Ads';
    case 'bing_organic':
      return 'Bing Organic';
    case 'microsoft_ads':
      return 'Microsoft Ads';
    case 'chatgpt':
      return 'ChatGPT / OpenAI';
    case 'google_gemini':
      return 'Google Gemini';
    case 'perplexity':
      return 'Perplexity';
    case 'microsoft_copilot':
      return 'Microsoft Copilot';
    case 'claude':
      return 'Claude';
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook / Meta';
    case 'linkedin':
      return 'LinkedIn';
    case 'youtube':
      return 'YouTube';
    case 'referral':
      return 'Referral';
    case 'direct':
      return 'Direct / unknown';
    case 'other':
      return 'Other campaign';
    default:
      return 'Legacy / unattributed';
  }
}
