import {
  COMMERCIAL_C1_KEYWORD_UNIVERSE,
  COMMERCIAL_C1_STATUS,
  type CommercialIntent,
  type CommercialSubject,
  type ParentStage,
  type ResearchAction,
} from './commercialC1SearchUniverse';
import {
  COMMERCIAL_C1_AI_STYLE_QUERIES,
  COMMERCIAL_C1_ENHANCEMENT_STATUS,
  type InternationalMarketId,
} from './commercialC1InternationalAiResearch';
import { COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES } from './commercialC1InternationalCoreSubjectCompletion';
import { COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS } from './commercialC1ObservedSearchEvidence';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C2_REVISION = '2026-09-10-c2-r1';
export const COMMERCIAL_C2_STATUS = 'ownership-complete';

export type CommercialKeywordAccountingStatus =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'SEMANTIC'
  | 'SUPPORTING'
  | 'NEW OWNER'
  | 'CONSOLIDATED'
  | 'HOLD'
  | 'REJECT';

export type CommercialOwnerPriority = 'P1' | 'P2' | 'P3';
export type CommercialOwnerRole =
  | 'programme'
  | 'comparison'
  | 'price-research'
  | 'pricing-hub'
  | 'conversion'
  | 'specialist-programme'
  | 'local-programme';

export type CommercialOwnershipCluster = {
  id: string;
  subject: CommercialSubject | 'cross-programme';
  canonicalOwnerPath: string;
  ownerRole: CommercialOwnerRole;
  priority: CommercialOwnerPriority;
  primaryQuery: string;
  supportingPaths: readonly string[];
  forbiddenPrimaryClaimants: readonly string[];
  rationale: string;
};

const cluster = (value: CommercialOwnershipCluster) => freeze({
  ...value,
  supportingPaths: freezeList(value.supportingPaths),
  forbiddenPrimaryClaimants: freezeList(value.forbiddenPrimaryClaimants),
});

/**
 * C2 owns commercial query intent only. Frozen KB informational owners remain
 * intact and may support these pages, but a class/course/tutor/fee/demo query
 * must not be reassigned to an informational resource simply because that
 * resource ranks for a related problem.
 */
