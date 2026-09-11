import { COMMERCIAL_C2_STATUS } from './commercialC2KeywordOwnership';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from './commercialC3OwnerPageAudit';
import { COMMERCIAL_C4_STATUS } from './commercialC4CtrOptimization';
import {
  COMMERCIAL_C5_OWNER_FLOWS,
  COMMERCIAL_C5_POLICY,
  COMMERCIAL_C5_STATUS,
} from './commercialC5ConversionFlow';
import { COMMERCIAL_C6_R3_STATUS } from './commercialC6ParentDecisionFramework';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C6_R4_REVISION = '2026-09-11-c6-r4';
export const COMMERCIAL_C6_R4_STATUS = 'internal-commercial-paths-validated';

export type CommercialC6R4EdgeRole =
  | 'direct-assessment'
  | 'comparison-to-price'
  | 'comparison-to-programme'
  | 'price-to-programme'
  | 'programme-fit-handoff'
  | 'local-to-broad'
  | 'conversion-support';

export type CommercialC6R4Edge = {
  from: string;
  to: string;
  role: CommercialC6R4EdgeRole;
  sourcePath: string;
};

export type CommercialC6R4Journey = {
  id: string;
  label: string;
  sequence: readonly string[];
};

const sourceByOwner = new Map(COMMERCIAL_C5_OWNER_FLOWS.map((flow) => [flow.ownerPath, flow.sourcePath]));

function edge(from: string, to: string, role: CommercialC6R4EdgeRole): Readonly<CommercialC6R4Edge> {
  const sourcePath = sourceByOwner.get(from);
  if (!sourcePath) throw new Error(`C6-R4 missing source path for ${from}.`);
  return freeze({ from, to, role, sourcePath });
}

const directAssessmentEdges = COMMERCIAL_C5_OWNER_FLOWS
  .filter((flow) => flow.ownerPath !== '/book-demo')
  .map((flow) => edge(flow.ownerPath, '/book-demo', 'direct-assessment'));

const decisionEdges = [
  edge('/best-online-phonics-classes-for-kids-in-india', '/phonics-fees-india', 'comparison-to-price'),
  edge('/best-online-phonics-classes-for-kids-in-india', '/phonics', 'comparison-to-programme'),
  edge('/phonics-fees-india', '/phonics', 'price-to-programme'),
  edge('/phonics-fees-india', '/pricing', 'price-to-programme'),

  edge('/reading-classes-for-kids', '/reading-fluency-program', 'programme-fit-handoff'),
  edge('/reading-fluency-program', '/reading-classes-for-kids', 'programme-fit-handoff'),
  edge('/grammar', '/writing-classes-for-kids', 'programme-fit-handoff'),
  edge('/writing-classes-for-kids', '/grammar', 'programme-fit-handoff'),
  edge('/spoken-english-classes-for-kids-online', '/speaking', 'programme-fit-handoff'),
  edge('/speaking', '/spoken-english-classes-for-kids-online', 'programme-fit-handoff'),
  edge('/speaking', '/confidence-building-program-kids', 'programme-fit-handoff'),
  edge('/confidence-building-program-kids', '/speaking', 'programme-fit-handoff'),

  edge('/online-english-classes-hyderabad', '/online-english-classes-for-kids', 'local-to-broad'),

  edge('/pricing', '/online-english-classes-for-kids', 'price-to-programme'),
  edge('/pricing', '/phonics', 'price-to-programme'),
  edge('/pricing', '/reading-classes-for-kids', 'price-to-programme'),
  edge('/pricing', '/grammar', 'price-to-programme'),
  edge('/pricing', '/writing-classes-for-kids', 'price-to-programme'),
  edge('/pricing', '/spoken-english-classes-for-kids-online', 'price-to-programme'),
  edge('/pricing', '/speaking', 'price-to-programme'),

  edge('/book-demo', '/pricing', 'conversion-support'),
  edge('/book-demo', '/online-english-classes-for-kids', 'conversion-support'),
] as const;

export const COMMERCIAL_C6_R4_EDGES = freezeList<Readonly<CommercialC6R4Edge>>([
  ...directAssessmentEdges,
  ...decisionEdges,
]);

