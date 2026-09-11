import {
  COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE,
  COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE,
  COMMERCIAL_C1_GSC_EXPORT,
  COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS,
} from './commercialC1ObservedSearchEvidence';
import {
  COMMERCIAL_C2_OWNERSHIP_CLUSTERS,
  COMMERCIAL_C2_STATUS,
  type CommercialOwnerPriority,
} from './commercialC2KeywordOwnership';
import {
  COMMERCIAL_C3_OWNER_PAGE_AUDITS,
  COMMERCIAL_C3_STATUS,
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS,
} from './commercialC3OwnerPageAudit';
import {
  COMMERCIAL_C4_SERP_OBSERVATIONS,
  COMMERCIAL_C4_SERP_SNAPSHOT_STATUS,
  type CommercialC4SerpObservation,
} from './commercialC4SerpSnapshot';

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);
const round = (value: number, digits = 4) => Number(value.toFixed(digits));

export const COMMERCIAL_C4_REVISION = '2026-09-11-c4-r2';
export const COMMERCIAL_C4_STATUS = 'experiment-governance-armed';

export type CommercialC4OpportunityBand = 'HIGH' | 'MEDIUM' | 'LOW_DATA';
export type CommercialC4Action = 'PRIORITY_OBSERVE' | 'OBSERVE' | 'LOW_DATA';
export type CommercialC4ExperimentKind = 'description-only' | 'none';
export type CommercialC4ExperimentState = 'CONTROL' | 'READY' | 'DEPLOYED' | 'MEASURING' | 'WIN' | 'LOSS' | 'INCONCLUSIVE';
export type CommercialC4QueryCoverage = 'CORE_SAMPLE_COMPLETE' | 'CORE_SAMPLE_PARTIAL' | 'NO_CORE_SAMPLE';

export type CommercialC4HistoricalMetric = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type CommercialC4ControlSnippet = {
  title: string;
  description: string;
};

export type CommercialC4QuerySample = {
  queryNames: readonly string[];
  matchedQueryRows: number;
  clicks: number;
  impressions: number;
  ctr: number | null;
  impressionWeightedPosition: number | null;
  coverage: CommercialC4QueryCoverage;
};

export type CommercialC4OwnerBaseline = {
  ownerPath: string;
  clusterIds: readonly string[];
  primaryQueries: readonly string[];
  priority: CommercialOwnerPriority;
  historical: CommercialC4HistoricalMetric | null;
  querySample: CommercialC4QuerySample;
  serpObservation: Readonly<CommercialC4SerpObservation> | null;
  opportunityBand: CommercialC4OpportunityBand;
  action: CommercialC4Action;
  triageHeadroomClicksAt4Pct: number;
  opportunityScore: number;
  experimentKind: CommercialC4ExperimentKind;
  experimentState: CommercialC4ExperimentState;
  controlSnippet: Readonly<CommercialC4ControlSnippet> | null;
  candidateTitle: null;
  candidateDescription: string | null;
  deployEligible: false;
  rationale: string;
};

export type CommercialC4FreshObservation = {
  ownerPath: string;
  observedThrough: string;
  observationDays: number;
  pageClicks: number;
  pageImpressions: number;
  pageCtr: number;
  pagePosition: number;
  queryImpressions: number | null;
  qualifiedOrganicLeads: number | null;
};

export type CommercialC4FreshEvaluation = {
  ownerPath: string;
  experimentState: 'CONTROL' | 'READY';
  deployEligible: boolean;
  meetsObservationDays: boolean;
  meetsPageImpressions: boolean;
  queryEvidenceRequired: boolean;
  meetsQueryImpressions: boolean;
  reasons: readonly string[];
};

const pageMetricByPath = new Map(
  COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE
    .filter((entry) => entry.source === 'google-gsc-web')
    .map((entry) => [entry.path, entry]),
);

const coreGoogleQueryByText = new Map(
  COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE
    .filter((entry) => entry.source === 'google-gsc-web')
    .map((entry) => [entry.query, entry]),
);

const c2ClustersByPath = new Map<string, string[]>();
const c2PrimaryQueriesByPath = new Map<string, string[]>();
for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
  const ids = c2ClustersByPath.get(cluster.canonicalOwnerPath) ?? [];
  ids.push(cluster.id);
  c2ClustersByPath.set(cluster.canonicalOwnerPath, ids);

  const primaryQueries = c2PrimaryQueriesByPath.get(cluster.canonicalOwnerPath) ?? [];
  primaryQueries.push(cluster.primaryQuery);
  c2PrimaryQueriesByPath.set(cluster.canonicalOwnerPath, primaryQueries);
}

