import { COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY, COMMERCIAL_C5_STATUS } from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_STATUS } from './commercialC6ValidationFreeze';
import {
  COMMERCIAL_C7_R0_STATUS,
  getCommercialC7R0Snapshot,
} from './commercialC7KnowledgeConversionAudit';
import {
  COMMERCIAL_C7_R1_STATUS,
  getCommercialC7R1Snapshot,
} from './commercialC7KnowledgeOwnerMapping';
import {
  COMMERCIAL_C7_R2_STATUS,
  getCommercialC7R2Snapshot,
} from './commercialC7IntentNextStepRules';
import {
  COMMERCIAL_C7_R3_STATUS,
  getCommercialC7R3Snapshot,
} from './commercialC7ContextualHandoffImplementation';
import {
  COMMERCIAL_C7_R4_MEASUREMENT,
  COMMERCIAL_C7_R4_STATUS,
  getCommercialC7R4Snapshot,
} from './commercialC7KnowledgeMeasurement';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);

export const COMMERCIAL_C7_REVISION = '2026-09-12-c7-r5';
export const COMMERCIAL_C7_STATUS = 'frozen';

export const COMMERCIAL_C7_FREEZE_POLICY = freeze({
  frozen: true,
  reopenOnlyWithMeasuredEvidenceOrVerifiedDefect: true,
  newKnowledgeUrlsAllowed: false,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnershipMutationAllowed: false,
  c6ArchitectureMutationAllowed: false,
  directBlogBodyMutationAllowed: false,
  maxCommercialPromptsPerKnowledgeSurface: 2,
  singleConversionOwner: '/book-demo' as const,
  measurementPrimaryKpi: COMMERCIAL_C7_R4_MEASUREMENT.primaryKpi,
  measurementRule:
    'Knowledge and commercial interaction events remain diagnostic. Qualified organic leads remain authoritative only through C0 canonical lead lifecycle and first-touch attribution.',
});

export function getCommercialC7Snapshot() {
  return freeze({
    revision: COMMERCIAL_C7_REVISION,
    status: COMMERCIAL_C7_STATUS,
    r0: getCommercialC7R0Snapshot(),
    r1: getCommercialC7R1Snapshot(),
    r2: getCommercialC7R2Snapshot(),
    r3: getCommercialC7R3Snapshot(),
    r4: getCommercialC7R4Snapshot(),
    freezePolicy: COMMERCIAL_C7_FREEZE_POLICY,
  });
}

if (COMMERCIAL_C7_R0_STATUS !== 'knowledge-conversion-audit-complete') throw new Error('C7-R5 requires completed R0.');
if (COMMERCIAL_C7_R1_STATUS !== 'knowledge-owner-mapping-validated') throw new Error('C7-R5 requires validated R1.');
if (COMMERCIAL_C7_R2_STATUS !== 'intent-next-step-rules-validated') throw new Error('C7-R5 requires validated R2.');
if (COMMERCIAL_C7_R3_STATUS !== 'contextual-commercial-handoffs-implemented') throw new Error('C7-R5 requires implemented R3.');
if (COMMERCIAL_C7_R4_STATUS !== 'knowledge-conversion-measurement-implemented') throw new Error('C7-R5 requires implemented R4.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C7-R5 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C7-R5 requires C4 control governance to remain armed.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented' || COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C7-R5 requires the C5 single conversion owner.');
if (COMMERCIAL_C6_STATUS !== 'frozen') throw new Error('C7-R5 requires frozen C6 architecture.');
if (COMMERCIAL_C7_FREEZE_POLICY.measurementPrimaryKpi !== 'qualified_organic_leads_per_day') throw new Error('C7-R5 must preserve the C0 qualified-organic-lead KPI.');
