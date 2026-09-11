import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS, COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY, COMMERCIAL_C5_STATUS } from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_STATUS } from './commercialC6ValidationFreeze';
import {
  COMMERCIAL_C7_R1_OWNER_MAPPINGS,
  COMMERCIAL_C7_R1_POLICY,
  COMMERCIAL_C7_R1_STATUS,
  type CommercialC7R1OwnerFamily,
  type CommercialC7R1OwnerMapping,
} from './commercialC7KnowledgeOwnerMapping';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C7_R2_REVISION = '2026-09-11-c7-r2';
export const COMMERCIAL_C7_R2_STATUS = 'intent-next-step-rules-validated';

export type CommercialC7R2RuleClass =
  | 'SOFT_DISCOVERY'
  | 'OWNER_HANDOFF'
  | 'RESEARCH_HANDOFF'
  | 'OWNER_THEN_ASSESSMENT'
  | 'ASSESSMENT_FIRST';

export type CommercialC7R2PromptStrength = 'NONE' | 'SOFT' | 'CONTEXTUAL' | 'DECISION';
export type CommercialC7R2AssessmentRole = 'NONE' | 'SECONDARY' | 'PRIMARY';

export type CommercialC7R2NextStepRule = {
  path: string;
  ownerFamily: CommercialC7R1OwnerFamily;
  ruleClass: CommercialC7R2RuleClass;
  primaryDestination: string | null;
  secondaryDestination: string | null;
  promptStrength: CommercialC7R2PromptStrength;
  assessmentRole: CommercialC7R2AssessmentRole;
  maxCommercialPrompts: 0 | 1 | 2;
  preserveCurrentOwner: boolean;
  rationale: string;
};

const frozenOwnerPaths = new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath));
const researchOwnerFamilies = new Set<CommercialC7R1OwnerFamily>(['phonics-comparison', 'phonics-fees', 'general-pricing']);
const programmeOwnerFamilies = new Set<CommercialC7R1OwnerFamily>([
  'phonics-programme',
  'reading-programme',
  'reading-fluency',
  'grammar-programme',
  'writing-programme',
  'spoken-english',
  'public-speaking',
  'confidence-building',
  'broad-english',
]);

function isProblemAware(mapping: CommercialC7R1OwnerMapping) {
  const text = [...mapping.intents, ...mapping.evidenceIds, mapping.path].join(' ').toLowerCase();
  return (
    mapping.intents.includes('problem-aware') ||
    text.includes('diagnostic') ||
    text.includes('problem') ||
    text.includes('cannot') ||
    text.includes('slow-reader') ||
    text.includes('does-not-speak') ||
    text.includes('shy')
  );
}

function ruleFor(mapping: CommercialC7R1OwnerMapping): Readonly<CommercialC7R2NextStepRule> {
  if (!mapping.primaryCommercialOwner || mapping.decision === 'HOLD_SOFT_DISCOVERY') {
    return freeze({
      path: mapping.path,
      ownerFamily: mapping.ownerFamily,
      ruleClass: 'SOFT_DISCOVERY' as const,
      primaryDestination: null,
      secondaryDestination: null,
      promptStrength: 'NONE' as const,
      assessmentRole: 'NONE' as const,
      maxCommercialPrompts: 0 as const,
      preserveCurrentOwner: true,
      rationale:
        'Early practice or home-routine discovery stays informational. R2 does not force a programme, price or assessment CTA where R1 found no evidence-backed commercial owner.',
    });
  }

  if (mapping.primaryCommercialOwner === '/book-demo' || mapping.decision === 'PRESERVE_ASSESSMENT_FIRST') {
    return freeze({
      path: mapping.path,
      ownerFamily: mapping.ownerFamily,
      ruleClass: 'ASSESSMENT_FIRST' as const,
      primaryDestination: '/book-demo',
      secondaryDestination: null,
      promptStrength: 'DECISION' as const,
      assessmentRole: 'PRIMARY' as const,
      maxCommercialPrompts: 1 as const,
      preserveCurrentOwner: true,
      rationale:
        'When the underlying programme need is genuinely unresolved, the free assessment is the next decision rather than guessing a programme or sending the parent to pricing.',
    });
  }

  if (researchOwnerFamilies.has(mapping.ownerFamily)) {
    return freeze({
      path: mapping.path,
      ownerFamily: mapping.ownerFamily,
      ruleClass: 'RESEARCH_HANDOFF' as const,
      primaryDestination: mapping.primaryCommercialOwner,
      secondaryDestination: null,
      promptStrength: 'CONTEXTUAL' as const,
      assessmentRole: 'NONE' as const,
      maxCommercialPrompts: 1 as const,
      preserveCurrentOwner: mapping.currentOwnerAlreadyLinked,
      rationale:
        'Comparison, fee and value intent should continue into the dedicated frozen research owner. R2 does not bypass that decision step with an assessment-first CTA.',
    });
  }

  if (programmeOwnerFamilies.has(mapping.ownerFamily)) {
    const assessmentAlreadyPresent = mapping.currentTargets.includes('/book-demo');
    const allowSecondaryAssessment = assessmentAlreadyPresent || isProblemAware(mapping);
    return freeze({
      path: mapping.path,
      ownerFamily: mapping.ownerFamily,
      ruleClass: allowSecondaryAssessment ? ('OWNER_THEN_ASSESSMENT' as const) : ('OWNER_HANDOFF' as const),
      primaryDestination: mapping.primaryCommercialOwner,
      secondaryDestination: allowSecondaryAssessment ? '/book-demo' : null,
      promptStrength: 'CONTEXTUAL' as const,
      assessmentRole: allowSecondaryAssessment ? ('SECONDARY' as const) : ('NONE' as const),
      maxCommercialPrompts: allowSecondaryAssessment ? (2 as const) : (1 as const),
      preserveCurrentOwner: mapping.currentOwnerAlreadyLinked,
      rationale: allowSecondaryAssessment
        ? 'Problem-aware knowledge should first explain the relevant programme route, with the free assessment available only as a secondary child-specific next step.'
        : 'Programme-aware informational content should hand off to the one frozen programme owner without adding an unnecessary second commercial prompt.',
    });
  }

  throw new Error(`C7-R2 has no rule for owner family ${mapping.ownerFamily} on ${mapping.path}.`);
}

