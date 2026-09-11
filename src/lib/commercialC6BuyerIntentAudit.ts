import {
  COMMERCIAL_C1_KEYWORD_UNIVERSE,
  COMMERCIAL_C1_STATUS,
  type CommercialIntent,
  type CommercialSubject,
  type ParentStage,
} from './commercialC1SearchUniverse';
import {
  COMMERCIAL_C1_AI_STYLE_QUERIES,
  COMMERCIAL_C1_DECLARED_OPERATING_PRIORS,
  COMMERCIAL_C1_ENHANCEMENT_STATUS,
  COMMERCIAL_C1_INTERNATIONAL_QUERIES,
  type InternationalMarketId,
} from './commercialC1InternationalAiResearch';
import {
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_STATUS,
  resolveCommercialC2Ownership,
  type CommercialOwnerRole,
} from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import {
  COMMERCIAL_C5_OWNER_FLOWS,
  COMMERCIAL_C5_STATUS,
} from './commercialC5ConversionFlow';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C6_R0_REVISION = '2026-09-11-c6-r0';
export const COMMERCIAL_C6_R0_STATUS = 'buyer-intent-audit-complete';

export type CommercialC6BuyerStage = 'comparison' | 'price' | 'enrolment';
export type CommercialC6EvidenceSource = 'c1-base' | 'c1-international' | 'c1-ai-style';
export type CommercialC6EvidenceStrength =
  | 'observed-serp'
  | 'observed-ai'
  | 'observed-site'
  | 'hypothesis'
  | 'international-research'
  | 'ai-style-research';
export type CommercialC6CoverageClass =
  | 'dedicated-comparison-owner'
  | 'dedicated-price-research-owner'
  | 'cross-programme-pricing-hub'
  | 'existing-programme-owner';

export type CommercialC6BuyerIntentEvidence = {
  id: string;
  text: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  buyerStage: CommercialC6BuyerStage;
  source: CommercialC6EvidenceSource;
  evidenceStrength: CommercialC6EvidenceStrength;
  market: InternationalMarketId | 'global' | 'india' | null;
  ownerPath: string;
  ownerRole: CommercialOwnerRole;
  coverageClass: CommercialC6CoverageClass;
};

const BUYER_STAGES = new Set<ParentStage>(['comparison', 'price', 'enrolment']);
const c2ClusterById = new Map(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => [entry.id, entry]));

function asBuyerStage(stage: ParentStage): CommercialC6BuyerStage {
  if (stage === 'comparison' || stage === 'price' || stage === 'enrolment') return stage;
  throw new Error(`C6-R0 received non-buyer stage ${stage}.`);
}

function coverageClassFor(ownerPath: string, ownerRole: CommercialOwnerRole, buyerStage: CommercialC6BuyerStage): CommercialC6CoverageClass {
  if (buyerStage === 'comparison' && ownerRole === 'comparison') return 'dedicated-comparison-owner';
  if (buyerStage === 'price' && ownerRole === 'price-research') return 'dedicated-price-research-owner';
  if (buyerStage === 'price' && ownerPath === '/pricing') return 'cross-programme-pricing-hub';
  return 'existing-programme-owner';
}

function resolveEvidence(input: {
  id: string;
  text: string;
  subject: CommercialSubject;
  intent: CommercialIntent;
  parentStage: ParentStage;
  source: CommercialC6EvidenceSource;
  evidenceStrength: CommercialC6EvidenceStrength;
  market?: InternationalMarketId | 'global' | 'india' | null;
  c1Action?: 'KEEP' | 'OPTIMISE' | 'CONSOLIDATE' | 'BUILD' | 'HOLD' | null;
}): Readonly<CommercialC6BuyerIntentEvidence> {
  const ownership = resolveCommercialC2Ownership({
    id: input.id,
    text: input.text,
    subject: input.subject,
    intent: input.intent,
    parentStage: input.parentStage,
    source: input.source,
    market: input.market ?? null,
    c1Action: input.c1Action ?? null,
  });
  const cluster = c2ClusterById.get(ownership.clusterId);
  if (!cluster) throw new Error(`C6-R0 could not resolve C2 cluster ${ownership.clusterId}.`);

  const buyerStage = asBuyerStage(input.parentStage);
  return freeze({
    id: input.id,
    text: input.text,
    subject: input.subject,
    intent: input.intent,
    parentStage: input.parentStage,
    buyerStage,
    source: input.source,
    evidenceStrength: input.evidenceStrength,
    market: input.market ?? null,
    ownerPath: ownership.canonicalOwnerPath,
    ownerRole: cluster.ownerRole,
    coverageClass: coverageClassFor(ownership.canonicalOwnerPath, cluster.ownerRole, buyerStage),
  });
}

