import { RESOURCE_EXPANSION_GATE_REVISION } from './resourceExpansionGovernance.js';

export { RESOURCE_EXPANSION_GATE_REVISION };

export type ResourceExpansionStatus =
  | 'promote'
  | 'observe'
  | 'repair'
  | 'insufficient-evidence'
  | 'blocked';

export type ResourceExpansionScopeType = 'page' | 'cluster';

export type ResourceTechnicalEvidence = {
  readonly indexable: boolean;
  readonly canonicalSelf: boolean;
  readonly inResourceSitemap: boolean;
  readonly reachableFromHub: boolean;
  readonly indexed?: boolean | null;
};

export type ResourceSearchEvidence = {
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly averagePosition: number;
  readonly queryCount?: number;
};

export type ResourceEngagementEvidence = {
  readonly pageViews: number;
  readonly relatedResourceClicks: number;
  readonly practiceClicks: number;
  readonly commercialClicks: number;
};

export type ResourceConversionEvidence = {
  readonly demoClicks: number;
  readonly leadStarts: number;
  readonly leads: number;
};

export type ResourceCannibalisationEvidence = {
  readonly confirmed: boolean;
  readonly competingPath?: string;
  readonly queryFamily?: string;
};

export type ResourceExpansionEvidence = {
  readonly scopeType: ResourceExpansionScopeType;
  readonly scopeId: string;
  readonly pagePath?: string;
  readonly clusterId?: string;
  readonly collectionDays: number;
  readonly technical: ResourceTechnicalEvidence;
  readonly search: ResourceSearchEvidence;
  readonly engagement: ResourceEngagementEvidence;
  readonly conversions: ResourceConversionEvidence;
  readonly cannibalisation?: ResourceCannibalisationEvidence;
};

export type ResourceExpansionDecision = {
  readonly revision: typeof RESOURCE_EXPANSION_GATE_REVISION;
  readonly status: ResourceExpansionStatus;
  readonly scopeType: ResourceExpansionScopeType;
  readonly scopeId: string;
  /** Expansion is blocked only for the evaluated page/cluster, never globally. */
  readonly blockScope: 'none' | ResourceExpansionScopeType;
  readonly blocksOtherClusters: false;
  readonly reasons: readonly string[];
  readonly signals: readonly string[];
};

export const RESOURCE_EXPANSION_THRESHOLDS = Object.freeze({
  minimumCollectionDays: 14,
  minimumSearchImpressions: 100,
  meaningfulSearchImpressions: 250,
  repairCtrBelow: 0.01,
  repairAveragePositionWorseThan: 35,
  promoteAveragePositionAtOrBetterThan: 20,
  promoteCtrAtOrAbove: 0.02,
  minimumEngagementViews: 25,
});

function nonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function buildDecision(
  evidence: ResourceExpansionEvidence,
  status: ResourceExpansionStatus,
  reasons: string[],
  signals: string[],
): ResourceExpansionDecision {
  return Object.freeze({
    revision: RESOURCE_EXPANSION_GATE_REVISION,
    status,
    scopeType: evidence.scopeType,
    scopeId: evidence.scopeId,
    blockScope: status === 'blocked' ? evidence.scopeType : 'none',
    blocksOtherClusters: false as const,
    reasons: Object.freeze(reasons),
    signals: Object.freeze(signals),
  });
}

/**
 * Evaluate one page or one cluster at a time.
 *
 * This is deliberately not a global publishing brake. A broken page can block
 * itself, a cannibalising cluster can block that cluster, and unrelated healthy
 * clusters remain eligible for expansion.
 *
 * GSC metrics are inputs to this pure function. The repo never manufactures
 * current Search Console evidence when no finalized export is available.
 */