const c3PriorityByPath = new Map<string, CommercialOwnerPriority>();
for (const audit of COMMERCIAL_C3_OWNER_PAGE_AUDITS) {
  const existing = c3PriorityByPath.get(audit.ownerPath);
  if (!existing || audit.priority === 'P1' || (audit.priority === 'P2' && existing === 'P3')) {
    c3PriorityByPath.set(audit.ownerPath, audit.priority);
  }
}

const serpObservationByPath = new Map(COMMERCIAL_C4_SERP_OBSERVATIONS.map((entry) => [entry.ownerPath, entry]));

export const COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS: Readonly<Record<string, Readonly<CommercialC4ControlSnippet>>> = freeze({
  '/phonics': freeze({
    title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
    description: 'Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.',
  }),
  '/best-online-phonics-classes-for-kids-in-india': freeze({
    title: 'Best Online Phonics Classes for Kids in India | Tiny Steps Learning',
    description: 'Compare online phonics classes for kids in India by child fit, 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and overall value.',
  }),
  '/online-english-classes-hyderabad': freeze({
    title: 'Online English Classes for Kids in Hyderabad | Tiny Steps',
    description: 'Live online English classes for kids ages 3–12 in Hyderabad. Start with a free 35-minute 1:1 assessment, then choose the right phonics, reading, grammar, writing or speaking path.',
  }),
  '/speaking': freeze({
    title: 'Public Speaking & Communication Classes for Kids | Tiny Steps',
    description: 'Live 1:1 public speaking and communication classes for kids in India and worldwide. Build structured answers, storytelling, presentations and communication confidence in 35-minute classes.',
  }),
  '/pricing': freeze({
    title: 'Online English Classes for Kids Fees & Pricing | Tiny Steps',
    description: 'See Tiny Steps online English class fees: standard live 1:1 ₹400/class, 12 classes ₹4,800, small groups ₹180–₹300 per child/class, plus native-teacher options.',
  }),
  '/grammar': freeze({
    title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps',
    description: 'Live 1:1 online grammar classes for kids in India and worldwide. Build sentence formation, tenses, punctuation, grammar accuracy and clearer school answers with assessment-first placement.',
  }),
});

const descriptionCandidates: Readonly<Record<string, string>> = freeze({
  '/phonics':
    'Live 1:1 online phonics classes for kids ages 3–12. Build blending, decoding, spelling and reading fluency. Free 35-minute assessment; India + worldwide.',
  '/best-online-phonics-classes-for-kids-in-india':
    'Compare online phonics classes for kids in India by 1:1 vs group format, curriculum, live correction, reading transfer, progress visibility and fees.',
  '/online-english-classes-hyderabad':
    'Live online English classes for kids ages 3–12 in Hyderabad. Phonics, reading, grammar, writing and speaking. Start with a free 35-minute 1:1 assessment.',
  '/speaking':
    'Live 1:1 public speaking and communication classes for kids. Build structured answers, storytelling, presentations and confidence in 35-minute classes.',
  '/pricing':
    'Online English class fees for kids: live 1:1 ₹400/class or ₹4,800 for 12 classes; small groups ₹180–₹300 per child/class. Compare formats and value.',
  '/grammar':
    'Live 1:1 online grammar classes for kids. Build sentence formation, tenses, punctuation and clearer school answers. Assessment-led; India + worldwide.',
});

const querySamplesByPath: Readonly<Record<string, readonly string[]>> = freeze({
  '/phonics': freezeList([
    'phonics classes',
    'phonics classes online',
    'phonics classes for kids',
    'online phonics classes for kids',
    'online phonics classes',
    'phonics online classes for kids',
  ]),
  '/best-online-phonics-classes-for-kids-in-india': freezeList([
    'best phonics classes online',
    'best online phonics classes for kids in india',
    'best online phonics classes in india',
  ]),
  '/online-english-classes-hyderabad': freezeList([]),
  '/speaking': freezeList([
    'public speaking classes for kids',
    'public speaking classes for kids online india',
    'public speaking classes for kids usa',
  ]),
  '/pricing': freezeList([]),
  '/grammar': freezeList(['online grammar classes for kids']),
});

function historicalFor(path: string): CommercialC4HistoricalMetric | null {
  const row = pageMetricByPath.get(path);
  if (!row || row.clicks === null || row.impressions === null || row.ctr === null || row.position === null) return null;
  return freeze({ clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position });
}