export const COMMERCIAL_C2_OWNERSHIP_CLUSTERS = freezeList<CommercialOwnershipCluster>([
  cluster({
    id: 'phonics-provider', subject: 'phonics', canonicalOwnerPath: '/phonics', ownerRole: 'programme', priority: 'P1',
    primaryQuery: 'online phonics classes for kids',
    supportingPaths: ['/best-online-phonics-classes-for-kids-in-india','/phonics-fees-india','/resources/phonics','/child-not-reading-properly'],
    forbiddenPrimaryClaimants: ['/best-online-phonics-classes-for-kids-in-india','/phonics-fees-india','/resources/phonics'],
    rationale: 'Google and Bing already show strong generic phonics-class visibility. Keep generic provider, 1:1, age and international phonics intent concentrated on the main phonics programme.',
  }),
  cluster({
    id: 'phonics-comparison', subject: 'phonics', canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india', ownerRole: 'comparison', priority: 'P1',
    primaryQuery: 'best online phonics classes for kids in india',
    supportingPaths: ['/phonics','/phonics-fees-india','/pricing'],
    forbiddenPrimaryClaimants: ['/phonics','/phonics-fees-india'],
    rationale: 'The dedicated comparison route has observed Google and Bing visibility. Best/review/comparison wording stays here while /phonics owns generic provider intent.',
  }),
  cluster({
    id: 'phonics-price', subject: 'phonics', canonicalOwnerPath: '/phonics-fees-india', ownerRole: 'price-research', priority: 'P1',
    primaryQuery: 'phonics classes fees',
    supportingPaths: ['/pricing','/phonics','/best-online-phonics-classes-for-kids-in-india'],
    forbiddenPrimaryClaimants: ['/phonics','/pricing','/best-online-phonics-classes-for-kids-in-india'],
    rationale: 'Subject-specific phonics fee/cost intent has a dedicated existing owner and observed Bing/Google evidence; /pricing remains the cross-programme price hub.',
  }),
  cluster({
    id: 'reading-provider', subject: 'reading', canonicalOwnerPath: '/reading-classes-for-kids', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'online reading classes for kids',
    supportingPaths: ['/reading-fluency-program','/slow-reader-child-help','/resources/phonics'],
    forbiddenPrimaryClaimants: ['/reading-fluency-program','/slow-reader-child-help','/resources/phonics'],
    rationale: 'Generic reading classes, reading tutor and class-seeking problem queries belong to the broad reading programme; specialist fluency intent remains separate.',
  }),
  cluster({
    id: 'reading-fluency', subject: 'reading', canonicalOwnerPath: '/reading-fluency-program', ownerRole: 'specialist-programme', priority: 'P3',
    primaryQuery: 'reading fluency classes for kids online',
    supportingPaths: ['/reading-classes-for-kids','/slow-reader-child-help','/blog/how-to-improve-reading-fluency-in-children'],
    forbiddenPrimaryClaimants: ['/reading-classes-for-kids','/slow-reader-child-help'],
    rationale: 'Only explicit reading-fluency programme intent belongs here; generic reading-class intent stays with /reading-classes-for-kids.',
  }),
  cluster({
    id: 'grammar-provider', subject: 'grammar', canonicalOwnerPath: '/grammar', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'online grammar classes for kids',
    supportingPaths: ['/writing-classes-for-kids','/blog/how-to-improve-sentence-formation-in-kids','/resources/grammar'],
    forbiddenPrimaryClaimants: ['/english-grammar-writing-classes','/resources/grammar'],
    rationale: 'Generic grammar, sentence-formation and grammar-tutor commercial intent belongs to /grammar. The combined legacy landing must not compete for generic grammar classes.',
  }),
  cluster({
    id: 'writing-provider', subject: 'writing', canonicalOwnerPath: '/writing-classes-for-kids', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'creative writing classes for kids online',
    supportingPaths: ['/grammar','/resources/grammar'],
    forbiddenPrimaryClaimants: ['/english-grammar-writing-classes','/grammar','/resources/grammar'],
    rationale: 'Writing and creative-writing provider intent gets one dedicated programme owner rather than being split with the combined grammar/writing legacy page.',
  }),
  cluster({
    id: 'spoken-english-provider', subject: 'spoken_english', canonicalOwnerPath: '/spoken-english-classes-for-kids-online', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'spoken english classes for kids online',
    supportingPaths: ['/speaking','/shy-child-speaking-confidence','/online-english-classes-for-kids'],
    forbiddenPrimaryClaimants: ['/speaking','/public-speaking-communication-kids','/shy-child-speaking-confidence'],
    rationale: 'Fluency and spoken-English class intent is distinct from public-speaking intent and remains with the dedicated spoken-English route.',
  }),
  cluster({
    id: 'public-speaking-provider', subject: 'public_speaking', canonicalOwnerPath: '/speaking', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'public speaking classes for kids online',
    supportingPaths: ['/spoken-english-classes-for-kids-online','/shy-child-speaking-confidence','/confidence-building-program-kids','/resources/speaking'],
    forbiddenPrimaryClaimants: ['/public-speaking-communication-kids','/resources/speaking'],
    rationale: 'The main speaking programme already has much stronger observed search visibility and frozen commercial ownership; the legacy combined landing must not compete.',
  }),
  cluster({
    id: 'communication-provider', subject: 'communication', canonicalOwnerPath: '/speaking', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'communication skills classes for kids online',
    supportingPaths: ['/confidence-building-program-kids','/shy-child-speaking-confidence','/resources/speaking'],
    forbiddenPrimaryClaimants: ['/public-speaking-communication-kids','/resources/speaking'],
    rationale: 'General communication-skills classes are part of the speaking programme. Exact confidence-building programme intent is the only specialist exception.',
  }),
  cluster({
    id: 'confidence-building', subject: 'communication', canonicalOwnerPath: '/confidence-building-program-kids', ownerRole: 'specialist-programme', priority: 'P3',
    primaryQuery: 'confidence building classes for kids',
    supportingPaths: ['/speaking','/shy-child-speaking-confidence'],
    forbiddenPrimaryClaimants: ['/public-speaking-communication-kids'],
    rationale: 'Preserve the existing specialist programme only for explicit confidence-building programme/class intent; broad communication remains /speaking.',
  }),
  cluster({
    id: 'broad-english-provider', subject: 'broad_english', canonicalOwnerPath: '/online-english-classes-for-kids', ownerRole: 'programme', priority: 'P1',
    primaryQuery: 'online english classes for kids',
    supportingPaths: ['/phonics','/grammar','/speaking','/reading-classes-for-kids','/writing-classes-for-kids','/spoken-english-classes-for-kids-online'],
    forbiddenPrimaryClaimants: ['/online-english-classes-for-kids-india','/blog/online-english-classes-for-kids-india'],
    rationale: 'Broad online-English and international/NRI provider intent needs one global programme chooser. The historical India landing is already redirected here.',
  }),
  cluster({
    id: 'broad-english-hyderabad', subject: 'broad_english', canonicalOwnerPath: '/online-english-classes-hyderabad', ownerRole: 'local-programme', priority: 'P1',
    primaryQuery: 'online english classes for kids in hyderabad',
    supportingPaths: ['/online-english-classes-for-kids','/pricing','/book-demo'],
    forbiddenPrimaryClaimants: ['/online-english-classes-for-kids-india'],
    rationale: 'Hyderabad has an established local commercial surface with substantial observed GSC visibility. Keep it narrow to explicit Hyderabad/local intent.',
  }),
  cluster({
    id: 'english-tutor-provider', subject: 'tutor', canonicalOwnerPath: '/online-english-classes-for-kids', ownerRole: 'programme', priority: 'P2',
    primaryQuery: 'online english tutor for kids',
    supportingPaths: ['/reading-classes-for-kids','/grammar','/phonics','/writing-classes-for-kids'],
    forbiddenPrimaryClaimants: [],
    rationale: 'Generic live 1:1 English tutor intent maps to the broad English programme; subject-qualified tutor intent maps to that subject programme.',
  }),
  cluster({
    id: 'general-pricing', subject: 'cross-programme', canonicalOwnerPath: '/pricing', ownerRole: 'pricing-hub', priority: 'P1',
    primaryQuery: 'online english classes for kids fees',
    supportingPaths: ['/phonics-fees-india','/online-english-classes-for-kids','/grammar','/speaking','/writing-classes-for-kids','/spoken-english-classes-for-kids-online'],
    forbiddenPrimaryClaimants: [],
    rationale: 'Cross-programme fees, price, value and 1:1-versus-group cost intent belongs to /pricing. Phonics is the only subject with a dedicated fee-research owner.',
  }),
  cluster({
    id: 'free-demo-booking', subject: 'cross-programme', canonicalOwnerPath: '/book-demo', ownerRole: 'conversion', priority: 'P1',
    primaryQuery: 'free trial online english classes for kids',
    supportingPaths: ['/online-english-classes-for-kids','/phonics','/grammar','/speaking','/pricing'],
    forbiddenPrimaryClaimants: [],
    rationale: 'Explicit free demo, assessment and trial intent is transactional and should resolve to one conversion owner across programmes and geographies.',
  }),
]);

