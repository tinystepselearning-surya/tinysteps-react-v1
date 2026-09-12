import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  SEO_RECOVERY_BRICK14_BASELINE_WINDOW,
  SEO_RECOVERY_BRICK14_DECISION_RULES,
  SEO_RECOVERY_BRICK14_DESIRED_MAPPING,
  SEO_RECOVERY_BRICK14_DRIFT_WATCHLIST,
  SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE,
} from '../../config/seoRecoveryBrick14QueryOwnerConsistency';

describe('SEO recovery Brick 14 query-owner consistency', () => {
  it('uses the same finalized pre-deployment baseline window as Brick 13', () => {
    expect(SEO_RECOVERY_BRICK14_BASELINE_WINDOW).toMatchObject({
      startDate: '2026-08-13',
      endDate: '2026-09-09',
      comparisonStartDate: '2026-07-16',
      comparisonEndDate: '2026-08-12',
      finalized: true,
      postRecoveryDeploymentWindow: false,
    });
  });

  it('locks one desired owner for every priority recovery query family', () => {
    expect(SEO_RECOVERY_BRICK14_DESIRED_MAPPING).toEqual([
      { id: 'phonics-generic-online', query: 'online phonics classes', desiredOwnerPath: '/phonics' },
      { id: 'phonics-generic-classes-online', query: 'phonics classes online', desiredOwnerPath: '/phonics' },
      {
        id: 'phonics-comparison-best',
        query: 'best phonics classes online',
        desiredOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
      },
      { id: 'phonics-fees', query: 'phonics fees', desiredOwnerPath: '/phonics-fees-india' },
      { id: 'satpin-master', query: 'satpin', desiredOwnerPath: '/blog/satpin-phonics-guide' },
      {
        id: 'sounds-known-cannot-read',
        query: 'child knows sounds but cannot read',
        desiredOwnerPath: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      },
    ]);
  });

  it('keeps recovery commercial owners aligned with Commercial C2', () => {
    const c2ById = new Map(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => [entry.id, entry]));
    expect(c2ById.get('phonics-provider')?.canonicalOwnerPath).toBe('/phonics');
    expect(c2ById.get('phonics-comparison')?.canonicalOwnerPath).toBe(
      '/best-online-phonics-classes-for-kids-in-india',
    );
    expect(c2ById.get('phonics-price')?.canonicalOwnerPath).toBe('/phonics-fees-india');
  });

  it('records observed generic phonics ownership without claiming the export is exhaustive', () => {
    const byId = new Map(SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE.map((row) => [row.id, row]));

    expect(byId.get('phonics-generic-online')).toMatchObject({
      desiredOwnerPath: '/phonics',
      status: 'CONSISTENT_OBSERVED',
      evidenceKind: 'query-page',
    });
    expect(byId.get('phonics-generic-online')?.pageRelationships).toEqual([
      expect.objectContaining({ path: '/phonics', clicks: 3, impressions: 95 }),
    ]);
    expect(byId.get('phonics-generic-classes-online')?.pageRelationships).toEqual([
      expect.objectContaining({ path: '/phonics', clicks: 6, impressions: 159 }),
    ]);
  });

  it('marks comparison-intent splitting as the principal commercial drift', () => {
    const comparison = SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE.find(
      (row) => row.id === 'phonics-comparison-best',
    );

    expect(comparison).toMatchObject({
      query: 'best phonics classes online',
      desiredOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
      status: 'DRIFT_OBSERVED',
    });
    expect(comparison?.pageRelationships.map((row) => row.path)).toEqual([
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics',
      '/',
      '/blog/best-online-phonics-classes-for-kids',
    ]);
  });

  it('does not fabricate exact-query evidence when only page-level evidence is available', () => {
    const fees = SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE.find((row) => row.id === 'phonics-fees');
    expect(fees).toMatchObject({
      status: 'NO_DIRECT_SAMPLE',
      evidenceKind: 'page-only',
      queryMetric: null,
      desiredOwnerPath: '/phonics-fees-india',
    });
  });

  it('treats the retired parent-diagnostic route as a migration watch, not a valid owner', () => {
    const diagnostic = SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE.find(
      (row) => row.id === 'sounds-known-cannot-read',
    );
    expect(diagnostic).toMatchObject({
      status: 'MIGRATION_PENDING',
      desiredOwnerPath: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    });
    expect(diagnostic?.pageRelationships[0]?.path).toBe('/blog/child-knows-letter-sounds-but-cannot-read');
    expect(SEO_RECOVERY_BRICK14_DECISION_RULES.retiredUrlsMayNotBecomeCanonicalOwnersAgain).toBe(true);
  });

  it('protects the SATPIN master while keeping related support-page drift on the watchlist', () => {
    const satpin = SEO_RECOVERY_BRICK14_QUERY_OWNER_BASELINE.find((row) => row.id === 'satpin-master');
    expect(satpin).toMatchObject({
      desiredOwnerPath: '/blog/satpin-phonics-guide',
      status: 'CONSISTENT_OBSERVED',
    });
    expect(SEO_RECOVERY_BRICK14_DRIFT_WATCHLIST).toContainEqual(
      expect.objectContaining({
        query: 'satpin method',
        intendedOwnerPath: '/blog/satpin-phonics-guide',
      }),
    );
  });

  it('defers the recovery verdict to finalized post-deployment Brick 15 evidence', () => {
    expect(SEO_RECOVERY_BRICK14_DECISION_RULES.postDeploymentVerdictAllowed).toBe(false);
    expect(SEO_RECOVERY_BRICK14_DECISION_RULES.doNotReactToPreDeploymentDriftWithAnotherBroadRewrite).toBe(true);
    expect(SEO_RECOVERY_BRICK14_DECISION_RULES.closureRule).toContain('finalized post-deployment query/page evidence');
    expect(SEO_RECOVERY_BRICK14_DECISION_RULES.handoff).toContain('Brick 15');
  });
});
