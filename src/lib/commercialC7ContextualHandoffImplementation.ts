import { COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY, COMMERCIAL_C5_STATUS } from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_STATUS } from './commercialC6ValidationFreeze';
import {
  COMMERCIAL_C7_R2_NEXT_STEP_RULES,
  COMMERCIAL_C7_R2_POLICY,
  COMMERCIAL_C7_R2_STATUS,
  getCommercialC7R2NextStepRule,
  type CommercialC7R2RuleClass,
} from './commercialC7IntentNextStepRules';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C7_R3_REVISION = '2026-09-11-c7-r3';
export const COMMERCIAL_C7_R3_STATUS = 'contextual-commercial-handoffs-implemented';

export type CommercialC7R3Prompt = {
  to: string;
  label: string;
};

export type CommercialC7R3Handoff = {
  path: string;
  ruleClass: CommercialC7R2RuleClass;
  heading: string;
  intro: string;
  primary: Readonly<CommercialC7R3Prompt>;
  secondary: Readonly<CommercialC7R3Prompt> | null;
  maxCommercialPrompts: 1 | 2;
};

function labelFor(destination: string) {
  const labels: Record<string, string> = {
    '/phonics': 'Explore the Tiny Steps phonics programme',
    '/best-online-phonics-classes-for-kids-in-india': 'Compare online phonics class options',
    '/phonics-fees-india': 'Review phonics fees and value',
    '/reading-classes-for-kids': 'Explore reading classes for kids',
    '/reading-fluency-program': 'Explore the reading fluency programme',
    '/grammar': 'Explore the Tiny Steps grammar programme',
    '/writing-classes-for-kids': 'Explore writing classes for kids',
    '/spoken-english-classes-for-kids-online': 'Explore spoken English classes for kids',
    '/speaking': 'Explore public speaking and communication classes',
    '/confidence-building-program-kids': 'Explore the confidence-building programme',
    '/online-english-classes-for-kids': 'Explore the right English programme',
    '/pricing': 'Review Tiny Steps fees and class options',
    '/book-demo': 'Start with the free 35-minute assessment',
  };
  return labels[destination] ?? 'Explore the next Tiny Steps learning step';
}

function headingFor(ruleClass: CommercialC7R2RuleClass) {
  if (ruleClass === 'RESEARCH_HANDOFF') return 'Compare the next step before you decide';
  if (ruleClass === 'OWNER_THEN_ASSESSMENT') return 'Choose the programme first, then assess the starting point';
  if (ruleClass === 'ASSESSMENT_FIRST') return 'Use the assessment to identify the right starting point';
  return 'Continue with the learning path that matches this need';
}

function introFor(ruleClass: CommercialC7R2RuleClass) {
  if (ruleClass === 'RESEARCH_HANDOFF') {
    return 'This topic has a clear research step. Use the dedicated comparison or fee guide rather than jumping straight to enrolment.';
  }
  if (ruleClass === 'OWNER_THEN_ASSESSMENT') {
    return 'The learning need points to one programme. Review that pathway first; use the free assessment only for a child-specific starting point.';
  }
  if (ruleClass === 'ASSESSMENT_FIRST') {
    return 'The underlying need can span more than one programme, so an assessment is the safest next decision.';
  }
  return 'If this is the same need you see in your child, the relevant programme is the most useful next step.';
}

export const COMMERCIAL_C7_R3_HANDOFFS = freezeList<Readonly<CommercialC7R3Handoff>>(
  COMMERCIAL_C7_R2_NEXT_STEP_RULES
    .filter((rule) => rule.ruleClass !== 'SOFT_DISCOVERY' && Boolean(rule.primaryDestination))
    .map((rule) =>
      freeze({
        path: rule.path,
        ruleClass: rule.ruleClass,
        heading: headingFor(rule.ruleClass),
        intro: introFor(rule.ruleClass),
        primary: freeze({ to: rule.primaryDestination as string, label: labelFor(rule.primaryDestination as string) }),
        secondary: rule.secondaryDestination
          ? freeze({ to: rule.secondaryDestination, label: labelFor(rule.secondaryDestination) })
          : null,
        maxCommercialPrompts: rule.maxCommercialPrompts as 1 | 2,
      }),
    ),
);

const handoffByPath = new Map(COMMERCIAL_C7_R3_HANDOFFS.map((handoff) => [handoff.path, handoff]));

