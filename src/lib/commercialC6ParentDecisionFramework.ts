import {
  COMMERCIAL_C1_AI_STYLE_QUERIES,
  COMMERCIAL_C1_DECLARED_OPERATING_PRIORS,
  COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY,
} from './commercialC1InternationalAiResearch';
import { COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import {
  COMMERCIAL_C5_OWNER_FLOWS,
  COMMERCIAL_C5_POLICY,
  COMMERCIAL_C5_STATUS,
} from './commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R1_ARCHITECTURE,
  COMMERCIAL_C6_R1_STATUS,
} from './commercialC6BuyerIntentArchitecture';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C6_R3_REVISION = '2026-09-11-c6-r3';
export const COMMERCIAL_C6_R3_STATUS = 'parent-decision-framework-implemented';

export type CommercialC6R3DecisionGate = {
  id: string;
  title: string;
  parentQuestion: string;
  evidenceQueryIds: readonly string[];
  decisionFactors: readonly string[];
  ownerPath: '/book-demo';
  existingSurfaceMarkers: readonly string[];
  supportingPaths: readonly string[];
};

const aiQueryById = new Map(COMMERCIAL_C1_AI_STYLE_QUERIES.map((entry) => [entry.id, entry]));

function requireAiEvidence(id: string) {
  const row = aiQueryById.get(id);
  if (!row) throw new Error(`C6-R3 requires C1 AI-style evidence row ${id}.`);
  return row;
}

const demoToEnrol = requireAiEvidence('ai-global-demo-to-enrol');
const phonicsEnrol = requireAiEvidence('ai-global-phonics-enrol');
const speakingEnrol = requireAiEvidence('ai-global-speaking-enrol');

const gate = (value: CommercialC6R3DecisionGate) => freeze({
  ...value,
  evidenceQueryIds: freezeList(value.evidenceQueryIds),
  decisionFactors: freezeList(value.decisionFactors),
  existingSurfaceMarkers: freezeList(value.existingSurfaceMarkers),
  supportingPaths: freezeList(value.supportingPaths),
});

/**
 * C6-R3 answers the post-demo question without creating a second conversion
 * surface. The framework is owned by /book-demo because C5 already makes it
 * the sole assessment/conversion owner and the page already contains the
 * assessment result, programme routing, class-format, pricing, timing and
 * decision-support surfaces needed to answer the enrolment-stage evidence.
 */
export const COMMERCIAL_C6_R3_DECISION_GATES = freezeList<Readonly<CommercialC6R3DecisionGate>>([
  gate({
    id: 'assessment-and-programme-fit',
    title: 'Assessment result and programme fit',
    parentQuestion: 'What did the assessment show, and why is this the right programme and starting point?',
    evidenceQueryIds: [phonicsEnrol.id, demoToEnrol.id],
    decisionFactors: ['assessment result', 'programme choice', 'programme fit', 'starting point'],
    ownerPath: '/book-demo',
    existingSurfaceMarkers: [
      'What Will You Understand After the Assessment?',
      'What Can the Assessment Recommend?',
      'Which learning path is being recommended?',
      'Where should your child begin?',
    ],
    supportingPaths: ['/curriculum', '/phonics', '/reading-classes-for-kids', '/grammar', '/writing-classes-for-kids', '/spoken-english-classes-for-kids-online', '/speaking'],
  }),
  gate({
    id: 'teacher-and-trial-fit',
    title: 'Teacher and trial fit',
    parentQuestion: 'Did the child engage with the live teacher and does the teaching experience feel suitable?',
    evidenceQueryIds: [demoToEnrol.id, speakingEnrol.id],
    decisionFactors: ['teacher fit', 'trial experience', 'live teacher'],
    ownerPath: '/book-demo',
    existingSurfaceMarkers: [
      'What Happens in the Demo Assessment?',
      'Watch Class Samples',
      'Free live 1:1 assessment',
    ],
    supportingPaths: ['/class-samples'],
  }),
  gate({
    id: 'class-structure-and-outcomes',
    title: 'Class structure and intended outcomes',
    parentQuestion: 'What will classes focus on, how will they be delivered, and what should improve first?',
    evidenceQueryIds: [speakingEnrol.id, demoToEnrol.id],
    decisionFactors: ['class structure', 'outcomes', 'priority skill', 'class format'],
    ownerPath: '/book-demo',
    existingSurfaceMarkers: [
      'Priority skill',
      'Recommended starting path',
      'Is the suitable option live 1:1 or an available small group?',
    ],
    supportingPaths: ['/curriculum', '/class-samples'],
  }),
  gate({
    id: 'practical-fit',
    title: 'Schedule, format and price fit',
    parentQuestion: 'Do the available timings, class format and current pricing work for the family before committing?',
    evidenceQueryIds: [demoToEnrol.id],
    decisionFactors: ['schedule', 'price', 'class format'],
    ownerPath: '/book-demo',
    existingSurfaceMarkers: [
      'available timings',
      'What does the recommended format currently cost?',
      'View Pricing',
    ],
    supportingPaths: ['/pricing'],
  }),
  gate({
    id: 'progress-expectations',
    title: 'Progress expectations',
    parentQuestion: 'What should the family expect to understand next, and what should not be over-promised from one assessment?',
    evidenceQueryIds: [demoToEnrol.id],
    decisionFactors: ['progress expectations', 'next steps', 'no over-promise'],
    ownerPath: '/book-demo',
    existingSurfaceMarkers: [
      'Next steps',
      'Assessment recommendations are based on what is observed during the session.',
      'individual learning progress varies',
    ],
    supportingPaths: ['/curriculum'],
  }),
]);

