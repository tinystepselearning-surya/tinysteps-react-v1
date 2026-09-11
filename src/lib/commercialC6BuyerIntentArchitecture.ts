import {
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_STATUS,
} from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import {
  COMMERCIAL_C5_OWNER_FLOWS,
  COMMERCIAL_C5_STATUS,
} from './commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE,
  COMMERCIAL_C6_R0_STATUS,
} from './commercialC6BuyerIntentAudit';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C6_R1_REVISION = '2026-09-11-c6-r1';
export const COMMERCIAL_C6_R1_STATUS = 'buyer-intent-architecture-validated';

export type CommercialC6ArchitectureAction =
  | 'KEEP_DEDICATED_OWNER'
  | 'EMBED_IN_EXISTING_OWNER'
  | 'CONSOLIDATE_TO_PRICING'
  | 'HOLD_EXISTING_OWNER';

export type CommercialC6EvidenceTier = 'STRONG' | 'MODERATE' | 'LIMITED';
export type CommercialC6ImplementationState =
  | 'EXISTING_SUFFICIENT'
  | 'R2_APPROVED'
  | 'LATER_BRICK'
  | 'NO_CHANGE';

export type CommercialC6ArchitectureDecision = {
  id: string;
  queryFamily: string;
  buyerStage: 'comparison' | 'price' | 'format-value' | 'enrolment';
  subjects: readonly string[];
  evidenceTier: CommercialC6EvidenceTier;
  evidenceBasis: readonly string[];
  canonicalOwnerPath: string;
  action: CommercialC6ArchitectureAction;
  implementationState: CommercialC6ImplementationState;
  rationale: string;
  newUrlAuthorized: false;
};

const decision = (value: CommercialC6ArchitectureDecision) => freeze({
  ...value,
  subjects: freezeList(value.subjects),
  evidenceBasis: freezeList(value.evidenceBasis),
});

const evidenceById = new Map(COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.map((entry) => [entry.id, entry]));

function requireR0Evidence(id: string) {
  const row = evidenceById.get(id);
  if (!row) throw new Error(`C6-R1 requires C6-R0 evidence row ${id}.`);
  return row;
}

const phonicsComparison = requireR0Evidence('ph-best');
const phonicsPrice = requireR0Evidence('ph-fees');
const readingPrice = requireR0Evidence('rd-price');
const grammarPrice = requireR0Evidence('gr-fees');
const writingPrice = requireR0Evidence('wr-fees');
const spokenEnglishPrice = requireR0Evidence('se-fees');
const publicSpeakingPrice = requireR0Evidence('ps-fees');

/**
 * R1 converts R0 evidence into an explicit architecture decision. It is
 * intentionally conservative: observed buyer language can justify stronger
 * support inside an existing owner without automatically justifying a new URL.
 *
 * The 11 Sep 2026 live SERP spot check is documented in the R1 markdown file.
 * It is directional validation, not a substitute for authenticated GSC demand.
 */
