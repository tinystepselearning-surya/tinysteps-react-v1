import { SEMANTIC_FACTS } from '../config/semanticFacts';
import { KNOWLEDGE_BASE_FINAL_STATUS } from './knowledgeBaseFinalClosure.js';

export const COMMERCIAL_C0_REVISION = '2026-09-10-c0';
export const COMMERCIAL_C0_STATUS = 'frozen';

export type LeadLifecycleStatus =
  | 'new'
  | 'attempted_contact'
  | 'contacted'
  | 'qualified'
  | 'demo_pending_schedule'
  | 'demo_booked'
  | 'demo_completed'
  | 'admission_follow_up'
  | 'admitted_confirmed'
  | 'not_interested'
  | 'wrong_fit'
  | 'no_response'
  | 'lost';

export type CommercialAcquisitionChannel =
  | 'organic_search'
  | 'organic_ai'
  | 'paid'
  | 'referral'
  | 'direct_or_unknown';

export type CommercialLeadAttribution = {
  landingPage?: string | null;
  firstSeenAt?: string | null;
  referrer?: string | null;
  referrerDomain?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
};

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C0_SOURCES = freeze({
  commercialFacts: 'src/config/semanticFacts.ts',
  pricingMath: 'src/config/pricing.ts',
  browserAttribution: 'src/lib/conversionTracking.ts',
  analyticsTransport: 'src/lib/analytics.ts',
  leadLifecycle: 'functions/src/leadLifecycle.ts',
  knowledgeFreeze: 'src/lib/knowledgeBaseFinalClosure.js',
});

/**
 * Commercial facts are projections of SEMANTIC_FACTS, never a second editable
 * facts table. C1+ must consume this projection (or SEMANTIC_FACTS directly)
 * rather than introduce page-local pricing, duration, age or programme claims.
 */
export const COMMERCIAL_C0_FACTS = freeze({
  brand: freeze({
    name: SEMANTIC_FACTS.brand.name,
    positioning: SEMANTIC_FACTS.brand.positioning,
    websiteOrigin: SEMANTIC_FACTS.brand.websiteOrigin,
  }),
  audience: freeze({
    coreAgeMin: SEMANTIC_FACTS.audience.coreAgeMin,
    coreAgeMax: SEMANTIC_FACTS.audience.coreAgeMax,
    coreLabel: SEMANTIC_FACTS.audience.coreLabel,
  }),
  delivery: freeze({
    mode: SEMANTIC_FACTS.delivery.mode,
    oneToOneFormat: SEMANTIC_FACTS.delivery.standardOneToOne.format,
    oneToOneDurationMinutes: SEMANTIC_FACTS.delivery.standardOneToOne.durationMinutes,
    assessmentFormat: SEMANTIC_FACTS.delivery.assessment.format,
    assessmentDurationMinutes: SEMANTIC_FACTS.delivery.assessment.durationMinutes,
    assessmentSessionCount: SEMANTIC_FACTS.delivery.assessment.sessionCount,
    assessmentPriceInr: SEMANTIC_FACTS.delivery.assessment.priceInr,
    assessmentBookingPath: SEMANTIC_FACTS.delivery.assessment.bookingPath,
  }),
  pricing: freeze({
    currency: SEMANTIC_FACTS.pricing.currency,
    standardOneToOnePerClassInr: SEMANTIC_FACTS.pricing.standardOneToOnePerClassInr,
    standardSmallGroupMinPerClassInr: SEMANTIC_FACTS.pricing.standardSmallGroupMinPerClassInr,
    standardSmallGroupMaxPerClassInr: SEMANTIC_FACTS.pricing.standardSmallGroupMaxPerClassInr,
    pricingPath: SEMANTIC_FACTS.pricing.pricingPath,
  }),
  programmes: freeze({
    coreLabels: freezeList(SEMANTIC_FACTS.programmes.coreLabels),
    phonics: freeze({
      label: SEMANTIC_FACTS.programmes.phonics.label,
      commercialPath: SEMANTIC_FACTS.programmes.phonics.commercialPath,
    }),
    grammar: freeze({
      label: SEMANTIC_FACTS.programmes.grammar.label,
      commercialPath: SEMANTIC_FACTS.programmes.grammar.commercialPath,
    }),
    speaking: freeze({
      label: SEMANTIC_FACTS.programmes.speaking.label,
      commercialPath: SEMANTIC_FACTS.programmes.speaking.commercialPath,
    }),
  }),
  serviceArea: freeze({
    primaryCountry: SEMANTIC_FACTS.serviceArea.primaryCountry,
    city: SEMANTIC_FACTS.serviceArea.city,
    region: SEMANTIC_FACTS.serviceArea.region,
    onlineReach: SEMANTIC_FACTS.serviceArea.onlineReach,
  }),
  learnerReach: freeze({
    minimumLearners: SEMANTIC_FACTS.learnerReach.minimumLearners,
    minimumCountries: SEMANTIC_FACTS.learnerReach.minimumCountries,
  }),
});