export type CommercialC2ResearchSource = 'c1-base' | 'c1-international' | 'c1-ai-style';

export type CommercialC2ResearchInput = {
  id: string;
  text: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  source: CommercialC2ResearchSource;
  market?: InternationalMarketId | 'global' | 'india' | null;
  c1Action?: ResearchAction | null;
};

export type CommercialC2KeywordAccount = CommercialC2ResearchInput & {
  clusterId: string;
  canonicalOwnerPath: string;
  status: CommercialKeywordAccountingStatus;
  priority: CommercialOwnerPriority;
};

const byClusterId = new Map(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => [entry.id, entry]));

const normalise = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const has = (text: string, pattern: RegExp) => pattern.test(normalise(text));

function subjectDefaultCluster(subject: CommercialSubject, text: string): string {
  if (subject === 'phonics') return 'phonics-provider';
  if (subject === 'reading') return has(text, /\breading fluency\b/) ? 'reading-fluency' : 'reading-provider';
  if (subject === 'grammar') return 'grammar-provider';
  if (subject === 'writing') return 'writing-provider';
  if (subject === 'spoken_english') return 'spoken-english-provider';
  if (subject === 'public_speaking') return 'public-speaking-provider';
  if (subject === 'communication') return has(text, /\bconfidence building\b/) ? 'confidence-building' : 'communication-provider';
  if (subject === 'broad_english') return has(text, /\bhyderabad\b/) ? 'broad-english-hyderabad' : 'broad-english-provider';
  if (subject === 'tutor') {
    if (has(text, /\bphonics\b/)) return 'phonics-provider';
    if (has(text, /\breading\b/)) return 'reading-provider';
    if (has(text, /\bgrammar\b/)) return 'grammar-provider';
    if (has(text, /\bwriting\b/)) return 'writing-provider';
    return 'english-tutor-provider';
  }
  throw new Error(`No C2 subject default for ${subject satisfies never}`);
}

