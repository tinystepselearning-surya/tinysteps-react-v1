import { COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from './commercialC3OwnerPageAudit';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import {
  COMMERCIAL_C5_POLICY,
  COMMERCIAL_C5_STATUS,
} from './commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R0_STATUS,
  COMMERCIAL_C6_R0_SUMMARY,
} from './commercialC6BuyerIntentAudit';
import {
  COMMERCIAL_C6_R1_POLICY,
  COMMERCIAL_C6_R1_STATUS,
  COMMERCIAL_C6_R1_SUMMARY,
} from './commercialC6BuyerIntentArchitecture';
import {
  COMMERCIAL_C6_R3_POLICY,
  COMMERCIAL_C6_R3_STATUS,
  COMMERCIAL_C6_R3_SUMMARY,
} from './commercialC6ParentDecisionFramework';
import {
  COMMERCIAL_C6_R4_POLICY,
  COMMERCIAL_C6_R4_STATUS,
  COMMERCIAL_C6_R4_SUMMARY,
} from './commercialC6InternalCommercialPaths';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C6_R5_REVISION = '2026-09-11-c6-r5';
export const COMMERCIAL_C6_R5_STATUS = 'validation-complete';
export const COMMERCIAL_C6_STATUS = 'frozen';

export type CommercialC6Milestone = {
  id: 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  label: string;
  status: string;
  evidence: readonly string[];
};

const milestone = (value: CommercialC6Milestone) => freeze({
  ...value,
  evidence: freezeList(value.evidence),
});

export const COMMERCIAL_C6_R5_MILESTONES = freezeList<Readonly<CommercialC6Milestone>>([
  milestone({
    id: 'R0',
    label: 'Buyer intent coverage audit',
    status: COMMERCIAL_C6_R0_STATUS,
    evidence: [
      'buyer/comparison/fee/enrolment evidence accounted for',
      'one dedicated phonics comparison owner',
      'one dedicated phonics fee-research owner',
      '/pricing retained as cross-programme price/value hub',
    ],
  }),
  milestone({
    id: 'R1',
    label: 'Evidence validation and buyer architecture',
    status: COMMERCIAL_C6_R1_STATUS,
    evidence: [
      'no new commercial URLs authorised',
      'non-phonics fee intent consolidated to /pricing',
      'R2 implementation approved only on /pricing',
    ],
  }),
  milestone({
    id: 'R2',
    label: 'Fees and value decision support',
    status: 'pricing-decision-support-implemented',
    evidence: [
      'subject-aware fee navigation implemented on /pricing',
      'phonics fee-research exception preserved',
      'C4-controlled pricing metadata preserved',
    ],
  }),
  milestone({
    id: 'R3',
    label: 'Parent enrolment decision framework',
    status: COMMERCIAL_C6_R3_STATUS,
    evidence: [
      'five parent decision gates formalised on /book-demo',
      'no direct payment flow created',
      'operating priors remain heuristics rather than measured funnel facts',
    ],
  }),
  milestone({
    id: 'R4',
    label: 'Internal commercial paths',
    status: COMMERCIAL_C6_R4_STATUS,
    evidence: [
      'all 14 commercial owners remain inside the frozen architecture',
      'all 13 pre-conversion owners retain a direct /book-demo path',
      'six strategic buyer journeys terminate at /book-demo',
    ],
  }),
  milestone({
    id: 'R5',
    label: 'Validation and freeze',
    status: COMMERCIAL_C6_R5_STATUS,
    evidence: [
      'upstream C1/C2/C4/C5 and C6-R0-R4 validation required in CI',
      'full repository tests, production build/prerender and SEO smoke required',
      'C6 is frozen after all gates pass',
    ],
  }),
]);

export const COMMERCIAL_C6_R5_POLICY = freeze({
  c6Frozen: true,
  frozenStatus: COMMERCIAL_C6_STATUS,
  frozenOwnerCount: 14,
  singleConversionOwner: '/book-demo' as const,
  crossProgrammePricingOwner: '/pricing' as const,
  dedicatedComparisonOwner: '/best-online-phonics-classes-for-kids-in-india' as const,
  dedicatedPhonicsPriceResearchOwner: '/phonics-fees-india' as const,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  reopenRequiresNewEvidence: true,
  c4ObservationContinuesAfterC6Freeze: true,
  permittedPostFreezeWork: freezeList([
    'C4 post-C3 CTR measurement and evidence-gated experiments',
    'C7 knowledge-to-commercial conversion graph',
    'C8 trust, evidence and differentiation',
    'C9 external authority and brand-search growth',
    'bug fixes that preserve C2 ownership, C4 controls and C5 conversion ownership',
  ]),
  rule:
    'C6 is frozen as the buyer/comparison/fees decision architecture. Reopening C6 requires new measured evidence or a verified defect; routine expansion must not create thin comparison/fee pages, alter C2 ownership, disturb active C4 controls or introduce a second conversion owner.',
});

