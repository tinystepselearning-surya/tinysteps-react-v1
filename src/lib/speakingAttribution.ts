import {
  classifyCommercialAcquisitionChannel,
  type CommercialAcquisitionChannel,
  type CommercialLeadAttribution,
} from './commercialC0Foundation';
import {
  resolveStoredLeadAcquisition,
  type AcquisitionClassification,
} from './leadAcquisition';
import {
  SPEAKING_AI_ANSWER_OWNERS,
  SPEAKING_AI_KNOWLEDGE_PATHS,
} from './speakingAiVisibility';

export const SPEAKING_ATTRIBUTION_REVISION = '2026-09-19-b13-v2';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

const SPEAKING_ORIGIN_ANSWER_OWNER_IDS = freezeList([
  'public-speaking-programme',
  'spoken-english-programme',
  'confidence-programme',
  'public-speaking-foundations',
  'public-speaking-excellence',
  'speaking-progress-method',
  'speaking-resource-discovery',
]);

const speakingAnswerOwnerPaths = SPEAKING_AI_ANSWER_OWNERS
  .filter((item) => SPEAKING_ORIGIN_ANSWER_OWNER_IDS.includes(item.id))
  .map((item) => item.path);

export const SPEAKING_ATTRIBUTION_ORIGIN_PATHS = freezeList(
  Array.from(new Set([
    ...speakingAnswerOwnerPaths,
    ...SPEAKING_AI_KNOWLEDGE_PATHS,
    '/shy-child-speaking-confidence',
  ])),
);

export type SpeakingAttributionLeadLike = {
  status?: unknown;
  source?: unknown;
  sourceDetail?: unknown;
  demoSessionId?: unknown;
  programInterest?: unknown;
  interestTrack?: unknown;
  landingPage?: unknown;
  conversionPage?: unknown;
  acquisitionChannel?: unknown;
  acquisitionSource?: unknown;
  attribution?: {
    landingPage?: unknown;
    conversionPage?: unknown;
    firstSeenAt?: unknown;
    referrer?: unknown;
    referrerDomain?: unknown;
    utm_source?: unknown;
    utm_medium?: unknown;
    utm_campaign?: unknown;
    utm_content?: unknown;
    utm_term?: unknown;
    utmSource?: unknown;
    utmMedium?: unknown;
    utmCampaign?: unknown;
    utmContent?: unknown;
    utmTerm?: unknown;
    gclid?: unknown;
    fbclid?: unknown;
    msclkid?: unknown;
  } | null;
};

export type SpeakingAttributionProjection = {
  landingPage: string;
  conversionPage: string;
  businessChannel: CommercialAcquisitionChannel;
  diagnosticAcquisition: AcquisitionClassification;
  speakingOrigin: boolean;
  speakingInterest: boolean;
  reachedDemo: boolean;
  admitted: boolean;
  attributionEvidence: 'stored_first_touch' | 'missing';
};

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