function aggregateQuerySample(queryNames: readonly string[]): CommercialC4QuerySample {
  const rows = queryNames
    .map((query) => coreGoogleQueryByText.get(query))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  const clicks = rows.reduce((sum, row) => sum + (row.clicks ?? 0), 0);
  const impressions = rows.reduce((sum, row) => sum + (row.impressions ?? 0), 0);
  const weightedPositionNumerator = rows.reduce(
    (sum, row) => sum + ((row.position ?? 0) * (row.impressions ?? 0)),
    0,
  );
  const coverage: CommercialC4QueryCoverage = queryNames.length === 0
    ? 'NO_CORE_SAMPLE'
    : rows.length === queryNames.length
      ? 'CORE_SAMPLE_COMPLETE'
      : 'CORE_SAMPLE_PARTIAL';

  return freeze({
    queryNames: freezeList(queryNames),
    matchedQueryRows: rows.length,
    clicks,
    impressions,
    ctr: impressions > 0 ? round(clicks / impressions) : null,
    impressionWeightedPosition: impressions > 0 ? round(weightedPositionNumerator / impressions, 2) : null,
    coverage,
  });
}

function opportunityFor(metric: CommercialC4HistoricalMetric | null): CommercialC4OpportunityBand {
  if (!metric || metric.impressions < 200) return 'LOW_DATA';
  if (metric.impressions >= 800 && metric.position <= 10.5 && metric.ctr < 0.04) return 'HIGH';
  return 'MEDIUM';
}

function triageFor(metric: CommercialC4HistoricalMetric | null, querySample: CommercialC4QuerySample) {
  if (!metric) return freeze({ headroom: 0, score: 0 });
  const headroom = metric.impressions * Math.max(0, 0.04 - metric.ctr);
  const positionConfidence = metric.position <= 6 ? 1 : metric.position <= 8 ? 0.85 : metric.position <= 10.5 ? 0.7 : 0.4;
  const queryConfidence = querySample.impressions >= 50 ? 1 : querySample.impressions > 0 ? 0.85 : 0.7;
  return freeze({
    headroom: round(headroom, 1),
    score: round(headroom * positionConfidence * queryConfidence, 1),
  });
}

export const COMMERCIAL_C4_OWNER_BASELINES = freezeList<CommercialC4OwnerBaseline>(
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS.map((ownerPath) => {
    const historical = historicalFor(ownerPath);
    const querySample = aggregateQuerySample(querySamplesByPath[ownerPath] ?? []);
    const opportunityBand = opportunityFor(historical);
    const candidateDescription = descriptionCandidates[ownerPath] ?? null;
    const action: CommercialC4Action =
      opportunityBand === 'HIGH' ? 'PRIORITY_OBSERVE' : opportunityBand === 'MEDIUM' ? 'OBSERVE' : 'LOW_DATA';
    const triage = triageFor(historical, querySample);
    const controlSnippet = COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS[ownerPath] ?? null;
    const serpObservation = serpObservationByPath.get(ownerPath) ?? null;

    return freeze({
      ownerPath,
      clusterIds: freezeList(c2ClustersByPath.get(ownerPath) ?? []),
      primaryQueries: freezeList(c2PrimaryQueriesByPath.get(ownerPath) ?? []),
      priority: c3PriorityByPath.get(ownerPath) ?? 'P3',
      historical,
      querySample,
      serpObservation,
      opportunityBand,
      action,
      triageHeadroomClicksAt4Pct: triage.headroom,
      opportunityScore: triage.score,
      experimentKind: candidateDescription ? 'description-only' : 'none',
      experimentState: 'CONTROL' as const,
      controlSnippet,
      candidateTitle: null,
      candidateDescription,
      deployEligible: false as const,
      rationale:
        candidateDescription
          ? 'Historical GSC visibility justifies CTR observation and a description candidate, but the evidence predates C3. Keep the C3 title and description as the frozen control until post-C3 page and query evidence satisfies the deployment gate.'
          : historical
            ? 'Retain the C3 snippet as control. Historical visibility exists, but this page is not yet a high-confidence C4 snippet experiment candidate.'
            : 'Insufficient historical Google page evidence for a CTR experiment. Protect ownership and wait for measurable impressions.',
    });
  }),
);

export const COMMERCIAL_C4_PRIORITY_PATHS = freezeList(
  COMMERCIAL_C4_OWNER_BASELINES
    .filter((entry) => entry.action === 'PRIORITY_OBSERVE')
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .map((entry) => entry.ownerPath),
);