export function evaluateResourceExpansionEvidence(
  evidence: ResourceExpansionEvidence,
): ResourceExpansionDecision {
  const reasons: string[] = [];
  const signals: string[] = [];
  const technical = evidence.technical;
  const search = {
    impressions: nonNegative(evidence.search.impressions),
    clicks: nonNegative(evidence.search.clicks),
    ctr: nonNegative(evidence.search.ctr),
    averagePosition: nonNegative(evidence.search.averagePosition),
  };
  const engagement = {
    pageViews: nonNegative(evidence.engagement.pageViews),
    relatedResourceClicks: nonNegative(evidence.engagement.relatedResourceClicks),
    practiceClicks: nonNegative(evidence.engagement.practiceClicks),
    commercialClicks: nonNegative(evidence.engagement.commercialClicks),
  };
  const conversions = {
    demoClicks: nonNegative(evidence.conversions.demoClicks),
    leadStarts: nonNegative(evidence.conversions.leadStarts),
    leads: nonNegative(evidence.conversions.leads),
  };

  const technicalFailures = [
    !technical.indexable && 'not indexable',
    !technical.canonicalSelf && 'canonical does not resolve to the evaluated URL',
    !technical.inResourceSitemap && 'missing from the Resources sitemap',
    !technical.reachableFromHub && 'not reachable from the Resources hub graph',
  ].filter(Boolean) as string[];

  if (technicalFailures.length > 0) {
    reasons.push(...technicalFailures);
    return buildDecision(evidence, 'blocked', reasons, signals);
  }

  if (evidence.cannibalisation?.confirmed) {
    const detail = [
      evidence.cannibalisation.queryFamily && `query family ${evidence.cannibalisation.queryFamily}`,
      evidence.cannibalisation.competingPath && `competing with ${evidence.cannibalisation.competingPath}`,
    ].filter(Boolean).join(' · ');
    reasons.push(`confirmed search-intent cannibalisation${detail ? `: ${detail}` : ''}`);
    return buildDecision(evidence, 'blocked', reasons, signals);
  }

  if (technical.indexed === false && evidence.collectionDays >= RESOURCE_EXPANSION_THRESHOLDS.minimumCollectionDays) {
    reasons.push('published/indexable resource is still reported as not indexed after the minimum observation window');
    return buildDecision(evidence, 'repair', reasons, signals);
  }

  if (
    evidence.collectionDays < RESOURCE_EXPANSION_THRESHOLDS.minimumCollectionDays ||
    search.impressions < RESOURCE_EXPANSION_THRESHOLDS.minimumSearchImpressions
  ) {
    reasons.push('not enough finalized observation time/search evidence yet');
    if (search.impressions > 0) signals.push(`${search.impressions} search impressions already observed`);
    if (engagement.pageViews > 0) signals.push(`${engagement.pageViews} measured resource views already observed`);
    return buildDecision(evidence, 'insufficient-evidence', reasons, signals);
  }

  const weakSearchSignal =
    search.impressions >= RESOURCE_EXPANSION_THRESHOLDS.meaningfulSearchImpressions &&
    search.ctr < RESOURCE_EXPANSION_THRESHOLDS.repairCtrBelow &&
    search.averagePosition > RESOURCE_EXPANSION_THRESHOLDS.repairAveragePositionWorseThan;

  if (weakSearchSignal) {
    reasons.push('meaningful search exposure has weak CTR and weak average position');
    signals.push(`${search.impressions} impressions`, `${(search.ctr * 100).toFixed(2)}% CTR`, `position ${search.averagePosition.toFixed(1)}`);
    return buildDecision(evidence, 'repair', reasons, signals);
  }

  const engagementActions =
    engagement.relatedResourceClicks +
    engagement.practiceClicks +
    engagement.commercialClicks;
  const conversionActions = conversions.demoClicks + conversions.leadStarts + conversions.leads;
  const healthySearch =
    search.averagePosition <= RESOURCE_EXPANSION_THRESHOLDS.promoteAveragePositionAtOrBetterThan ||
    search.ctr >= RESOURCE_EXPANSION_THRESHOLDS.promoteCtrAtOrAbove;
  const healthyEngagement =
    engagement.pageViews >= RESOURCE_EXPANSION_THRESHOLDS.minimumEngagementViews &&
    (engagementActions > 0 || conversionActions > 0);

  if (healthySearch && healthyEngagement) {
    reasons.push('search discovery and on-site engagement both support expansion');
    signals.push(`${search.impressions} impressions`, `${engagement.pageViews} resource views`);
    if (engagement.practiceClicks > 0) signals.push(`${engagement.practiceClicks} practice clicks`);
    if (engagement.commercialClicks > 0) signals.push(`${engagement.commercialClicks} commercial assists`);
    if (conversionActions > 0) signals.push(`${conversionActions} downstream conversion actions`);
    return buildDecision(evidence, 'promote', reasons, signals);
  }

  reasons.push('evidence is sufficient to monitor, but does not yet justify promotion or repair');
  signals.push(`${search.impressions} impressions`, `${engagement.pageViews} resource views`);
  return buildDecision(evidence, 'observe', reasons, signals);
}