const postDemoArchitecture = COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'post-demo-enrolment');
const bookDemoFlow = COMMERCIAL_C5_OWNER_FLOWS.find((entry) => entry.ownerPath === '/book-demo');

export const COMMERCIAL_C6_R3_POLICY = freeze({
  canonicalOwnerPath: '/book-demo' as const,
  frameworkImplementedOnExistingOwner: true,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  paymentFlowCreated: false,
  operatingPriorsMayBePresentedAsMeasuredData: false,
  bodyCopyChangeRequired: false,
  reasonBodyCopyChangeNotRequired:
    'The current /book-demo page already exposes the evidence-backed enrolment decisions across assessment outcomes, programme routing, class samples, format, timing, pricing and progress caveats. R3 formalises and tests that framework rather than churning an active C4-controlled commercial page.',
  rule:
    'C6-R3 strengthens decision clarity on the existing /book-demo owner only. It must not create a second enrolment URL, change C4-controlled metadata, imply guaranteed outcomes, or present C1 operating priors as measured funnel performance.',
});

export const COMMERCIAL_C6_R3_SUMMARY = freeze({
  gateCount: COMMERCIAL_C6_R3_DECISION_GATES.length,
  ownerPath: COMMERCIAL_C6_R3_POLICY.canonicalOwnerPath,
  supportingPathCount: new Set(COMMERCIAL_C6_R3_DECISION_GATES.flatMap((entry) => entry.supportingPaths)).size,
  enrolmentEvidenceCount: COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY.length,
  aiEnrolmentEvidenceCount: [demoToEnrol, phonicsEnrol, speakingEnrol].length,
  declaredDemoToEnrolmentPriorKind: COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.demoToEnrolment.kind,
});

export function getCommercialC6R3Snapshot() {
  return freeze({
    revision: COMMERCIAL_C6_R3_REVISION,
    status: COMMERCIAL_C6_R3_STATUS,
    decisionGates: COMMERCIAL_C6_R3_DECISION_GATES,
    policy: COMMERCIAL_C6_R3_POLICY,
    summary: COMMERCIAL_C6_R3_SUMMARY,
  });
}

if (COMMERCIAL_C6_R1_STATUS !== 'buyer-intent-architecture-validated') throw new Error('C6-R3 requires completed C6-R1 architecture.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C6-R3 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C6-R3 must preserve C4 metadata controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C6-R3 requires completed C5 decision flow.');
if (COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C6-R3 requires /book-demo to remain the single conversion owner.');
if (bookDemoFlow?.stage !== 'conversion') throw new Error('C6-R3 requires the existing /book-demo conversion flow.');
if (postDemoArchitecture?.canonicalOwnerPath !== '/book-demo' || postDemoArchitecture.implementationState !== 'LATER_BRICK') {
  throw new Error('C6-R3 must implement the R1 post-demo enrolment decision on /book-demo.');
}
if (COMMERCIAL_C6_R3_DECISION_GATES.length !== 5) throw new Error('C6-R3 requires five parent decision gates.');
if (COMMERCIAL_C6_R3_DECISION_GATES.some((entry) => entry.ownerPath !== '/book-demo')) throw new Error('C6-R3 decision gates must remain owned by /book-demo.');
if (COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.trackingStatus !== 'not-systematically-measured') {
  throw new Error('C6-R3 must not treat declared conversion priors as measured analytics.');
}