export const COMMERCIAL_C4_POLICY = freeze({
  c1EvidenceRequired: true,
  c2OwnershipFrozen: true,
  c3ImplementationFrozen: true,
  newCommercialUrlsAllowed: false,
  ownershipChangesAllowed: false,
  keywordStuffingAllowed: false,
  historicalEvidenceFrom: COMMERCIAL_C1_GSC_EXPORT.observedFrom,
  historicalEvidenceThrough: COMMERCIAL_C1_GSC_EXPORT.observedThrough,
  c3DeploymentDate: '2026-09-11',
  historicalEvidencePredatesC3: true,
  currentSnippetIsControl: true,
  controlTitleAndDescriptionFrozen: true,
  deployCandidateBeforeFreshEvidence: false,
  minimumFreshObservationDays: 14,
  minimumFreshPageImpressions: 200,
  minimumFreshQueryImpressions: 50,
  triageCtrReference: 0.04,
  triageRule: 'The 4% CTR reference is an internal opportunity-ranking heuristic, not a Google benchmark or ranking guarantee. Headroom is discounted when rank or query-family coverage is weaker.',
  serpRule: 'Directional external search retrieval may reveal title rewrites, but a rewrite snapshot alone never triggers a metadata change. Recheck alongside fresh post-C3 GSC evidence.',
  titleRule: 'Preserve the C2 primary intent and C3 ownership boundary. Do not change a title only to add more keyword variants.',
  descriptionRule: 'Prefer a concise parent-facing promise, concrete verified facts and the next decision step. No unsupported urgency, guarantees or invented offers.',
  measurementRule: 'Compare post-C3 page/query impressions, clicks, CTR, position and qualified organic leads against the frozen control before deploying or judging a C4 snippet experiment.',
  experimentLifecycle: freezeList<CommercialC4ExperimentState>(['CONTROL', 'READY', 'DEPLOYED', 'MEASURING', 'WIN', 'LOSS', 'INCONCLUSIVE']),
});

export function evaluateCommercialC4FreshObservation(observation: CommercialC4FreshObservation): CommercialC4FreshEvaluation {
  const baseline = COMMERCIAL_C4_OWNER_BASELINES.find((entry) => entry.ownerPath === observation.ownerPath);
  if (!baseline) throw new Error(`Unknown C4 owner path: ${observation.ownerPath}`);

  const meetsObservationDays = observation.observationDays >= COMMERCIAL_C4_POLICY.minimumFreshObservationDays;
  const meetsPageImpressions = observation.pageImpressions >= COMMERCIAL_C4_POLICY.minimumFreshPageImpressions;
  const queryEvidenceRequired = baseline.querySample.coverage !== 'NO_CORE_SAMPLE';
  const meetsQueryImpressions = queryEvidenceRequired
    ? observation.queryImpressions !== null && observation.queryImpressions >= COMMERCIAL_C4_POLICY.minimumFreshQueryImpressions
    : observation.queryImpressions === null || observation.queryImpressions >= COMMERCIAL_C4_POLICY.minimumFreshQueryImpressions;
  const deployEligible = meetsObservationDays && meetsPageImpressions && meetsQueryImpressions;
  const reasons: string[] = [];

  if (!meetsObservationDays) reasons.push(`Need at least ${COMMERCIAL_C4_POLICY.minimumFreshObservationDays} post-C3 observation days.`);
  if (!meetsPageImpressions) reasons.push(`Need at least ${COMMERCIAL_C4_POLICY.minimumFreshPageImpressions} fresh page impressions.`);
  if (!meetsQueryImpressions) reasons.push(`Need at least ${COMMERCIAL_C4_POLICY.minimumFreshQueryImpressions} fresh impressions for the mapped query family.`);
  if (deployEligible) reasons.push('Fresh-evidence gate passed. Candidate may move to READY for human review; deployment is not automatic.');

  return freeze({
    ownerPath: observation.ownerPath,
    experimentState: deployEligible ? 'READY' : 'CONTROL',
    deployEligible,
    meetsObservationDays,
    meetsPageImpressions,
    queryEvidenceRequired,
    meetsQueryImpressions,
    reasons: freezeList(reasons),
  });
}

if (COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS !== 'evidence-complete') throw new Error('C4 requires completed C1 observed evidence.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C4 requires frozen C2 ownership.');
if (COMMERCIAL_C3_STATUS !== 'implementation-complete') throw new Error('C4 requires completed C3 implementation.');
if (COMMERCIAL_C4_SERP_SNAPSHOT_STATUS !== 'directional-snapshot-complete') throw new Error('C4 requires the directional SERP snapshot.');
if (COMMERCIAL_C4_OWNER_BASELINES.length !== COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length) throw new Error('C4 must baseline every unique C3 owner page.');
if (COMMERCIAL_C4_OWNER_BASELINES.some((entry) => entry.deployEligible)) throw new Error('C4 r2 baseline must not deploy candidates before fresh post-C3 evidence.');
if (Object.keys(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS).length !== 6) throw new Error('C4 r2 must freeze both title and description for all six active control snippets.');