export const COMMERCIAL_C6_R1_ARCHITECTURE = freezeList<Readonly<CommercialC6ArchitectureDecision>>([
  decision({
    id: 'phonics-comparison',
    queryFamily: 'best / compare / review phonics classes',
    buyerStage: 'comparison',
    subjects: ['phonics'],
    evidenceTier: 'STRONG',
    evidenceBasis: [
      `${phonicsComparison.id}:${phonicsComparison.evidenceStrength}`,
      'C2 dedicated comparison ownership',
      'existing comparison page has decision gates, scorecard, red flags and fee handoff',
    ],
    canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
    action: 'KEEP_DEDICATED_OWNER',
    implementationState: 'EXISTING_SUFFICIENT',
    rationale: 'Phonics already has the only evidence-backed dedicated comparison owner. R1 protects it rather than cloning its template across subjects.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'public-speaking-comparison',
    queryFamily: 'best / compare public speaking classes for kids',
    buyerStage: 'comparison',
    subjects: ['public_speaking', 'communication'],
    evidenceTier: 'MODERATE',
    evidenceBasis: [
      'C1 AI-style comparison research',
      '11 Sep 2026 live SERP spot check shows buyer-guide/listicle comparison results',
      'existing /speaking page already contains a parent comparison checklist',
    ],
    canonicalOwnerPath: '/speaking',
    action: 'EMBED_IN_EXISTING_OWNER',
    implementationState: 'EXISTING_SUFFICIENT',
    rationale: 'Comparison language is real, but the programme owner already answers the decision need. A second public-speaking comparison URL would create unnecessary ownership pressure.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'broad-english-tutor-comparison',
    queryFamily: 'best online English class / tutor / 1:1-vs-group decision',
    buyerStage: 'comparison',
    subjects: ['broad_english', 'tutor'],
    evidenceTier: 'MODERATE',
    evidenceBasis: [
      'C1 AI-style comparison research',
      'existing Tiny Steps parent decision guide',
      '11 Sep 2026 live SERP spot check shows buyer guides centred on child need, format, feedback and fit',
    ],
    canonicalOwnerPath: '/online-english-classes-for-kids',
    action: 'EMBED_IN_EXISTING_OWNER',
    implementationState: 'NO_CHANGE',
    rationale: 'The broad programme owner and supporting parent decision guide already cover the selection problem; R1 does not create a competing best-English URL.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'grammar-comparison',
    queryFamily: 'best / compare grammar or grammar-writing classes',
    buyerStage: 'comparison',
    subjects: ['grammar', 'writing'],
    evidenceTier: 'LIMITED',
    evidenceBasis: [
      'C1 AI-style comparison research',
      'no distinct dedicated comparison owner in C2',
      '11 Sep 2026 live SERP spot check did not establish a stronger separate comparison surface than the programme owner',
    ],
    canonicalOwnerPath: '/grammar',
    action: 'HOLD_EXISTING_OWNER',
    implementationState: 'NO_CHANGE',
    rationale: 'Comparison intent is not yet strong enough to justify either a new URL or body-copy expansion purely for best/comparison phrasing.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'phonics-price-research',
    queryFamily: 'phonics fees / cost / price research',
    buyerStage: 'price',
    subjects: ['phonics'],
    evidenceTier: 'STRONG',
    evidenceBasis: [
      `${phonicsPrice.id}:${phonicsPrice.evidenceStrength}`,
      'C2 dedicated price-research ownership',
      'existing market benchmark methodology and Tiny Steps price context',
    ],
    canonicalOwnerPath: '/phonics-fees-india',
    action: 'KEEP_DEDICATED_OWNER',
    implementationState: 'EXISTING_SUFFICIENT',
    rationale: 'Phonics fee research is materially deeper than a thin fee landing page and remains the only dedicated subject price owner.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'non-phonics-subject-fees',
    queryFamily: 'reading / grammar / writing / spoken English / public speaking fees',
    buyerStage: 'price',
    subjects: ['reading', 'grammar', 'writing', 'spoken_english', 'public_speaking'],
    evidenceTier: 'MODERATE',
    evidenceBasis: [
      `${readingPrice.id}:${readingPrice.evidenceStrength}`,
      `${grammarPrice.id}:${grammarPrice.evidenceStrength}`,
      `${writingPrice.id}:${writingPrice.evidenceStrength}`,
      `${spokenEnglishPrice.id}:${spokenEnglishPrice.evidenceStrength}`,
      `${publicSpeakingPrice.id}:${publicSpeakingPrice.evidenceStrength}`,
      'C2 general-pricing ownership',
      '11 Sep 2026 live SERP spot check confirms parents encounter fee/value information within provider and buyer-decision surfaces',
    ],
    canonicalOwnerPath: '/pricing',
    action: 'CONSOLIDATE_TO_PRICING',
    implementationState: 'R2_APPROVED',
    rationale: 'Observed subject-fee language for writing, spoken English and public speaking plus the existing C2 pricing decision supports subject-aware navigation inside /pricing, not five new fee URLs.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'format-value-comparison',
    queryFamily: '1:1 vs group English classes for kids',
    buyerStage: 'format-value',
    subjects: ['cross-programme'],
    evidenceTier: 'MODERATE',
    evidenceBasis: [
      'existing /pricing value-comparison section',
      '11 Sep 2026 live SERP spot check shows current 1:1-vs-group decision guides',
      'C5 /pricing parent question is format fit and value before assessment',
    ],
    canonicalOwnerPath: '/pricing',
    action: 'CONSOLIDATE_TO_PRICING',
    implementationState: 'R2_APPROVED',
    rationale: 'Format/value comparison belongs with the cross-programme pricing owner and should be made easier to navigate without changing price ownership.',
    newUrlAuthorized: false,
  }),
  decision({
    id: 'post-demo-enrolment',
    queryFamily: 'what to confirm after demo before enrolling',
    buyerStage: 'enrolment',
    subjects: ['phonics', 'public_speaking', 'broad_english'],
    evidenceTier: 'MODERATE',
    evidenceBasis: [
      'C1 enrolment-stage parent questions',
      'C5 keeps /book-demo as the single conversion owner',
      'programme owners retain the learning-fit decision after assessment',
    ],
    canonicalOwnerPath: '/book-demo',
    action: 'HOLD_EXISTING_OWNER',
    implementationState: 'LATER_BRICK',
    rationale: 'Post-demo enrolment support is legitimate but belongs in a later C6 brick so R2 can stay focused on fee/value architecture and avoid conversion-owner drift.',
    newUrlAuthorized: false,
  }),
]);