export function resolveCommercialC2Cluster(input: CommercialC2ResearchInput): CommercialOwnershipCluster {
  let clusterId: string;

  if (input.intent === 'trial-demo') {
    clusterId = 'free-demo-booking';
  } else if (input.intent === 'price') {
    clusterId = input.subject === 'phonics' ? 'phonics-price' : 'general-pricing';
  } else if (
    input.subject === 'phonics'
    && input.intent === 'comparison'
    && has(input.text, /\b(best|compare|comparison|review|versus|vs\.?)(\b|\s)/)
  ) {
    clusterId = 'phonics-comparison';
  } else {
    clusterId = subjectDefaultCluster(input.subject, input.text);
  }

  const resolved = byClusterId.get(clusterId);
  if (!resolved) throw new Error(`C2 resolved unknown cluster ${clusterId} for ${input.id}`);
  return resolved;
}

function statusFor(input: CommercialC2ResearchInput, owner: CommercialOwnershipCluster): CommercialKeywordAccountingStatus {
  if (input.source === 'c1-ai-style') return 'SEMANTIC';
  if (input.c1Action === 'HOLD') return 'HOLD';
  if (normalise(input.text) === normalise(owner.primaryQuery)) return 'PRIMARY';
  return 'SECONDARY';
}

export function resolveCommercialC2Ownership(input: CommercialC2ResearchInput): CommercialC2KeywordAccount {
  const owner = resolveCommercialC2Cluster(input);
  return freeze({
    ...input,
    clusterId: owner.id,
    canonicalOwnerPath: owner.canonicalOwnerPath,
    status: statusFor(input, owner),
    priority: owner.priority,
  });
}

const BASE_INPUTS = COMMERCIAL_C1_KEYWORD_UNIVERSE.map<CommercialC2ResearchInput>((item) => ({
  id: item.id,
  text: item.query,
  subject: item.subject,
  intent: item.intent,
  parentStage: item.parentStage,
  source: 'c1-base',
  market: null,
  c1Action: item.recommendedAction,
}));

const INTERNATIONAL_INPUTS = COMMERCIAL_C1_INTERNATIONAL_ALL_QUERIES.map<CommercialC2ResearchInput>((item) => ({
  id: item.id,
  text: item.query,
  subject: item.subject,
  intent: item.intent,
  parentStage: item.parentStage,
  source: 'c1-international',
  market: item.market,
  c1Action: null,
}));

const AI_INPUTS = COMMERCIAL_C1_AI_STYLE_QUERIES.map<CommercialC2ResearchInput>((item) => ({
  id: item.id,
  text: item.prompt,
  subject: item.subject,
  intent: item.intent,
  parentStage: item.parentStage,
  source: 'c1-ai-style',
  market: item.market,
  c1Action: null,
}));

export const COMMERCIAL_C2_KEYWORD_ACCOUNTING = freezeList([
  ...BASE_INPUTS,
  ...INTERNATIONAL_INPUTS,
  ...AI_INPUTS,
].map(resolveCommercialC2Ownership));

export type CommercialRouteDecision = {
  path: string;
  action: 'KEEP_OWNER' | 'KEEP_SPECIALIST' | 'SUPPORT_ONLY' | 'DEMOTE_TO_SUPPORT' | 'CONSOLIDATED_REDIRECT' | 'CONSOLIDATE_TO_OWNER';
  canonicalOwnerPath: string | null;
  supports: readonly string[];
  reason: string;
};

const routeDecision = (value: CommercialRouteDecision) => freeze({ ...value, supports: freezeList(value.supports) });