export const COMMERCIAL_C6_R5_SUMMARY = freeze({
  milestoneCount: COMMERCIAL_C6_R5_MILESTONES.length,
  ownerCount: COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length,
  dedicatedComparisonOwnerCount: COMMERCIAL_C6_R0_SUMMARY.dedicatedComparisonOwners.length,
  dedicatedPriceResearchOwnerCount: COMMERCIAL_C6_R0_SUMMARY.dedicatedPriceResearchOwners.length,
  r2ApprovedOwnerCount: COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths.length,
  parentDecisionGateCount: COMMERCIAL_C6_R3_SUMMARY.gateCount,
  strategicJourneyCount: COMMERCIAL_C6_R4_SUMMARY.journeyCount,
  directAssessmentOwnerCount: COMMERCIAL_C6_R4_SUMMARY.directAssessmentEdgeCount,
  finalStatus: COMMERCIAL_C6_STATUS,
});

export function getCommercialC6R5Snapshot() {
  return freeze({
    revision: COMMERCIAL_C6_R5_REVISION,
    status: COMMERCIAL_C6_R5_STATUS,
    c6Status: COMMERCIAL_C6_STATUS,
    milestones: COMMERCIAL_C6_R5_MILESTONES,
    policy: COMMERCIAL_C6_R5_POLICY,
    summary: COMMERCIAL_C6_R5_SUMMARY,
  });
}

if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C6-R5 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C6-R5 must preserve active C4 experiment governance.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C6-R5 requires completed C5 decision flow.');
if (COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C6-R5 requires /book-demo as the single conversion owner.');
if (COMMERCIAL_C6_R0_STATUS !== 'buyer-intent-audit-complete') throw new Error('C6-R5 requires completed C6-R0.');
if (COMMERCIAL_C6_R1_STATUS !== 'buyer-intent-architecture-validated') throw new Error('C6-R5 requires completed C6-R1.');
if (COMMERCIAL_C6_R3_STATUS !== 'parent-decision-framework-implemented') throw new Error('C6-R5 requires completed C6-R3.');
if (COMMERCIAL_C6_R4_STATUS !== 'internal-commercial-paths-validated') throw new Error('C6-R5 requires completed C6-R4.');
if (COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length !== COMMERCIAL_C6_R5_POLICY.frozenOwnerCount) throw new Error('C6-R5 freezes exactly 14 commercial owners.');
if (COMMERCIAL_C6_R0_SUMMARY.dedicatedComparisonOwners.length !== 1) throw new Error('C6-R5 requires exactly one dedicated comparison owner.');
if (COMMERCIAL_C6_R0_SUMMARY.dedicatedPriceResearchOwners.length !== 1) throw new Error('C6-R5 requires exactly one dedicated price-research owner.');
if (COMMERCIAL_C6_R1_SUMMARY.newOwnersAuthorized !== 0) throw new Error('C6-R5 cannot freeze with newly authorised commercial owners.');
if (COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths.length !== 1 || COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths[0] !== '/pricing') throw new Error('C6-R5 requires R2 implementation to remain limited to /pricing.');
if (COMMERCIAL_C6_R3_POLICY.canonicalOwnerPath !== '/book-demo' || COMMERCIAL_C6_R3_SUMMARY.gateCount !== 5) throw new Error('C6-R5 requires the five-gate /book-demo parent decision framework.');
if (COMMERCIAL_C6_R4_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C6-R5 requires R4 to preserve /book-demo ownership.');
if (COMMERCIAL_C6_R4_SUMMARY.journeyCount !== 6 || COMMERCIAL_C6_R4_SUMMARY.directAssessmentEdgeCount !== 13) throw new Error('C6-R5 requires six strategic journeys and 13 direct assessment routes.');
if (COMMERCIAL_C6_R5_MILESTONES.length !== 6) throw new Error('C6-R5 must account for R0 through R5.');
