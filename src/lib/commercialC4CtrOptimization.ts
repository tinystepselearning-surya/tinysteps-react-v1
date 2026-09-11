import {
  COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE,
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

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);
const freezeList = <T>(values: readonly T[]): readonly T[] => Object.freeze([...values]);

export const COMMERCIAL_C4_REVISION = '2026-09-11-c4-r1';
export const COMMERCIAL_C4_STATUS = 'baseline-armed';

export type CommercialC4OpportunityBand = 'HIGH' | 'MEDIUM' | 'LOW_DATA';
export type CommercialC4Action = 'PRIORITY_OBSERVE' | 'OBSERVE' | 'LOW_DATA';
export type CommercialC4ExperimentKind = 'description-only' | 'none';

export type CommercialC4HistoricalMetric = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type CommercialC4OwnerBaseline = {
  ownerPath: string;
  clusterIds: readonly string[];
  priority: CommercialOwnerPriority;
  historical: CommercialC4HistoricalMetric | null;
  opportunityBand: CommercialC4OpportunityBand;
  action: CommercialC4Action;
  experimentKind: CommercialC4ExperimentKind;
  candidateDescription: string | null;
  deployEligible: false;
  rationale: string;
};

const pageMetricByPath = new Map(
  COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE
    .filter((entry) => entry.source === 'google-gsc-web')
    .map((entry) => [entry.path, entry]),
);

const c2ClustersByPath = new Map<string, string[]>();
for (const cluster of COMMERCIAL_C2_OWNERSHIP_CLUSTERS) {
  const current = c2ClustersByPath.get(cluster.canonicalOwnerPath) ?? [];
  current.push(cluster.id);
  c2ClustersByPath.set(cluster.canonicalOwnerPath, current);
}

const c3PriorityByPath = new Map<string, CommercialOwnerPriority>();
for (const audit of COMMERCIAL_C3_OWNER_PAGE_AUDITS) {
  const existing = c3PriorityByPath.get(audit.ownerPath);
  if (!existing || audit.priority === 'P1' || (audit.priority === 'P2' && existing === 'P3')) {
    c3PriorityByPath.set(audit.ownerPath, audit.priority);
  }
}

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

function historicalFor(path: string): CommercialC4HistoricalMetric | null {
  const row = pageMetricByPath.get(path);
  if (!row || row.clicks === null || row.impressions === null || row.ctr === null || row.position === null) return null;
  return freeze({ clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position });
}

function opportunityFor(metric: CommercialC4HistoricalMetric | null): CommercialC4OpportunityBand {
  if (!metric || metric.impressions < 200) return 'LOW_DATA';
  if (metric.impressions >= 800 && metric.position <= 10.5 && metric.ctr < 0.04) return 'HIGH';
  return 'MEDIUM';
}

export const COMMERCIAL_C4_OWNER_BASELINES = freezeList<CommercialC4OwnerBaseline>(
  COMMERCIAL_C3_UNIQUE_OWNER_PATHS.map((ownerPath) => {
    const historical = historicalFor(ownerPath);
    const opportunityBand = opportunityFor(historical);
    const candidateDescription = descriptionCandidates[ownerPath] ?? null;
    const action: CommercialC4Action =
      opportunityBand === 'HIGH' ? 'PRIORITY_OBSERVE' : opportunityBand === 'MEDIUM' ? 'OBSERVE' : 'LOW_DATA';

    return freeze({
      ownerPath,
      clusterIds: freezeList(c2ClustersByPath.get(ownerPath) ?? []),
      priority: c3PriorityByPath.get(ownerPath) ?? 'P3',
      historical,
      opportunityBand,
      action,
      experimentKind: candidateDescription ? 'description-only' : 'none',
      candidateDescription,
      deployEligible: false as const,
      rationale:
        candidateDescription
          ? 'Historical GSC data shows enough visibility to prepare a cleaner SERP description, but C3 metadata deployed after this evidence window. Keep the fresh C3 snippet as control until post-C3 GSC evidence exists.'
          : historical
            ? 'Retain the C3 snippet as control. Historical visibility exists, but this page is not yet a high-confidence C4 snippet experiment candidate.'
            : 'Insufficient historical Google page evidence for a CTR experiment. Protect ownership and wait for measurable impressions.',
    });
  }),
);

export const COMMERCIAL_C4_PRIORITY_PATHS = freezeList(
  COMMERCIAL_C4_OWNER_BASELINES
    .filter((entry) => entry.action === 'PRIORITY_OBSERVE')
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
  deployCandidateBeforeFreshEvidence: false,
  minimumFreshObservationDays: 14,
  minimumFreshPageImpressions: 200,
  minimumFreshQueryImpressions: 50,
  titleRule: 'Preserve the C2 primary intent and C3 ownership boundary. Do not change a title only to add more keyword variants.',
  descriptionRule: 'Prefer a concise parent-facing promise, concrete verified facts and the next decision step. No unsupported urgency, guarantees or invented offers.',
  measurementRule: 'Compare post-C3 page/query impressions, clicks, CTR and position against the frozen control before deploying a C4 snippet candidate.',
});

if (COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS !== 'evidence-complete') throw new Error('C4 requires completed C1 observed evidence.');
if (COMMERCIAL_C2_STATUS !== 'ownership-complete') throw new Error('C4 requires frozen C2 ownership.');
if (COMMERCIAL_C3_STATUS !== 'implementation-complete') throw new Error('C4 requires completed C3 implementation.');
if (COMMERCIAL_C4_OWNER_BASELINES.length !== COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length) throw new Error('C4 must baseline every unique C3 owner page.');
if (COMMERCIAL_C4_OWNER_BASELINES.some((entry) => entry.deployEligible)) throw new Error('C4 r1 must not deploy candidates before fresh post-C3 evidence.');
