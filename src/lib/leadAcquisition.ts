export type AcquisitionChannel =
  | 'google_organic'
  | 'google_ads'
  | 'bing_organic'
  | 'microsoft_ads'
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

const includesAny = (value: string, needles: string[]): boolean => needles.some((needle) => value.includes(needle));

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

  const sourceText = `${utmSource} ${referrerDomain}`.trim();
  const hasGoogle = includesAny(sourceText, ['google']);
  const hasBing = includesAny(sourceText, ['bing', 'microsoft']);
  const hasInstagram = includesAny(sourceText, ['instagram']) || utmSource === 'ig';
  const hasFacebook = includesAny(sourceText, ['facebook', 'meta']) || utmSource === 'fb';
  const hasLinkedIn = includesAny(sourceText, ['linkedin']);
  const hasYouTube = includesAny(sourceText, ['youtube', 'youtu.be']);

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
