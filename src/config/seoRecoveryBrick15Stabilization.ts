import {
  SEO_RECOVERY_BRICK13_GSC_BASELINE,
  SEO_RECOVERY_BRICK13_REVIEW_CADENCE,
} from './seoRecoveryBrick13Measurement';
import {
  SEO_RECOVERY_BRICK14_BASELINE_WINDOW,
  SEO_RECOVERY_BRICK14_DESIRED_MAPPING,
  SEO_RECOVERY_BRICK14_DRIFT_WATCHLIST,
} from './seoRecoveryBrick14QueryOwnerConsistency';

export type SeoRecoveryBrick15GateStatus = 'IMPLEMENTED' | 'OBSERVATION_PENDING';
export type SeoRecoveryBrick15PhaseId = 'days-1-7' | 'days-14-21' | 'day-28-plus';

export type SeoRecoveryBrick15Phase = Readonly<{
  id: SeoRecoveryBrick15PhaseId;
  label: string;
  timing: string;
  purpose: string;
  checks: readonly string[];
  rankingConclusionAllowed: boolean;
  newSeoPageDecisionAllowed: boolean;
}>;

const phase = (value: SeoRecoveryBrick15Phase): SeoRecoveryBrick15Phase => Object.freeze({
  ...value,
  checks: Object.freeze([...value.checks]),
});

export const SEO_RECOVERY_BRICK15_IMPLEMENTATION = Object.freeze({
  implementationDate: '2026-09-12',
  deploymentDate: null as string | null,
  deploymentVerificationRequired: true,
  implementationStatus: 'IMPLEMENTED' as SeoRecoveryBrick15GateStatus,
  outcomeStatus: 'OBSERVATION_PENDING' as SeoRecoveryBrick15GateStatus,
  noSameDayRecoveryVerdict: true,
});

export const SEO_RECOVERY_BRICK15_PHASES = Object.freeze<readonly SeoRecoveryBrick15Phase[]>([
  phase({
    id: 'days-1-7',
    label: 'Deployment and technical stabilization',
    timing: SEO_RECOVERY_BRICK13_REVIEW_CADENCE.deploymentCheck,
    purpose: 'Confirm the recovery architecture is deployed cleanly before interpreting ranking movement.',
    checks: ['redirects','canonical tags','sitemap','indexing','broken links','Google-selected canonical','internal-link updates'],
    rankingConclusionAllowed: false,
    newSeoPageDecisionAllowed: false,
  }),
  phase({
    id: 'days-14-21',
    label: 'Preliminary search stabilization review',
    timing: SEO_RECOVERY_BRICK13_REVIEW_CADENCE.preliminarySearchReview,
    purpose: 'Use finalized Search Console data to determine whether intended owners are consolidating and commercial visibility is stabilizing.',
    checks: ['query-owner consistency','commercial impressions','commercial ranking movement','CTR trends','ranking URL changes'],
    rankingConclusionAllowed: true,
    newSeoPageDecisionAllowed: false,
  }),
  phase({
    id: 'day-28-plus',
    label: 'Full recovery comparison',
    timing: SEO_RECOVERY_BRICK13_REVIEW_CADENCE.fullRecoveryReview,
    purpose: 'Compare a complete finalized post-change window against the locked recovery baseline and decide whether any further structural SEO action is justified.',
    checks: ['complete finalized GSC window','commercial query performance versus baseline','query-owner consistency versus baseline','CTR experiment outcome','technical/indexation regression review','business-attribution context after cohort maturation'],
    rankingConclusionAllowed: true,
    newSeoPageDecisionAllowed: true,
  }),
]);

export const SEO_RECOVERY_BRICK15_TECHNICAL_AUTOMATION = Object.freeze({
  sourceAudit: 'scripts/audit-seo-recovery-brick11.mjs',
  sourceAuditCommand: 'npm run seo:recovery-brick11',
  regenerateSitemapsCommand: 'npm run gen:sitemaps',
  regenerateDiscoveryCommand: 'npm run generate:rss',
  consolidationCommand: 'npm run seo:blog-consolidation',
  validates: Object.freeze(['self-canonical priority routes','priority sitemap inclusion','retired URL exclusion from generated discovery surfaces','direct permanent redirects','redirect-chain absence','canonical internal-link rewrite controls','build and prebuild SEO ordering']),
  liveChecksStillRequired: Object.freeze(['live redirect responses','rendered canonical tags on production','Google-selected canonical','live indexing state']),
});

export const SEO_RECOVERY_BRICK15_BASELINE = Object.freeze({
  site: SEO_RECOVERY_BRICK13_GSC_BASELINE.siteUrl,
  current: SEO_RECOVERY_BRICK13_GSC_BASELINE.current,
  comparison: SEO_RECOVERY_BRICK13_GSC_BASELINE.comparison,
  queryOwnerWindow: SEO_RECOVERY_BRICK14_BASELINE_WINDOW,
  baselineEndsBeforeRecoveryImplementation: true,
});

export const SEO_RECOVERY_BRICK15_QUERY_OWNER_TARGETS = SEO_RECOVERY_BRICK14_DESIRED_MAPPING;
export const SEO_RECOVERY_BRICK15_RESIDUAL_WATCHLIST = SEO_RECOVERY_BRICK14_DRIFT_WATCHLIST;

export const SEO_RECOVERY_BRICK15_DECISION_RULES = Object.freeze({
  useFinalizedGscOnly: true,
  evaluateQueryAndRankingUrlTogether: true,
  separateRevenueSeoFromTrafficSeo: true,
  doNotUseFreeResourceGrowthToOffsetCommercialWeakness: true,
  noRankingConclusionDuringDays1To7: true,
  noNewSeoPagesBeforeFullReview: true,
  noBroadRewriteFromOneShortWindow: true,
  preserveLockedOwnersDuringObservation: true,
  retiredUrlsMayNotBeRestoredAsOwners: true,
  requireFullPostChangeWindowForFinalDecision: true,
  implementationCanCloseBeforeOutcomeVerification: true,
  recoveryActivityCanCloseBeforeOutcomeVerification: false,
  finalClosureRule: 'Close the recovery activity only after the 28+ day finalized comparison, technical checks, query-owner review and business-context review are complete with no unresolved material cannibalisation.',
});

export const SEO_RECOVERY_BRICK15_HANDOFF = Object.freeze({
  implementationState: 'Recovery implementation across Bricks 0–15 can be complete once Brick 15 controls pass CI.',
  observationState: 'Recovery outcome remains open until the stabilization gates are actually observed on finalized post-deployment data.',
  nextModeAfterClosure: 'growth / CRO / content expansion may resume only after final recovery closure criteria are met',
});
