export type SeoRecoveryBrick14ConsistencyStatus =
  | 'CONSISTENT_OBSERVED'
  | 'DRIFT_OBSERVED'
  | 'MIGRATION_PENDING'
  | 'NO_DIRECT_SAMPLE';

export type SeoRecoveryBrick14EvidenceKind = 'query-page' | 'page-only' | 'none';

export type SeoRecoveryBrick14Metric = Readonly<{
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}>;

export type SeoRecoveryBrick14PageRelationship = SeoRecoveryBrick14Metric & Readonly<{
  path: string;
}>;

export type SeoRecoveryBrick14QueryOwnerRecord = Readonly<{
  id: string;
  query: string;
  intent: string;
  desiredOwnerPath: string;
  status: SeoRecoveryBrick14ConsistencyStatus;
  evidenceKind: SeoRecoveryBrick14EvidenceKind;
  queryMetric: SeoRecoveryBrick14Metric | null;
  pageRelationships: readonly SeoRecoveryBrick14PageRelationship[];
  evidenceNote: string;
  nextAction: string;
}>;

const metric = (
  clicks: number,
  impressions: number,
  ctr: number,
  position: number,
): SeoRecoveryBrick14Metric => Object.freeze({ clicks, impressions, ctr, position });

const relationship = (
  path: string,
  clicks: number,
  impressions: number,
  ctr: number,
  position: number,
): SeoRecoveryBrick14PageRelationship => Object.freeze({
  path,
  clicks,
  impressions,
  ctr,
  position,
});

const record = (
  value: Omit<SeoRecoveryBrick14QueryOwnerRecord, 'pageRelationships'> & {
    pageRelationships: readonly SeoRecoveryBrick14PageRelationship[];
  },
): SeoRecoveryBrick14QueryOwnerRecord => Object.freeze({
  ...value,
  pageRelationships: Object.freeze([...value.pageRelationships]),
});

/**
 * Brick 14 uses the same finalized Search Console window as Brick 13.
 * The window ends before the 12 September recovery deployment, so these rows
 * are a baseline for stabilization rather than a post-change verdict.
 */
export const SEO_RECOVERY_BRICK14_BASELINE_WINDOW = Object.freeze({
  siteUrl: 'https://tinystepslearning.com/',
  startDate: '2026-08-13',
  endDate: '2026-09-09',
  comparisonStartDate: '2026-07-16',
  comparisonEndDate: '2026-08-12',
  finalized: true,
  source: 'Google Search Console planning connector — finalized query/page data pulled 2026-09-12',
  postRecoveryDeploymentWindow: false,
});

/**
 * Recovery query owners are deliberately narrow. Commercial owners must stay
 * aligned with Commercial C2, while the informational owners reflect the
 * canonical consolidations completed by Recovery Bricks 5 and 6.
 */
export const SEO_RECOVERY_BRICK14_DESIRED_MAPPING = Object.freeze([
  Object.freeze({
    id: 'phonics-generic-online',
    query: 'online phonics classes',
    desiredOwnerPath: '/phonics',
  }),
  Object.freeze({
    id: 'phonics-generic-classes-online',
    query: 'phonics classes online',
    desiredOwnerPath: '/phonics',
  }),
  Object.freeze({
    id: 'phonics-comparison-best',
    query: 'best phonics classes online',
    desiredOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
  }),
  Object.freeze({
    id: 'phonics-fees',
    query: 'phonics fees',
    desiredOwnerPath: '/phonics-fees-india',
  }),
  Object.freeze({
    id: 'satpin-master',
    query: 'satpin',
    desiredOwnerPath: '/blog/satpin-phonics-guide',
  }),
  Object.freeze({
    id: 'sounds-known-cannot-read',
    query: 'child knows sounds but cannot read',
    desiredOwnerPath: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  }),
] as const);