export const COMMERCIAL_C0_QUALIFYING_STATUSES = freezeList<LeadLifecycleStatus>([
  'qualified',
  'demo_pending_schedule',
  'demo_booked',
  'demo_completed',
  'admission_follow_up',
  'admitted_confirmed',
]);

export const COMMERCIAL_C0_TERMINAL_NON_QUALIFIED_STATUSES = freezeList<LeadLifecycleStatus>([
  'not_interested',
  'wrong_fit',
  'no_response',
  'lost',
]);

const SEARCH_REFERRER_PATTERNS = freezeList([
  /(^|\.)google\./i,
  /(^|\.)bing\.com$/i,
  /(^|\.)search\.yahoo\.com$/i,
  /(^|\.)duckduckgo\.com$/i,
  /(^|\.)ecosia\.org$/i,
  /(^|\.)brave\.com$/i,
  /(^|\.)yandex\./i,
  /(^|\.)baidu\.com$/i,
]);

const AI_REFERRER_PATTERNS = freezeList([
  /(^|\.)chatgpt\.com$/i,
  /(^|\.)perplexity\.ai$/i,
  /(^|\.)gemini\.google\.com$/i,
  /(^|\.)copilot\.microsoft\.com$/i,
  /(^|\.)claude\.ai$/i,
]);

const PAID_MEDIUM_PATTERN = /(^|[_\-])(cpc|ppc|paid|paidsearch|paid_social|display|retargeting)([_\-]|$)/i;
const ORGANIC_MEDIUM_PATTERN = /(^|[_\-])(organic|seo)([_\-]|$)/i;