export const COMMERCIAL_C6_R4_JOURNEYS = freezeList<Readonly<CommercialC6R4Journey>>([
  freeze({
    id: 'phonics-comparison-path',
    label: 'Phonics comparison → fees → programme fit → assessment',
    sequence: freezeList([
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/phonics',
      '/book-demo',
    ]),
  }),
  freeze({
    id: 'cross-programme-pricing-path',
    label: 'General pricing → programme chooser → assessment',
    sequence: freezeList(['/pricing', '/online-english-classes-for-kids', '/book-demo']),
  }),
  freeze({
    id: 'reading-fit-path',
    label: 'Reading → fluency specialist fit → assessment',
    sequence: freezeList(['/reading-classes-for-kids', '/reading-fluency-program', '/book-demo']),
  }),
  freeze({
    id: 'grammar-writing-fit-path',
    label: 'Grammar → writing fit → assessment',
    sequence: freezeList(['/grammar', '/writing-classes-for-kids', '/book-demo']),
  }),
  freeze({
    id: 'speaking-confidence-fit-path',
    label: 'Speaking → confidence specialist fit → assessment',
    sequence: freezeList(['/speaking', '/confidence-building-program-kids', '/book-demo']),
  }),
  freeze({
    id: 'hyderabad-local-path',
    label: 'Hyderabad local owner → broad English chooser → assessment',
    sequence: freezeList(['/online-english-classes-hyderabad', '/online-english-classes-for-kids', '/book-demo']),
  }),
]);

const edgeKey = (from: string, to: string) => `${from}=>${to}`;
const edgeKeys = new Set(COMMERCIAL_C6_R4_EDGES.map((item) => edgeKey(item.from, item.to)));
const ownerSet = new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS);

export const COMMERCIAL_C6_R4_POLICY = freeze({
  implementationMode: 'validate-existing-links' as const,
  ownerCount: 14,
  requiredDirectAssessmentOwners: 13,
  singleConversionOwner: '/book-demo' as const,
  newCommercialUrlsAllowed: false,
  c2OwnershipMutationAllowed: false,
  c4MetadataMutationAllowed: false,
  c5ConversionOwnerMutationAllowed: false,
  bodyCopyChangeRequired: false,
  navigationRule:
    'Internal commercial links should answer the next parent decision without creating a new owner, while every pre-conversion owner retains a direct route to /book-demo.',
});

export const COMMERCIAL_C6_R4_SUMMARY = freeze({
  ownerCount: COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length,
  edgeCount: COMMERCIAL_C6_R4_EDGES.length,
  directAssessmentEdgeCount: COMMERCIAL_C6_R4_EDGES.filter((item) => item.role === 'direct-assessment').length,
  journeyCount: COMMERCIAL_C6_R4_JOURNEYS.length,
  priceToProgrammeEdgeCount: COMMERCIAL_C6_R4_EDGES.filter((item) => item.role === 'price-to-programme').length,
});

export function getCommercialC6R4Snapshot() {
  return freeze({
    revision: COMMERCIAL_C6_R4_REVISION,
    status: COMMERCIAL_C6_R4_STATUS,
    edges: COMMERCIAL_C6_R4_EDGES,
    journeys: COMMERCIAL_C6_R4_JOURNEYS,
    policy: COMMERCIAL_C6_R4_POLICY,
    summary: COMMERCIAL_C6_R4_SUMMARY,
  });
}

if (COMMERCIAL_C6_R3_STATUS !== 'parent-decision-framework-implemented') throw new Error('C6-R4 requires completed C6-R3.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C6-R4 requires frozen C2 ownership.');
if (COMMERCIAL_C4_STATUS !== 'experiment-governance-armed') throw new Error('C6-R4 must preserve C4 metadata controls.');
if (COMMERCIAL_C5_STATUS !== 'decision-flow-implemented') throw new Error('C6-R4 requires completed C5 decision flow.');
if (COMMERCIAL_C5_POLICY.singleConversionOwner !== '/book-demo') throw new Error('C6-R4 requires /book-demo as the single conversion owner.');
if (COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length !== COMMERCIAL_C6_R4_POLICY.ownerCount) throw new Error('C6-R4 must cover all 14 commercial owners.');
if (COMMERCIAL_C6_R4_SUMMARY.directAssessmentEdgeCount !== COMMERCIAL_C6_R4_POLICY.requiredDirectAssessmentOwners) throw new Error('C6-R4 requires 13 direct assessment edges.');
if (COMMERCIAL_C6_R4_EDGES.some((item) => !ownerSet.has(item.from) || !ownerSet.has(item.to))) throw new Error('C6-R4 edges must stay inside the existing 14-owner architecture.');
for (const journey of COMMERCIAL_C6_R4_JOURNEYS) {
  for (let index = 0; index < journey.sequence.length - 1; index += 1) {
    const from = journey.sequence[index];
    const to = journey.sequence[index + 1];
    if (!edgeKeys.has(edgeKey(from, to))) throw new Error(`C6-R4 journey ${journey.id} is missing edge ${from} -> ${to}.`);
  }
  if (journey.sequence[journey.sequence.length - 1] !== '/book-demo') throw new Error(`C6-R4 journey ${journey.id} must end at /book-demo.`);
}