export const COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES = freezeList([
  freeze({ path: '/blog', reason: 'The blog library is a discovery surface with intent-specific article routes, not a single commercial CTA surface.' }),
  freeze({ path: '/parents', reason: 'The Parents Hub already orchestrates multiple concern-specific programme routes and the free assessment.' }),
  freeze({ path: '/resources/phonics', reason: 'Subject hub already exposes the phonics programme and assessment.' }),
  freeze({ path: '/resources/grammar', reason: 'Subject hub already exposes the grammar programme and assessment.' }),
  freeze({ path: '/resources/speaking', reason: 'Subject hub already exposes the speaking programme and assessment.' }),
  freeze({ path: '/child-not-reading-properly', reason: 'Standalone reading-gap page already exposes phonics/reading support and assessment.' }),
  freeze({ path: '/slow-reader-child-help', reason: 'Standalone problem page already contains the specialist fluency owner and assessment.' }),
  freeze({ path: '/shy-child-speaking-confidence', reason: 'Standalone problem page already contains the confidence owner and assessment.' }),
]);

const protectedExistingPathSet = new Set(COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES.map((item) => item.path));
const usesSharedR3Renderer = (path: string) => path.startsWith('/blog/') || path.startsWith('/resources/phonics/');

export const COMMERCIAL_C7_R3_POLICY = freeze({
  liveContextualHandoffsAllowed: true,
  implementationSurfaces: freezeList(['blog-shared-pipeline', 'focused-phonics-shared-renderer']),
  directBlogBodyEditsAllowed: false,
  newKnowledgeUrlsAllowed: false,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  singleConversionOwner: '/book-demo' as const,
  maxCommercialPromptsPerKnowledgeSurface: 2,
  softDiscoveryReceivesCommercialPrompt: false,
  preserveExistingCorrectStandaloneHandoffs: true,
  everyNonSoftRuleMustBeRenderedOrProtected: true,
  rule:
    'C7-R3 implements only R2-authorised contextual handoffs through shared knowledge renderers. It does not edit individual blog bodies, create URLs, change metadata or mutate frozen commercial ownership. Existing navigation/decision hubs and standalone pages that already expose the correct next steps are explicitly protected rather than duplicated.',
});

export const COMMERCIAL_C7_R3_SUMMARY = freeze({
  handoffCount: COMMERCIAL_C7_R3_HANDOFFS.length,
  blogHandoffCount: COMMERCIAL_C7_R3_HANDOFFS.filter((item) => item.path.startsWith('/blog/')).length,
  focusedPhonicsHandoffCount: COMMERCIAL_C7_R3_HANDOFFS.filter((item) => item.path.startsWith('/resources/phonics/')).length,
  protectedExistingSurfaceCount: COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES.length,
});

export function getCommercialC7R3Handoff(path: string) {
  return handoffByPath.get(path) ?? null;
}

export function getCommercialC7R3Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_R3_REVISION,
    status: COMMERCIAL_C7_R3_STATUS,
    handoffs: COMMERCIAL_C7_R3_HANDOFFS,
    protectedExistingSurfaces: COMMERCIAL_C7_R3_PROTECTED_EXISTING_SURFACES,
    policy: COMMERCIAL_C7_R3_POLICY,
    summary: COMMERCIAL_C7_R3_SUMMARY,
  });
}

if (COMMERCIAL_C7_R2_STATUS !== 'intent-next-step-rules-validated') throw new Error('C7-R3 requires validated C7-R2 rules.');
if (!COMMERCIAL_C7_R2_POLICY.implementationDeferredToR3) throw new Error('C7-R3 requires R2 implementation handoff.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C7-R3 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C7-R3 must preserve active C4 controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented' || COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C7-R3 requires the C5 single conversion owner.');
if (COMMERCIAL_C6_STATUS !== 'frozen') throw new Error('C7-R3 requires frozen C6 architecture.');
for (const handoff of COMMERCIAL_C7_R3_HANDOFFS) {
  const rule = getCommercialC7R2NextStepRule(handoff.path);
  if (!rule) throw new Error(`C7-R3 lost the R2 rule for ${handoff.path}.`);
  const promptCount = 1 + (handoff.secondary ? 1 : 0);
  if (promptCount > handoff.maxCommercialPrompts || promptCount > 2) throw new Error(`C7-R3 exceeded the prompt cap on ${handoff.path}.`);
  if (handoff.ruleClass === 'OWNER_THEN_ASSESSMENT' && handoff.secondary?.to !== '/book-demo') {
    throw new Error(`C7-R3 must keep assessment secondary on ${handoff.path}.`);
  }
  if (!usesSharedR3Renderer(handoff.path) && !protectedExistingPathSet.has(handoff.path)) {
    throw new Error(`C7-R3 has no renderer or protected existing placement for ${handoff.path}.`);
  }
}