const baseBuyerEvidence = COMMERCIAL_C1_KEYWORD_UNIVERSE
  .filter((entry) => BUYER_STAGES.has(entry.parentStage))
  .map((entry) => resolveEvidence({
    id: entry.id,
    text: entry.query,
    subject: entry.subject,
    intent: entry.intent,
    parentStage: entry.parentStage,
    source: 'c1-base',
    evidenceStrength: entry.demandSignal,
    market: entry.query.toLowerCase().includes('india') ? 'india' : null,
    c1Action: entry.recommendedAction,
  }));

const internationalBuyerEvidence = COMMERCIAL_C1_INTERNATIONAL_QUERIES
  .filter((entry) => BUYER_STAGES.has(entry.parentStage))
  .map((entry) => resolveEvidence({
    id: entry.id,
    text: entry.query,
    subject: entry.subject,
    intent: entry.intent,
    parentStage: entry.parentStage,
    source: 'c1-international',
    evidenceStrength: 'international-research',
    market: entry.market,
  }));

const aiStyleBuyerEvidence = COMMERCIAL_C1_AI_STYLE_QUERIES
  .filter((entry) => BUYER_STAGES.has(entry.parentStage))
  .map((entry) => resolveEvidence({
    id: entry.id,
    text: entry.prompt,
    subject: entry.subject,
    intent: entry.intent,
    parentStage: entry.parentStage,
    source: 'c1-ai-style',
    evidenceStrength: 'ai-style-research',
    market: entry.market,
  }));

export const COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE = freezeList([
  ...baseBuyerEvidence,
  ...internationalBuyerEvidence,
  ...aiStyleBuyerEvidence,
]);

export const COMMERCIAL_C6_R0_CORE_SURFACE_AUDIT = freezeList([
  freeze({
    path: '/best-online-phonics-classes-for-kids-in-india',
    role: 'dedicated-comparison-owner' as const,
    sourcePath: 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx',
    strengths: freezeList([
      'child-fit decision gates',
      '1:1 vs small-group vs self-practice comparison',
      'provider scorecard',
      'demo questions and red flags',
      'Tiny Steps evidence links',
      'pricing handoff',
      'direct assessment CTA',
    ]),
    auditFinding: 'Strong existing phonics buyer-comparison surface; do not clone it into thin subject-by-subject best pages.',
  }),
  freeze({
    path: '/phonics-fees-india',
    role: 'dedicated-price-research-owner' as const,
    sourcePath: 'src/pages/public/PhonicsFeesIndiaPage.tsx',
    strengths: freezeList([
      '1:1 and group market fee bands kept separate',
      'effective per-live-class comparison',
      'Tiny Steps standard pricing and package context',
      'comparison checklist',
      'free assessment CTA',
      'research-method transparency',
      'handoff to the cross-programme pricing hub',
    ]),
    auditFinding: 'Strong subject-specific fee-research owner with a defensible research methodology and clear Tiny Steps price context.',
  }),
  freeze({
    path: '/pricing',
    role: 'cross-programme-pricing-hub' as const,
    sourcePath: 'src/pages/PricingPage.tsx',
    strengths: freezeList([
      'standard 1:1 per-class and package pricing',
      'small-group pricing and duration context',
      'standard vs native-teacher option separation',
      '1:1 vs group value framing',
      'free assessment before package selection',
      'phonics-fee research handoff',
      'structured offer schema',
    ]),
    auditFinding: 'Correct cross-programme owner for non-phonics fee/value queries; subject-specific fee pages are not justified by default.',
  }),
]);

