import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C4_OWNER_BASELINES,
  COMMERCIAL_C4_POLICY,
  COMMERCIAL_C4_PRIORITY_PATHS,
  COMMERCIAL_C4_REVISION,
  COMMERCIAL_C4_STATUS,
} from '../../lib/commercialC4CtrOptimization';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';

const byPath = new Map(COMMERCIAL_C4_OWNER_BASELINES.map((entry) => [entry.ownerPath, entry]));

describe('commercial C4 CTR optimisation', () => {
  it('arms C4 without reopening C2/C3 ownership', () => {
    expect(COMMERCIAL_C4_REVISION).toBe('2026-09-11-c4-r1');
    expect(COMMERCIAL_C4_STATUS).toBe('baseline-armed');
    expect(COMMERCIAL_C4_POLICY.c2OwnershipFrozen).toBe(true);
    expect(COMMERCIAL_C4_POLICY.c3ImplementationFrozen).toBe(true);
    expect(COMMERCIAL_C4_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C4_POLICY.ownershipChangesAllowed).toBe(false);
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
    expect(COMMERCIAL_C4_POLICY.deployCandidateBeforeFreshEvidence).toBe(false);
  });

  it('identifies the six strongest historical CTR observation opportunities', () => {
    expect(COMMERCIAL_C4_PRIORITY_PATHS).toEqual([
      '/phonics',
      '/best-online-phonics-classes-for-kids-in-india',
      '/grammar',
      '/speaking',
      '/online-english-classes-hyderabad',
      '/pricing',
    ]);
  });

  it('preserves the observed page metrics used to rank the first priority set', () => {
    expect(byPath.get('/phonics')?.historical).toMatchObject({ impressions: 11306, clicks: 371, ctr: 0.0328, position: 4.86 });
    expect(byPath.get('/best-online-phonics-classes-for-kids-in-india')?.historical).toMatchObject({ impressions: 3835, clicks: 101, ctr: 0.0263, position: 8.69 });
    expect(byPath.get('/online-english-classes-hyderabad')?.historical).toMatchObject({ impressions: 3556, clicks: 86, ctr: 0.0242, position: 7.94 });
    expect(byPath.get('/speaking')?.historical).toMatchObject({ impressions: 2602, clicks: 62, ctr: 0.0238, position: 9.1 });
    expect(byPath.get('/pricing')?.historical).toMatchObject({ impressions: 1551, clicks: 16, ctr: 0.0103, position: 5.09 });
    expect(byPath.get('/grammar')?.historical).toMatchObject({ impressions: 811, clicks: 12, ctr: 0.0148, position: 7.08 });
  });

  it('prepares description-only candidates for high-confidence pages but deploys none in r1', () => {
    const candidates = COMMERCIAL_C4_OWNER_BASELINES.filter((entry) => entry.experimentKind === 'description-only');
    expect(candidates.map((entry) => entry.ownerPath)).toEqual([
      '/phonics',
      '/best-online-phonics-classes-for-kids-in-india',
      '/grammar',
      '/speaking',
      '/online-english-classes-hyderabad',
      '/pricing',
    ]);
    expect(candidates.every((entry) => Boolean(entry.candidateDescription))).toBe(true);
    expect(COMMERCIAL_C4_OWNER_BASELINES.every((entry) => entry.deployEligible === false)).toBe(true);
  });

  it('requires fresh post-C3 evidence before a snippet experiment can be deployed', () => {
    expect(COMMERCIAL_C4_POLICY.minimumFreshObservationDays).toBe(14);
    expect(COMMERCIAL_C4_POLICY.minimumFreshPageImpressions).toBe(200);
    expect(COMMERCIAL_C4_POLICY.minimumFreshQueryImpressions).toBe(50);
  });
});