export const COMMERCIAL_C7_R2_NEXT_STEP_RULES = freezeList<Readonly<CommercialC7R2NextStepRule>>(
  COMMERCIAL_C7_R1_OWNER_MAPPINGS.map(ruleFor),
);

const ruleByPath = new Map(COMMERCIAL_C7_R2_NEXT_STEP_RULES.map((rule) => [rule.path, rule]));

export const COMMERCIAL_C7_R2_POLICY = freeze({
  architectureOnly: true,
  implementationDeferredToR3: true,
  liveKnowledgeCopyChangesAllowed: false,
  newKnowledgeUrlsAllowed: false,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  singleConversionOwner: '/book-demo' as const,
  maxCommercialPromptsPerKnowledgeSurface: 2,
  practiceMayRouteDirectlyToAssessment: false,
  homeRoutineMayRouteDirectlyToAssessment: false,
  priceOwnerRequiresPriceOrResearchIntent: true,
  comparisonOwnerMustNotBeBypassed: true,
  programmeOwnerPrecedesSecondaryAssessment: true,
  rule:
    'C7-R2 controls the strength and order of knowledge-to-commercial handoffs. Early discovery remains soft, comparison/fee intent stays with its frozen research owner, programme/problem-aware content routes to the mapped owner before any secondary assessment prompt, and /book-demo is primary only when the correct programme cannot be resolved from the knowledge intent.',
});

export const COMMERCIAL_C7_R2_SUMMARY = freeze({
  ruleCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.length,
  softDiscoveryCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'SOFT_DISCOVERY').length,
  ownerHandoffCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'OWNER_HANDOFF').length,
  researchHandoffCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'RESEARCH_HANDOFF').length,
  ownerThenAssessmentCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'OWNER_THEN_ASSESSMENT').length,
  assessmentFirstCount: COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'ASSESSMENT_FIRST').length,
});

export function getCommercialC7R2NextStepRule(path: string) {
  return ruleByPath.get(path) ?? null;
}

export function getCommercialC7R2Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_R2_REVISION,
    status: COMMERCIAL_C7_R2_STATUS,
    rules: COMMERCIAL_C7_R2_NEXT_STEP_RULES,
    policy: COMMERCIAL_C7_R2_POLICY,
    summary: COMMERCIAL_C7_R2_SUMMARY,
  });
}

if (COMMERCIAL_C7_R1_STATUS !== 'knowledge-owner-mapping-validated') throw new Error('C7-R2 requires validated C7-R1 owner mapping.');
if (!COMMERCIAL_C7_R1_POLICY.architectureOnly) throw new Error('C7-R2 requires R1 to remain architecture-only.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C7-R2 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C7-R2 must preserve active C4 controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented' || COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C7-R2 requires the C5 single conversion owner.');
if (COMMERCIAL_C6_STATUS !== 'frozen') throw new Error('C7-R2 requires frozen C6 architecture.');
if (COMMERCIAL_C7_R2_NEXT_STEP_RULES.length !== COMMERCIAL_C7_R1_OWNER_MAPPINGS.length) throw new Error('C7-R2 must account for every R1 mapping.');
for (const rule of COMMERCIAL_C7_R2_NEXT_STEP_RULES) {
  if (rule.primaryDestination && rule.primaryDestination !== '/book-demo' && !frozenOwnerPaths.has(rule.primaryDestination)) {
    throw new Error(`C7-R2 mapped ${rule.path} outside the frozen C2 owner set.`);
  }
  if (rule.secondaryDestination && rule.secondaryDestination !== '/book-demo') {
    throw new Error(`C7-R2 permits only /book-demo as a secondary commercial destination.`);
  }
  if (rule.maxCommercialPrompts > 2) throw new Error(`C7-R2 permits at most two commercial prompts on ${rule.path}.`);
  if (rule.ruleClass === 'SOFT_DISCOVERY' && (rule.primaryDestination || rule.secondaryDestination)) {
    throw new Error(`C7-R2 soft discovery must not carry a commercial destination on ${rule.path}.`);
  }
  if (rule.ruleClass === 'OWNER_THEN_ASSESSMENT' && rule.secondaryDestination !== '/book-demo') {
    throw new Error(`C7-R2 owner-then-assessment rule must keep /book-demo secondary on ${rule.path}.`);
  }
}