function normalize(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesAny(value: string, patterns: readonly RegExp[]): boolean {
  return Boolean(value) && patterns.some((pattern) => pattern.test(value));
}

function sourceLooksLikeAi(value: string): boolean {
  return /(^|[^a-z])(chatgpt|perplexity|gemini|copilot|claude)([^a-z]|$)/i.test(value);
}

export function classifyCommercialAcquisitionChannel(
  attribution: CommercialLeadAttribution | null | undefined,
): CommercialAcquisitionChannel {
  if (!attribution) return 'direct_or_unknown';

  const utmSource = normalize(attribution.utmSource);
  const utmMedium = normalize(attribution.utmMedium);
  const referrerDomain = normalize(attribution.referrerDomain);

  if (attribution.gclid || attribution.fbclid || attribution.msclkid || PAID_MEDIUM_PATTERN.test(utmMedium)) {
    return 'paid';
  }

  if (sourceLooksLikeAi(utmSource) || matchesAny(referrerDomain, AI_REFERRER_PATTERNS)) {
    return 'organic_ai';
  }

  if (ORGANIC_MEDIUM_PATTERN.test(utmMedium) || matchesAny(referrerDomain, SEARCH_REFERRER_PATTERNS)) {
    return 'organic_search';
  }

  if (referrerDomain) return 'referral';
  return 'direct_or_unknown';
}

export function isCommercialQualifiedLeadStatus(status: string | null | undefined): boolean {
  const normalized = normalize(status) as LeadLifecycleStatus;
  return COMMERCIAL_C0_QUALIFYING_STATUSES.includes(normalized);
}

export function isCommercialTerminalNonQualifiedStatus(status: string | null | undefined): boolean {
  const normalized = normalize(status) as LeadLifecycleStatus;
  return COMMERCIAL_C0_TERMINAL_NON_QUALIFIED_STATUSES.includes(normalized);
}

export function isQualifiedOrganicLead(input: {
  status?: string | null;
  attribution?: CommercialLeadAttribution | null;
}): boolean {
  return (
    isCommercialQualifiedLeadStatus(input.status) &&
    classifyCommercialAcquisitionChannel(input.attribution) === 'organic_search'
  );
}

export function isQualifiedAiReferralLead(input: {
  status?: string | null;
  attribution?: CommercialLeadAttribution | null;
}): boolean {
  return (
    isCommercialQualifiedLeadStatus(input.status) &&
    classifyCommercialAcquisitionChannel(input.attribution) === 'organic_ai'
  );
}

export const COMMERCIAL_C0_EVENT_CONTRACT = freeze({
  traffic: freezeList(['page_view', 'funnel_landing_page_view']),
  intent: freezeList(['funnel_cta_click', 'book_demo_click', 'whatsapp_click']),
  submission: freezeList(['lead_form_submit', 'generate_lead']),
  rule:
    'Traffic, CTA and form events are diagnostic funnel signals. They must never be reported as qualified leads without a qualifying canonical lead lifecycle status.',
});

export const COMMERCIAL_C0_MEASUREMENT = freeze({
  primaryKpi: 'qualified_organic_leads_per_day',
  countingUnit: 'distinct canonical lead record',
  timezone: 'Asia/Kolkata',
  baseline: freeze({
    minPerDay: 6,
    maxPerDay: 7,
    provenance: 'Commercial SEO & Lead Growth project brief',
    kind: 'declared planning baseline',
  }),
  target: freeze({
    minPerDay: 11,
    maxPerDay: 12,
    requirement: 'sustained',
  }),
  reporting: freeze({
    monitoringWindowDays: 7,
    decisionWindowDays: 28,
    primaryChannel: 'organic_search' as const,
    aiReferralPolicy: 'report-separately' as const,
    unattributedPolicy: 'do-not-backfill-as-organic' as const,
  }),
  qualification: freeze({
    sourceOfTruth: 'canonical lead lifecycle status',
    qualifyingStatuses: COMMERCIAL_C0_QUALIFYING_STATUSES,
    terminalNonQualifiedStatuses: COMMERCIAL_C0_TERMINAL_NON_QUALIFIED_STATUSES,
  }),
  attribution: freeze({
    sourceOfTruth: 'stored first-touch attribution on the canonical lead record',
    fields: freezeList([
      'landingPage',
      'firstSeenAt',
      'referrerDomain',
      'utmSource',
      'utmMedium',
      'utmCampaign',
      'gclid',
      'fbclid',
      'msclkid',
    ]),
    ga4Role: 'traffic-and-funnel-corroboration-not-lead-qualification',
  }),
});

export const COMMERCIAL_C0_GUARDRAILS = freeze({
  knowledgeBaseMustRemainFrozen: true,
  commercialKeywordResearchBeginsAt: 'C1',
  canonicalCommercialOwnershipBeginsAt: 'C2',
  pageOptimizationAllowed: false,
  newCommercialUrlsAllowed: false,
  newInformationalUrlsAllowed: false,
  rule:
    'C0 may define facts, qualification, attribution and measurement only. It must not change commercial titles, H1s, page copy, keyword ownership, knowledge content or URL architecture.',
});

export function getCommercialC0Snapshot() {
  return freeze({
    revision: COMMERCIAL_C0_REVISION,
    status: COMMERCIAL_C0_STATUS,
    sources: COMMERCIAL_C0_SOURCES,
    facts: COMMERCIAL_C0_FACTS,
    eventContract: COMMERCIAL_C0_EVENT_CONTRACT,
    measurement: COMMERCIAL_C0_MEASUREMENT,
    guardrails: COMMERCIAL_C0_GUARDRAILS,
  });
}

if (KNOWLEDGE_BASE_FINAL_STATUS !== 'frozen') {
  throw new Error('Commercial C0 requires KB-FINAL to remain frozen before commercial work begins.');
}

if (COMMERCIAL_C0_FACTS.delivery.oneToOneDurationMinutes <= 0) {
  throw new Error('Commercial C0 requires a valid standard 1:1 duration.');
}
if (COMMERCIAL_C0_FACTS.delivery.assessmentPriceInr !== 0) {
  throw new Error('Commercial C0 detected drift in the free assessment fact.');
}
if (COMMERCIAL_C0_FACTS.pricing.standardOneToOnePerClassInr <= 0) {
  throw new Error('Commercial C0 requires a valid standard 1:1 price.');
}
if (COMMERCIAL_C0_MEASUREMENT.target.minPerDay <= COMMERCIAL_C0_MEASUREMENT.baseline.maxPerDay) {
  throw new Error('Commercial C0 target must exceed the declared baseline.');
}