export const SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE = Object.freeze<readonly SeoRecoveryBrick14QueryOwnerRecord[]>([
  record({
    id: 'phonics-generic-online',
    query: 'online phonics classes',
    intent: 'generic phonics programme',
    desiredOwnerPath: '/phonics',
    status: 'CONSISTENT_OBSERVED',
    evidenceKind: 'query-page',
    queryMetric: metric(3, 104, 0.028846153846153848, 12.923076923076923),
    pageRelationships: [
      relationship('/phonics', 3, 95, 0.031578947368421054, 9.43157894736842),
    ],
    evidenceNote: 'The returned finalized query/page relationship set shows /phonics as the observed owner. The planning export is not exhaustive, so Brick 14 does not claim exclusivity beyond the returned rows.',
    nextAction: 'Protect /phonics and re-check the same query after the stabilization window.',
  }),
  record({
    id: 'phonics-generic-classes-online',
    query: 'phonics classes online',
    intent: 'generic phonics programme',
    desiredOwnerPath: '/phonics',
    status: 'CONSISTENT_OBSERVED',
    evidenceKind: 'query-page',
    queryMetric: metric(6, 174, 0.034482758620689655, 6.350574712643678),
    pageRelationships: [
      relationship('/phonics', 6, 159, 0.03773584905660377, 4.251572327044025),
    ],
    evidenceNote: 'The returned finalized query/page relationship set shows /phonics as the observed owner for the generic class wording.',
    nextAction: 'Protect /phonics and review position recovery without changing ownership.',
  }),
  record({
    id: 'phonics-comparison-best',
    query: 'best phonics classes online',
    intent: 'provider comparison / evaluation',
    desiredOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
    status: 'DRIFT_OBSERVED',
    evidenceKind: 'query-page',
    queryMetric: metric(5, 162, 0.030864197530864196, 3.2098765432098766),
    pageRelationships: [
      relationship('/best-online-phonics-classes-for-kids-in-india', 3, 57, 0.05263157894736842, 3.192982456140351),
      relationship('/phonics', 2, 86, 0.023255813953488372, 5.569767441860465),
      relationship('/', 0, 30, 0, 1),
      relationship('/blog/best-online-phonics-classes-for-kids', 0, 4, 0, 46.75),
    ],
    evidenceNote: 'Search Console explicitly reports this query as a cannibalization candidate. The desired comparison owner wins more clicks and a better average position than /phonics, but multiple Tiny Steps URLs still surface for the same evaluation query.',
    nextAction: 'Do not rewrite again from this pre-deployment window. Brick 15 must verify whether the September recovery changes consolidate the query onto the comparison owner.',
  }),
  record({
    id: 'phonics-fees',
    query: 'phonics fees',
    intent: 'phonics price research',
    desiredOwnerPath: '/phonics-fees-india',
    status: 'NO_DIRECT_SAMPLE',
    evidenceKind: 'page-only',
    queryMetric: null,
    pageRelationships: [
      relationship('/phonics-fees-india', 2, 129, 0.015503875968992248, 7.1937984496124034),
    ],
    evidenceNote: 'The finalized planning response contains a page-level baseline for /phonics-fees-india but does not return a direct query/page row for the exact query "phonics fees" in the surfaced relationship set.',
    nextAction: 'Keep /phonics-fees-india as the locked owner and collect a direct query/page sample during Brick 15 before making any ownership claim.',
  }),
  record({
    id: 'satpin-master',
    query: 'satpin',
    intent: 'SATPIN informational authority',
    desiredOwnerPath: '/blog/satpin-phonics-guide',
    status: 'CONSISTENT_OBSERVED',
    evidenceKind: 'query-page',
    queryMetric: metric(8, 1325, 0.0060377358490566035, 8.409811320754716),
    pageRelationships: [
      relationship('/blog/satpin-phonics-guide', 8, 1311, 0.006102212051868803, 8.319603356216628),
    ],
    evidenceNote: 'The master SATPIN guide is the observed owner for the exact SATPIN query. A related "satpin method" query still also surfaces the home-routine article, which remains a Brick 15 watch item rather than a reason to merge the two pages.',
    nextAction: 'Protect the master guide and monitor related SATPIN variants for residual support-page drift.',
  }),
  record({
    id: 'sounds-known-cannot-read',
    query: 'child knows sounds but cannot read',
    intent: 'parent diagnostic — sounds known but blending/decoding fails',
    desiredOwnerPath: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    status: 'MIGRATION_PENDING',
    evidenceKind: 'page-only',
    queryMetric: null,
    pageRelationships: [
      relationship('/blog/child-knows-letter-sounds-but-cannot-read', 3, 346, 0.008670520231213872, 17.84971098265896),
    ],
    evidenceNote: 'The baseline window predates Brick 5. Search Console still records visibility on the historical route, which now permanently redirects to /blog/why-child-knows-letter-sounds-but-cannot-read-words. This is a migration watch, not evidence that the old URL should be restored.',
    nextAction: 'Verify the historical URL drops out and the canonical diagnostic owner inherits the query family after recrawl/reindexing.',
  }),
]);

export const SEO_RECOVERY_BRICK14_DRIFT_WATCHLIST = Object.freeze([
  Object.freeze({
    query: 'best phonics classes online',
    intendedOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
    competingPaths: Object.freeze([
      '/phonics',
      '/',
      '/blog/best-online-phonics-classes-for-kids',
    ]),
    severity: 'high',
    reason: 'Commercial comparison intent is split across programme, homepage and legacy comparison-content surfaces.',
  }),
  Object.freeze({
    query: 'satpin method',
    intendedOwnerPath: '/blog/satpin-phonics-guide',
    competingPaths: Object.freeze(['/blog/phonics-satpin-launch']),
    severity: 'low',
    reason: 'The support article is allowed to rank for implementation intent, but the master guide must remain the authority owner for broad SATPIN-method queries.',
  }),
  Object.freeze({
    query: 'child knows sounds but cannot read',
    intendedOwnerPath: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    competingPaths: Object.freeze(['/blog/child-knows-letter-sounds-but-cannot-read']),
    severity: 'migration',
    reason: 'The historical diagnostic route was consolidated in Brick 5 and must disappear as an indexable owner after recrawl.',
  }),
] as const);

export const SEO_RECOVERY_BRICK14_DECISION_RULES = Object.freeze({
  useFinalizedGscOnly: true,
  evaluateQueryAndPageTogether: true,
  doNotTreatPageLevelVisibilityAsQueryOwnershipProof: true,
  doNotTreatReturnedQueryPageRowsAsExhaustive: true,
  doNotReactToPreDeploymentDriftWithAnotherBroadRewrite: true,
  retiredUrlsMayNotBecomeCanonicalOwnersAgain: true,
  postDeploymentVerdictAllowed: false,
  handoff: 'Brick 15 owns the 7-day technical check, 14–21-day query-owner review and 28+ day final comparison.',
  closureRule: 'Declare query-owner recovery only from finalized post-deployment query/page evidence after the stabilization window; baseline observations alone cannot close the outcome.',
});