export const COMMERCIAL_C6_R1_R2_APPROVALS = freezeList([
  freeze({
    ownerPath: '/pricing',
    implementation: 'Add subject-aware fee/value navigation that routes parents to the relevant programme owner while keeping all non-phonics fee ownership on /pricing.',
    evidenceDecisionIds: freezeList(['non-phonics-subject-fees', 'format-value-comparison']),
    metadataChangeAllowed: false,
    canonicalChangeAllowed: false,
    newUrlAllowed: false,
  }),
]);

export const COMMERCIAL_C6_R1_POLICY = freeze({
  architectureValidated: true,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  r2BodyCopyAllowedOnlyForApprovedOwners: true,
  r2ApprovedOwnerPaths: freezeList(COMMERCIAL_C6_R1_R2_APPROVALS.map((entry) => entry.ownerPath)),
  rule: 'C6-R2 may change body copy only on explicitly approved existing owners. Titles, descriptions, canonicals, C2 ownership and the C5 conversion owner remain frozen while C4 observes its controls.',
});

export const COMMERCIAL_C6_R1_SUMMARY = freeze({
  architectureDecisionCount: COMMERCIAL_C6_R1_ARCHITECTURE.length,
  newOwnersAuthorized: COMMERCIAL_C6_R1_ARCHITECTURE.filter((entry) => entry.newUrlAuthorized).length,
  r2ApprovedOwnerPaths: COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths,
  pricingOwner: '/pricing',
  comparisonOwner: '/best-online-phonics-classes-for-kids-in-india',
  conversionOwner: '/book-demo',
});

export function getCommercialC6R1Snapshot() {
  return freeze({
    revision: COMMERCIAL_C6_R1_REVISION,
    status: COMMERCIAL_C6_R1_STATUS,
    architecture: COMMERCIAL_C6_R1_ARCHITECTURE,
    r2Approvals: COMMERCIAL_C6_R1_R2_APPROVALS,
    policy: COMMERCIAL_C6_R1_POLICY,
    summary: COMMERCIAL_C6_R1_SUMMARY,
  });
}

if (COMMERCIAL_C6_R0_STATUS !== 'buyer-intent-audit-complete') throw new Error('C6-R1 requires completed C6-R0 audit.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C6-R1 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C6-R1 must preserve the active C4 control window.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C6-R1 requires completed C5 decision flow.');
if (COMMERCIAL_C5_OWNER_FLOWS.length !== 14) throw new Error('C6-R1 requires the full C5 owner graph.');
if (COMMERCIAL_C6_R1_ARCHITECTURE.some((entry) => entry.newUrlAuthorized)) throw new Error('C6-R1 authorizes no new commercial URLs.');
if (COMMERCIAL_C6_R1_R2_APPROVALS.length !== 1 || COMMERCIAL_C6_R1_R2_APPROVALS[0].ownerPath !== '/pricing') {
  throw new Error('C6-R1 approves only /pricing for C6-R2 body-copy implementation.');
}
const generalPricingOwner = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find((entry) => entry.id === 'general-pricing');
if (generalPricingOwner?.canonicalOwnerPath !== '/pricing') throw new Error('C6-R1 requires /pricing to remain the general pricing owner.');