export const COMMERCIAL_C6_R0_GAPS = freezeList([
  freeze({
    id: 'non-phonics-comparison-evidence',
    severity: 'RESEARCH' as const,
    finding: 'AI-style comparison demand exists for public speaking, tutor, grammar and broad English, but base observed commercial evidence is much thinner than phonics.',
    nextStep: 'Validate search demand and SERP shape in C6-R1 before any new comparison URL or major comparison-copy expansion.',
    newUrlAuthorized: false,
  }),
  freeze({
    id: 'subject-fee-intent-consolidated',
    severity: 'OPPORTUNITY' as const,
    finding: 'Reading, grammar, writing, spoken-English and public-speaking fee intent is consolidated into /pricing by C2. Some subject-fee phrases are observed in SERPs, but dedicated ownership is not established.',
    nextStep: 'Keep /pricing canonical; use later C6 work to improve subject-aware value navigation without spawning fee-page variants.',
    newUrlAuthorized: false,
  }),
  freeze({
    id: 'enrolment-decision-support',
    severity: 'OPPORTUNITY' as const,
    finding: 'C1 contains post-demo enrolment questions for broad English, phonics and public speaking. C2 correctly routes them to existing programme owners, but the decision-support layer can be made more explicit later.',
    nextStep: 'Design enrolment/objection support in C6-R3 without creating a second conversion owner; /book-demo remains the C5 conversion endpoint.',
    newUrlAuthorized: false,
  }),
  freeze({
    id: 'budget-objection-is-prior-not-measurement',
    severity: 'GUARDRAIL' as const,
    finding: `The ${COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.leadBudgetDropOff.approximateRatePct}% budget drop-off figure is a declared operating heuristic, not audited funnel performance.`,
    nextStep: 'Use it only to prioritise objection research until C0/C5 lead tracking produces reliable measured evidence.',
    newUrlAuthorized: false,
  }),
  freeze({
    id: 'avoid-template-proliferation',
    severity: 'GUARDRAIL' as const,
    finding: 'Only phonics currently earns both a dedicated comparison owner and a dedicated fee-research owner.',
    nextStep: 'Do not mass-produce best/fees/comparison pages for every subject; require query evidence, distinct decision need and C2-safe ownership first.',
    newUrlAuthorized: false,
  }),
]);

const buyerEvidenceByStage = (stage: CommercialC6BuyerStage) =>
  COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.filter((entry) => entry.buyerStage === stage);

export const COMMERCIAL_C6_R0_SUMMARY = freeze({
  totalBuyerIntentEvidenceRows: COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.length,
  comparisonEvidenceRows: buyerEvidenceByStage('comparison').length,
  priceEvidenceRows: buyerEvidenceByStage('price').length,
  enrolmentEvidenceRows: buyerEvidenceByStage('enrolment').length,
  dedicatedComparisonOwners: freezeList(
    COMMERCIAL_C2_OWNERSHIP_CLUSTERS
      .filter((entry) => entry.ownerRole === 'comparison')
      .map((entry) => entry.canonicalOwnerPath),
  ),
  dedicatedPriceResearchOwners: freezeList(
    COMMERCIAL_C2_OWNERSHIP_CLUSTERS
      .filter((entry) => entry.ownerRole === 'price-research')
      .map((entry) => entry.canonicalOwnerPath),
  ),
  pricingHub: '/pricing',
  conversionOwner: '/book-demo',
});

export const COMMERCIAL_C6_R0_POLICY = freeze({
  auditOnly: true,
  livePageCopyChangesAllowed: false,
  titleChangesAllowed: false,
  metaDescriptionChangesAllowed: false,
  canonicalChangesAllowed: false,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4ControlMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  rule: 'C6-R0 inventories buyer/comparison/fee/enrolment coverage only. C6-R1 must validate evidence before architecture or page changes.',
});

export function getCommercialC6R0Snapshot() {
  return freeze({
    revision: COMMERCIAL_C6_R0_REVISION,
    status: COMMERCIAL_C6_R0_STATUS,
    evidence: COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE,
    coreSurfaces: COMMERCIAL_C6_R0_CORE_SURFACE_AUDIT,
    gaps: COMMERCIAL_C6_R0_GAPS,
    summary: COMMERCIAL_C6_R0_SUMMARY,
    policy: COMMERCIAL_C6_R0_POLICY,
  });
}

if (COMMERCIAL_C1_STATUS !== 'research-complete') throw new Error('C6-R0 requires completed C1 research.');
if (COMMERCIAL_C1_ENHANCEMENT_STATUS !== 'research-complete') throw new Error('C6-R0 requires completed C1 international/AI research.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C6-R0 requires completed C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C6-R0 must preserve the active C4 control window.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C6-R0 requires completed C5 decision flow.');
if (COMMERCIAL_C5_OWNER_FLOWS.length !== 14) throw new Error('C6-R0 requires the full 14-owner C5 graph.');
if (COMMERCIAL_C6_R0_SUMMARY.dedicatedComparisonOwners.length !== 1) throw new Error('C6-R0 expects exactly one dedicated comparison owner at baseline.');
if (COMMERCIAL_C6_R0_SUMMARY.dedicatedPriceResearchOwners.length !== 1) throw new Error('C6-R0 expects exactly one dedicated price-research owner at baseline.');
if (!COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.length) throw new Error('C6-R0 buyer-intent evidence cannot be empty.');
