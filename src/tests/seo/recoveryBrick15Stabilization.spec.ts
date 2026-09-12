import { describe, expect, it } from 'vitest';
import {
  SEO_RECOVERY_BRICK15_BASELINE,
  SEO_RECOVERY_BRICK15_DECISION_RULES,
  SEO_RECOVERY_BRICK15_HANDOFF,
  SEO_RECOVERY_BRICK15_IMPLEMENTATION,
  SEO_RECOVERY_BRICK15_PHASES,
  SEO_RECOVERY_BRICK15_QUERY_OWNER_TARGETS,
  SEO_RECOVERY_BRICK15_RESIDUAL_WATCHLIST,
  SEO_RECOVERY_BRICK15_TECHNICAL_AUTOMATION,
} from '../../config/seoRecoveryBrick15Stabilization';

describe('SEO recovery Brick 15 stabilization', () => {
  it('separates implementation completion from outcome verification', () => {
    expect(SEO_RECOVERY_BRICK15_IMPLEMENTATION).toMatchObject({
      implementationDate: '2026-09-12',
      deploymentDate: null,
      deploymentVerificationRequired: true,
      implementationStatus: 'IMPLEMENTED',
      outcomeStatus: 'OBSERVATION_PENDING',
      noSameDayRecoveryVerdict: true,
    });
    expect(SEO_RECOVERY_BRICK15_DECISION_RULES.implementationCanCloseBeforeOutcomeVerification).toBe(true);
    expect(SEO_RECOVERY_BRICK15_DECISION_RULES.recoveryActivityCanCloseBeforeOutcomeVerification).toBe(false);
  });

  it('locks the three stabilization phases and prevents early ranking conclusions', () => {
    expect(SEO_RECOVERY_BRICK15_PHASES.map((entry) => entry.id)).toEqual(['days-1-7','days-14-21','day-28-plus']);
    const deployment = SEO_RECOVERY_BRICK15_PHASES[0];
    expect(deployment.rankingConclusionAllowed).toBe(false);
    expect(deployment.newSeoPageDecisionAllowed).toBe(false);
    expect(deployment.checks).toEqual(expect.arrayContaining(['redirects','canonical tags','sitemap','indexing','broken links','Google-selected canonical','internal-link updates']));
  });

  it('requires query-owner and commercial search review at days 14–21', () => {
    const preliminary = SEO_RECOVERY_BRICK15_PHASES[1];
    expect(preliminary.checks).toEqual(expect.arrayContaining(['query-owner consistency','commercial impressions','commercial ranking movement','CTR trends','ranking URL changes']));
    expect(preliminary.newSeoPageDecisionAllowed).toBe(false);
  });

  it('allows structural SEO decisions only after the full 28+ day review', () => {
    const finalReview = SEO_RECOVERY_BRICK15_PHASES[2];
    expect(finalReview.newSeoPageDecisionAllowed).toBe(true);
    expect(finalReview.checks).toContain('complete finalized GSC window');
    expect(SEO_RECOVERY_BRICK15_DECISION_RULES.requireFullPostChangeWindowForFinalDecision).toBe(true);
    expect(SEO_RECOVERY_BRICK15_DECISION_RULES.noNewSeoPagesBeforeFullReview).toBe(true);
  });

  it('inherits the locked GSC baseline without pretending it is post-deployment evidence', () => {
    expect(SEO_RECOVERY_BRICK15_BASELINE.current).toMatchObject({startDate:'2026-08-13',endDate:'2026-09-09',finalized:true,clicks:3490,impressions:46626});
    expect(SEO_RECOVERY_BRICK15_BASELINE.baselineEndsBeforeRecoveryImplementation).toBe(true);
    expect(SEO_RECOVERY_BRICK15_BASELINE.queryOwnerWindow.postRecoveryDeploymentWindow).toBe(false);
  });

  it('inherits the six Brick 14 owner targets and residual watches', () => {
    expect(SEO_RECOVERY_BRICK15_QUERY_OWNER_TARGETS).toHaveLength(6);
    expect(SEO_RECOVERY_BRICK15_QUERY_OWNER_TARGETS).toContainEqual(expect.objectContaining({query:'online phonics classes',desiredOwnerPath:'/phonics'}));
    expect(SEO_RECOVERY_BRICK15_QUERY_OWNER_TARGETS).toContainEqual(expect.objectContaining({query:'best phonics classes online',desiredOwnerPath:'/best-online-phonics-classes-for-kids-in-india'}));
    expect(SEO_RECOVERY_BRICK15_RESIDUAL_WATCHLIST).toContainEqual(expect.objectContaining({query:'best phonics classes online',severity:'high'}));
  });

  it('reuses the technical consolidation audit while reserving live Google checks for observation', () => {
    expect(SEO_RECOVERY_BRICK15_TECHNICAL_AUTOMATION.sourceAuditCommand).toBe('npm run seo:recovery-brick11');
    expect(SEO_RECOVERY_BRICK15_TECHNICAL_AUTOMATION.validates).toContain('direct permanent redirects');
    expect(SEO_RECOVERY_BRICK15_TECHNICAL_AUTOMATION.liveChecksStillRequired).toEqual(expect.arrayContaining(['live redirect responses','rendered canonical tags on production','Google-selected canonical','live indexing state']));
  });

  it('keeps revenue SEO separate from traffic growth and freezes broad rewrites during observation', () => {
    expect(SEO_RECOVERY_BRICK15_DECISION_RULES).toMatchObject({useFinalizedGscOnly:true,evaluateQueryAndRankingUrlTogether:true,separateRevenueSeoFromTrafficSeo:true,doNotUseFreeResourceGrowthToOffsetCommercialWeakness:true,noBroadRewriteFromOneShortWindow:true,preserveLockedOwnersDuringObservation:true,retiredUrlsMayNotBeRestoredAsOwners:true});
  });

  it('hands off to growth only after recovery outcome closure', () => {
    expect(SEO_RECOVERY_BRICK15_HANDOFF.implementationState).toContain('Bricks 0–15');
    expect(SEO_RECOVERY_BRICK15_HANDOFF.observationState).toContain('remains open');
    expect(SEO_RECOVERY_BRICK15_HANDOFF.nextModeAfterClosure).toContain('only after final recovery closure');
  });
});