function normalizedPath(value: unknown): string {
  const raw = text(value);
  if (!raw.startsWith('/')) return '';
  const withoutQuery = raw.split(/[?#]/, 1)[0] || '/';
  if (withoutQuery === '/') return '/';
  return withoutQuery.toLowerCase().replace(/\/+$/, '') || '/';
}

function attributionValue(
  attribution: SpeakingAttributionLeadLike['attribution'],
  snake: keyof NonNullable<SpeakingAttributionLeadLike['attribution']>,
  camel?: keyof NonNullable<SpeakingAttributionLeadLike['attribution']>,
): string | undefined {
  const first = text(attribution?.[snake]);
  if (first) return first;
  if (!camel) return undefined;
  const second = text(attribution?.[camel]);
  return second || undefined;
}

export function getSpeakingLeadFirstTouch(
  lead: SpeakingAttributionLeadLike,
): CommercialLeadAttribution {
  const attribution = lead.attribution || {};
  return {
    landingPage:
      normalizedPath(lead.landingPage)
      || normalizedPath(attribution.landingPage)
      || null,
    firstSeenAt: text(attribution.firstSeenAt) || null,
    referrer: text(attribution.referrer) || null,
    referrerDomain: text(attribution.referrerDomain) || null,
    utmSource: attributionValue(attribution, 'utm_source', 'utmSource') || null,
    utmMedium: attributionValue(attribution, 'utm_medium', 'utmMedium') || null,
    utmCampaign: attributionValue(attribution, 'utm_campaign', 'utmCampaign') || null,
    utmTerm: attributionValue(attribution, 'utm_term', 'utmTerm') || null,
    utmContent: attributionValue(attribution, 'utm_content', 'utmContent') || null,
    gclid: text(attribution.gclid) || null,
    fbclid: text(attribution.fbclid) || null,
    msclkid: text(attribution.msclkid) || null,
  };
}

export function isSpeakingOriginLead(lead: SpeakingAttributionLeadLike): boolean {
  const firstTouch = getSpeakingLeadFirstTouch(lead);
  const path = normalizedPath(firstTouch.landingPage);
  return Boolean(path) && SPEAKING_ATTRIBUTION_ORIGIN_PATHS.includes(path);
}

export function isSpeakingInterestLead(lead: SpeakingAttributionLeadLike): boolean {
  const programInterest = text(lead.programInterest).toLowerCase();
  const interestTrack = text(lead.interestTrack).toLowerCase();
  return (
    ['speaking', 'public speaking', 'speaking & communication', 'communication'].includes(programInterest)
    || interestTrack === 'public_speaking'
  );
}

export function hasSpeakingLeadReachedDemo(lead: SpeakingAttributionLeadLike): boolean {
  if (text(lead.demoSessionId)) return true;
  return [
    'demo_pending_schedule',
    'demo_booked',
    'demo_completed',
    'admission_follow_up',
    'admitted_confirmed',
  ].includes(text(lead.status).toLowerCase());
}

export function isSpeakingLeadAdmitted(lead: SpeakingAttributionLeadLike): boolean {
  return text(lead.status).toLowerCase() === 'admitted_confirmed';
}

function broadChannelFromDiagnostic(
  diagnostic: AcquisitionClassification,
): CommercialAcquisitionChannel {
  if (diagnostic.channel === 'google_organic' || diagnostic.channel === 'bing_organic') {
    return 'organic_search';
  }
  if (
    diagnostic.channel === 'chatgpt'
    || diagnostic.channel === 'google_gemini'
    || diagnostic.channel === 'perplexity'
    || diagnostic.channel === 'microsoft_copilot'
    || diagnostic.channel === 'claude'
  ) {
    return 'organic_ai';
  }
  if (diagnostic.channel === 'google_ads' || diagnostic.channel === 'microsoft_ads') {
    return 'paid';
  }
  if (
    diagnostic.channel === 'instagram'
    || diagnostic.channel === 'facebook'
    || diagnostic.channel === 'linkedin'
    || diagnostic.channel === 'youtube'
    || diagnostic.channel === 'referral'
  ) {
    return 'referral';
  }
  return 'direct_or_unknown';
}

export function buildSpeakingAttributionProjection(
  lead: SpeakingAttributionLeadLike,
): SpeakingAttributionProjection {
  const firstTouch = getSpeakingLeadFirstTouch(lead);
  const attribution = lead.attribution || {};
  const diagnosticAcquisition = resolveStoredLeadAcquisition({
    acquisitionChannel: text(lead.acquisitionChannel) || null,
    acquisitionSource: text(lead.acquisitionSource) || null,
    referrer: text(attribution.referrer) || undefined,
    referrerDomain: text(attribution.referrerDomain) || undefined,
    utmSource: attributionValue(attribution, 'utm_source', 'utmSource'),
    utmMedium: attributionValue(attribution, 'utm_medium', 'utmMedium'),
    utmCampaign: attributionValue(attribution, 'utm_campaign', 'utmCampaign'),
    gclid: text(attribution.gclid) || undefined,
    fbclid: text(attribution.fbclid) || undefined,
    msclkid: text(attribution.msclkid) || undefined,
  });

  const conversionPage =
    normalizedPath(lead.conversionPage)
    || normalizedPath(attribution.conversionPage)
    || '';

  const rawBusinessChannel = classifyCommercialAcquisitionChannel(firstTouch);
  const businessChannel =
    rawBusinessChannel !== 'direct_or_unknown'
      ? rawBusinessChannel
      : broadChannelFromDiagnostic(diagnosticAcquisition);

  const hasEvidence = Boolean(
    firstTouch.landingPage
    || firstTouch.referrerDomain
    || firstTouch.utmSource
    || firstTouch.utmMedium
    || firstTouch.gclid
    || firstTouch.fbclid
    || firstTouch.msclkid
    || text(lead.acquisitionChannel)
    || text(lead.acquisitionSource),
  );

  return freeze({
    landingPage: normalizedPath(firstTouch.landingPage),
    conversionPage,
    businessChannel,
    diagnosticAcquisition,
    speakingOrigin: isSpeakingOriginLead(lead),
    speakingInterest: isSpeakingInterestLead(lead),
    reachedDemo: hasSpeakingLeadReachedDemo(lead),
    admitted: isSpeakingLeadAdmitted(lead),
    attributionEvidence: hasEvidence ? 'stored_first_touch' : 'missing',
  });
}

export const SPEAKING_ATTRIBUTION_MEASUREMENT = freeze({
  hierarchy: freezeList([
    'Google Search Console: query and landing-page search visibility',
    'canonical lead record: unique lead and stored first-touch attribution',
    'demo lifecycle: lead-to-demo progression',
    'lead status admitted_confirmed: admission truth propagated from demo conversionStatus enrolled',
  ]),
  channelPolicy: freeze({
    organicSearch: 'organic_search' as const,
    organicAi: 'organic_ai' as const,
    aiReportedSeparatelyFromSearch: true,
    paidOverridesOrganic: true,
    unattributedBackfilledAsOrganic: false,
  }),
  cohortPolicy: freeze({
    speakingOriginDefinition: 'first landing page is in the frozen Speaking authority territory',
    speakingInterestDefinition: 'lead explicitly records Speaking/public_speaking interest',
    originAndInterestMustStaySeparate: true,
    firstTouchOnly: true,
    admissionCohortMaturityDays: 28,
  }),
  causalityPolicy: freeze({
    queryToLeadJoinAvailable: false,
    queryToAdmissionJoinAllowed: false,
    landingPageToLeadJoinAvailable: true,
    landingPageToAdmissionJoinAvailable: true,
    rule:
      'GSC query/page data may explain search visibility, but admission attribution is limited to stored first-touch channel and landing-page evidence. Never claim that a specific search query caused a lead or admission without query-level evidence stored on that lead.',
  }),
  sourceOfTruth: freeze({
    firstTouchCapture: 'src/lib/leadAttribution.ts + src/lib/publicLeadForm.ts',
    serverEnrichment: 'functions/src/enrichPublicLeadAttribution.ts',
    lifecycle: 'functions/src/leadLifecycle.ts',
    adminReporting: 'src/pages/admin/LeadSourceAnalysis.tsx',
    searchVisibility: 'Google Search Console',
  }),
});

if (!SPEAKING_ATTRIBUTION_ORIGIN_PATHS.includes('/speaking')) {
  throw new Error('Brick 13 requires /speaking inside the Speaking-origin attribution territory.');
}

if (SPEAKING_ATTRIBUTION_ORIGIN_PATHS.includes('/book-demo') || SPEAKING_ATTRIBUTION_ORIGIN_PATHS.includes('/pricing')) {
  throw new Error('Brick 13 must not classify generic decision pages as Speaking-origin SEO.');
}

if (new Set(SPEAKING_ATTRIBUTION_ORIGIN_PATHS).size !== SPEAKING_ATTRIBUTION_ORIGIN_PATHS.length) {
  throw new Error('Brick 13 Speaking-origin attribution paths must remain unique.');
}

if (SPEAKING_ATTRIBUTION_MEASUREMENT.causalityPolicy.queryToAdmissionJoinAllowed) {
  throw new Error('Brick 13 must not fabricate query-level admission attribution.');
}
