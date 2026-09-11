import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS,
  COMMERCIAL_C4_OWNER_BASELINES,
  COMMERCIAL_C4_POLICY,
  COMMERCIAL_C4_PRIORITY_PATHS,
  COMMERCIAL_C4_REVISION,
  COMMERCIAL_C4_STATUS,
  evaluateCommercialC4FreshObservation,
} from '../../lib/commercialC4CtrOptimization';
import {
  COMMERCIAL_C4_SERP_OBSERVATIONS,
  COMMERCIAL_C4_SERP_REWRITE_PATHS,
  COMMERCIAL_C4_SERP_SNAPSHOT_STATUS,
} from '../../lib/commercialC4SerpSnapshot';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';

const byPath = new Map(COMMERCIAL_C4_OWNER_BASELINES.map((entry) => [entry.ownerPath, entry]));

describe('commercial C4 CTR optimisation', () => {
  it('arms C4 experiment governance without reopening C2/C3 ownership', () => {
    expect(COMMERCIAL_C4_REVISION).toBe('2026-09-11-c4-r2');
    expect(COMMERCIAL_C4_STATUS).toBe('experiment-governance-armed');
    expect(COMMERCIAL_C4_POLICY.c2OwnershipFrozen).toBe(true);
    expect(COMMERCIAL_C4_POLICY.c3ImplementationFrozen).toBe(true);
    expect(COMMERCIAL_C4_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C4_POLICY.ownershipChangesAllowed).toBe(false);
    expect(COMMERCIAL_C4_POLICY.keywordStuffingAllowed).toBe(false);
  });

  it('baselines every unique C3 commercial owner exactly once', () => {
    expect(COMMERCIAL_C4_OWNER_BASELINES).toHaveLength(COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length);
    expect(new Set(COMMERCIAL_C4_OWNER_BASELINES.map((entry) => entry.ownerPath)).size).toBe(COMMERCIAL_C3_UNIQUE_OWNER_PATHS.length);
    expect(new Set(COMMERCIAL_C4_OWNER_BASELINES.map((entry) => entry.ownerPath))).toEqual(new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS));
  });

  it('uses the frozen historical GSC window and does not pretend it measures the new C3 snippets', () => {
    expect(COMMERCIAL_C4_POLICY.historicalEvidenceFrom).toBe('2026-06-09');
    expect(COMMERCIAL_C4_POLICY.historicalEvidenceThrough).toBe('2026-09-08');
    expect(COMMERCIAL_C4_POLICY.c3DeploymentDate).toBe('2026-09-11');
    expect(COMMERCIAL_C4_POLICY.historicalEvidencePredatesC3).toBe(true);
    expect(COMMERCIAL_C4_POLICY.currentSnippetIsControl).toBe(true);
    expect(COMMERCIAL_C4_POLICY.controlTitleAndDescriptionFrozen).toBe(true);
    expect(COMMERCIAL_C4_POLICY.deployCandidateBeforeFreshEvidence).toBe(false);
  });

  it('ranks the six high-visibility CTR opportunities with a transparent triage score', () => {
    expect(COMMERCIAL_C4_PRIORITY_PATHS).toEqual([
      '/phonics',
      '/best-online-phonics-classes-for-kids-in-india',
      '/online-english-classes-hyderabad',
      '/pricing',
      '/speaking',
      '/grammar',
    ]);
    expect(byPath.get('/phonics')).toMatchObject({ triageHeadroomClicksAt4Pct: 81.4, opportunityScore: 81.4 });
    expect(byPath.get('/pricing')).toMatchObject({ triageHeadroomClicksAt4Pct: 46.1, opportunityScore: 32.2 });
    expect(byPath.get('/grammar')).toMatchObject({ triageHeadroomClicksAt4Pct: 20.4, opportunityScore: 14.8 });
  });

  it('preserves the observed page metrics used by the first priority set', () => {
    expect(byPath.get('/phonics')?.historical).toMatchObject({ impressions: 11306, clicks: 371, ctr: 0.0328, position: 4.86 });
    expect(byPath.get('/best-online-phonics-classes-for-kids-in-india')?.historical).toMatchObject({ impressions: 3835, clicks: 101, ctr: 0.0263, position: 8.69 });
    expect(byPath.get('/online-english-classes-hyderabad')?.historical).toMatchObject({ impressions: 3556, clicks: 86, ctr: 0.0242, position: 7.94 });
    expect(byPath.get('/speaking')?.historical).toMatchObject({ impressions: 2602, clicks: 62, ctr: 0.0238, position: 9.1 });
    expect(byPath.get('/pricing')?.historical).toMatchObject({ impressions: 1551, clicks: 16, ctr: 0.0103, position: 5.09 });
    expect(byPath.get('/grammar')?.historical).toMatchObject({ impressions: 811, clicks: 12, ctr: 0.0148, position: 7.08 });
  });

  it('maps real C1 query samples to the correct active owners without crossing C2 boundaries', () => {
    expect(byPath.get('/phonics')?.querySample).toMatchObject({
      matchedQueryRows: 6,
      impressions: 3448,
      clicks: 45,
      ctr: 0.0131,
      impressionWeightedPosition: 5.29,
      coverage: 'CORE_SAMPLE_COMPLETE',
    });
    expect(byPath.get('/best-online-phonics-classes-for-kids-in-india')?.querySample).toMatchObject({
      matchedQueryRows: 3,
      impressions: 938,
      clicks: 28,
      ctr: 0.0299,
      impressionWeightedPosition: 3.87,
      coverage: 'CORE_SAMPLE_COMPLETE',
    });
    expect(byPath.get('/speaking')?.querySample).toMatchObject({ impressions: 112, clicks: 1, ctr: 0.0089, coverage: 'CORE_SAMPLE_COMPLETE' });
    expect(byPath.get('/grammar')?.querySample).toMatchObject({ impressions: 4, clicks: 0, ctr: 0, coverage: 'CORE_SAMPLE_COMPLETE' });
    expect(byPath.get('/pricing')?.querySample.coverage).toBe('NO_CORE_SAMPLE');
    expect(byPath.get('/online-english-classes-hyderabad')?.querySample.coverage).toBe('NO_CORE_SAMPLE');
  });

  it('freezes both the title and description for every active C3 control snippet', () => {
    expect(Object.keys(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS)).toHaveLength(6);
    expect(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS['/phonics']).toEqual({
      title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps',
      description: 'Live 1:1 online phonics classes for kids ages 3–12 in India and worldwide. Build blending, decoding, spelling and reading fluency with assessment-first placement.',
    });
    expect(COMMERCIAL_C4_ACTIVE_CONTROL_SNIPPETS['/pricing'].description).toContain('₹400/class');
    expect(COMMERCIAL_C4_OWNER_BASELINES.filter((entry) => entry.experimentKind === 'description-only')).toHaveLength(6);
    expect(COMMERCIAL_C4_OWNER_BASELINES.every((entry) => entry.candidateTitle === null)).toBe(true);
    expect(COMMERCIAL_C4_OWNER_BASELINES.every((entry) => entry.deployEligible === false)).toBe(true);
    expect(COMMERCIAL_C4_OWNER_BASELINES.every((entry) => entry.experimentState === 'CONTROL')).toBe(true);
  });

  it('records directional observed-vs-intended SERP titles without treating rewrites as deployment evidence', () => {
    expect(COMMERCIAL_C4_SERP_SNAPSHOT_STATUS).toBe('directional-snapshot-complete');
    expect(COMMERCIAL_C4_SERP_OBSERVATIONS).toHaveLength(6);
    expect(COMMERCIAL_C4_SERP_REWRITE_PATHS).toEqual([
      '/phonics',
      '/online-english-classes-hyderabad',
      '/speaking',
      '/pricing',
      '/grammar',
    ]);
    expect(COMMERCIAL_C4_SERP_OBSERVATIONS.every((entry) => entry.directionalOnly)).toBe(true);
    expect(COMMERCIAL_C4_SERP_OBSERVATIONS.every((entry) => entry.descriptionCaptured === false)).toBe(true);
  });

  it('implements the CONTROL to READY fresh-evidence gate instead of hard-coding future eligibility', () => {
    const ready = evaluateCommercialC4FreshObservation({
      ownerPath: '/phonics',
      observedThrough: '2026-09-25',
      observationDays: 14,
      pageClicks: 12,
      pageImpressions: 250,
      pageCtr: 0.048,
      pagePosition: 4.9,
      queryImpressions: 60,
      qualifiedOrganicLeads: 3,
    });
    expect(ready).toMatchObject({ experimentState: 'READY', deployEligible: true, queryEvidenceRequired: true });

    const blocked = evaluateCommercialC4FreshObservation({
      ownerPath: '/phonics',
      observedThrough: '2026-09-25',
      observationDays: 14,
      pageClicks: 12,
      pageImpressions: 250,
      pageCtr: 0.048,
      pagePosition: 4.9,
      queryImpressions: null,
      qualifiedOrganicLeads: 3,
    });
    expect(blocked).toMatchObject({ experimentState: 'CONTROL', deployEligible: false, meetsQueryImpressions: false });

    const pricingReadyWithoutMappedCoreQuerySample = evaluateCommercialC4FreshObservation({
      ownerPath: '/pricing',
      observedThrough: '2026-09-25',
      observationDays: 14,
      pageClicks: 9,
      pageImpressions: 220,
      pageCtr: 0.0409,
      pagePosition: 5.2,
      queryImpressions: null,
      qualifiedOrganicLeads: 2,
    });
    expect(pricingReadyWithoutMappedCoreQuerySample).toMatchObject({ experimentState: 'READY', deployEligible: true, queryEvidenceRequired: false });
  });

  it('keeps the complete experiment lifecycle explicit and human-reviewed', () => {
    expect(COMMERCIAL_C4_POLICY.experimentLifecycle).toEqual(['CONTROL', 'READY', 'DEPLOYED', 'MEASURING', 'WIN', 'LOSS', 'INCONCLUSIVE']);
    expect(COMMERCIAL_C4_POLICY.minimumFreshObservationDays).toBe(14);
    expect(COMMERCIAL_C4_POLICY.minimumFreshPageImpressions).toBe(200);
    expect(COMMERCIAL_C4_POLICY.minimumFreshQueryImpressions).toBe(50);
    expect(COMMERCIAL_C4_POLICY.measurementRule).toContain('qualified organic leads');
  });
});