export const COMMERCIAL_C2_ROUTE_DECISIONS = freezeList<CommercialRouteDecision>([
  routeDecision({ path:'/phonics', action:'KEEP_OWNER', canonicalOwnerPath:'/phonics', supports:[], reason:'Generic phonics programme owner.' }),
  routeDecision({ path:'/best-online-phonics-classes-for-kids-in-india', action:'KEEP_OWNER', canonicalOwnerPath:'/best-online-phonics-classes-for-kids-in-india', supports:['/phonics'], reason:'Narrow comparison owner only.' }),
  routeDecision({ path:'/phonics-fees-india', action:'KEEP_OWNER', canonicalOwnerPath:'/phonics-fees-india', supports:['/phonics','/pricing'], reason:'Narrow phonics price-research owner only.' }),
  routeDecision({ path:'/reading-classes-for-kids', action:'KEEP_OWNER', canonicalOwnerPath:'/reading-classes-for-kids', supports:[], reason:'Generic reading programme owner.' }),
  routeDecision({ path:'/reading-fluency-program', action:'KEEP_SPECIALIST', canonicalOwnerPath:'/reading-fluency-program', supports:['/reading-classes-for-kids'], reason:'Keep only for explicit reading-fluency programme intent.' }),
  routeDecision({ path:'/grammar', action:'KEEP_OWNER', canonicalOwnerPath:'/grammar', supports:[], reason:'Generic grammar programme owner.' }),
  routeDecision({ path:'/writing-classes-for-kids', action:'KEEP_OWNER', canonicalOwnerPath:'/writing-classes-for-kids', supports:[], reason:'Generic/creative writing programme owner.' }),
  routeDecision({ path:'/english-grammar-writing-classes', action:'DEMOTE_TO_SUPPORT', canonicalOwnerPath:null, supports:['/grammar','/writing-classes-for-kids'], reason:'Combined legacy landing must not claim either generic grammar or generic writing intent; later implementation should reposition it as a chooser/support surface or otherwise reconcile it.' }),
  routeDecision({ path:'/speaking', action:'KEEP_OWNER', canonicalOwnerPath:'/speaking', supports:[], reason:'Public-speaking and general communication owner.' }),
  routeDecision({ path:'/spoken-english-classes-for-kids-online', action:'KEEP_OWNER', canonicalOwnerPath:'/spoken-english-classes-for-kids-online', supports:['/speaking'], reason:'Spoken-English/fluency owner.' }),
  routeDecision({ path:'/public-speaking-communication-kids', action:'CONSOLIDATE_TO_OWNER', canonicalOwnerPath:'/speaking', supports:[], reason:'Legacy combined landing overlaps the stronger /speaking owner and has no distinct C1 commercial cluster.' }),
  routeDecision({ path:'/confidence-building-program-kids', action:'KEEP_SPECIALIST', canonicalOwnerPath:'/confidence-building-program-kids', supports:['/speaking'], reason:'Keep only for explicit confidence-building programme intent.' }),
  routeDecision({ path:'/online-english-classes-for-kids', action:'KEEP_OWNER', canonicalOwnerPath:'/online-english-classes-for-kids', supports:['/phonics','/grammar','/speaking','/reading-classes-for-kids','/writing-classes-for-kids'], reason:'Broad/global/NRI online-English programme owner.' }),
  routeDecision({ path:'/online-english-classes-hyderabad', action:'KEEP_SPECIALIST', canonicalOwnerPath:'/online-english-classes-hyderabad', supports:['/online-english-classes-for-kids'], reason:'Explicit Hyderabad/local owner only.' }),
  routeDecision({ path:'/online-english-classes-for-kids-india', action:'CONSOLIDATED_REDIRECT', canonicalOwnerPath:'/online-english-classes-for-kids', supports:[], reason:'Preserve existing 301; historical GSC data must not trigger resurrection of a duplicate India landing.' }),
  routeDecision({ path:'/blog/online-english-classes-for-kids-india', action:'SUPPORT_ONLY', canonicalOwnerPath:null, supports:['/online-english-classes-for-kids'], reason:'Editorial parent decision guide; must not own generic provider intent.' }),
  routeDecision({ path:'/pricing', action:'KEEP_OWNER', canonicalOwnerPath:'/pricing', supports:[], reason:'Cross-programme pricing/value owner.' }),
  routeDecision({ path:'/book-demo', action:'KEEP_OWNER', canonicalOwnerPath:'/book-demo', supports:[], reason:'Cross-programme free assessment/demo conversion owner.' }),
  routeDecision({ path:'/resources/phonics', action:'SUPPORT_ONLY', canonicalOwnerPath:null, supports:['/phonics','/reading-classes-for-kids'], reason:'Frozen informational discovery hub.' }),
  routeDecision({ path:'/resources/grammar', action:'SUPPORT_ONLY', canonicalOwnerPath:null, supports:['/grammar','/writing-classes-for-kids'], reason:'Frozen informational discovery hub.' }),
  routeDecision({ path:'/resources/speaking', action:'SUPPORT_ONLY', canonicalOwnerPath:null, supports:['/speaking','/spoken-english-classes-for-kids-online'], reason:'Frozen informational discovery hub.' }),
]);

export const COMMERCIAL_C2_GEOGRAPHY_POLICY = freeze({
  newCountryOwnersCreated: 0,
  marketsResearched: freezeList(['UAE','USA','UK','Australia','Singapore','NRI']),
  rule: 'Country/NRI modifiers inherit the relevant core programme owner. C1 proves international visibility but not enough distinct commercial demand to justify six new country owners. Hyderabad remains the evidence-backed local exception.',
});

export const COMMERCIAL_C2_MIXED_INTENT_PRECEDENCE = freezeList([
  'Explicit demo/trial/assessment booking → /book-demo',
  'Subject-specific phonics fee/cost → /phonics-fees-india',
  'Other programme or cross-programme price/value → /pricing',
  'Phonics best/review/compare intent → /best-online-phonics-classes-for-kids-in-india',
  'Explicit specialist reading-fluency or confidence-building intent → specialist programme owner',
  'Explicit Hyderabad broad-English intent → /online-english-classes-hyderabad',
  'Otherwise programme/tutor/age/international intent → relevant core programme owner',
]);

export const COMMERCIAL_C2_GUARDRAILS = freeze({
  c1FrozenBeforeOwnership: true,
  knowledgeBaseOwnershipPreserved: true,
  publicPageChangesInC2: false,
  titleChangesInC2: false,
  h1ChangesInC2: false,
  copyChangesInC2: false,
  redirectChangesInC2: false,
  newCommercialUrlsInC2: false,
  aiPromptPagesAllowed: false,
  countryPagesAllowed: false,
  implementationBeginsAt: 'C3',
});

export function getCommercialC2Snapshot() {
  return freeze({
    revision: COMMERCIAL_C2_REVISION,
    status: COMMERCIAL_C2_STATUS,
    clusters: COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
    keywordAccounting: COMMERCIAL_C2_KEYWORD_ACCOUNTING,
    routeDecisions: COMMERCIAL_C2_ROUTE_DECISIONS,
    geographyPolicy: COMMERCIAL_C2_GEOGRAPHY_POLICY,
    mixedIntentPrecedence: COMMERCIAL_C2_MIXED_INTENT_PRECEDENCE,
    guardrails: COMMERCIAL_C2_GUARDRAILS,
  });
}

if (COMMERCIAL_C1_STATUS !== 'research-complete') throw new Error('C2 requires completed C1 base research.');
if (COMMERCIAL_C1_ENHANCEMENT_STATUS !== 'research-complete') throw new Error('C2 requires completed C1 international/AI research.');
if (COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS !== 'evidence-complete') throw new Error('C2 requires completed observed Google/Bing evidence.');
if (new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((item) => item.id)).size !== COMMERCIAL_C2_OWNERSHIP_CLUSTERS.length) {
  throw new Error('C2 cluster ids must be unique.');
}
if (COMMERCIAL_C2_KEYWORD_ACCOUNTING.some((item) => !item.canonicalOwnerPath || !item.clusterId || !item.status)) {
  throw new Error('Every C1 researched commercial query must resolve to exactly one C2 owner and accounting status.');
}
if (COMMERCIAL_C2_KEYWORD_ACCOUNTING.some((item) => item.status === 'NEW OWNER')) {
  throw new Error('C2 currently creates no new owner; country/AI expansion remains absorbed by evidence-backed existing owners.');
}
