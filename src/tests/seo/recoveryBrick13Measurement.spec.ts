import { describe, expect, it } from 'vitest';
import {
  SEO_RECOVERY_BRICK13_ATTRIBUTION,
  SEO_RECOVERY_BRICK13_BUCKETS,
  SEO_RECOVERY_BRICK13_DECISION_RULES,
  SEO_RECOVERY_BRICK13_GSC_BASELINE,
  SEO_RECOVERY_BRICK13_PRIORITY_GSC_BASELINES,
  SEO_RECOVERY_BRICK13_REVENUE_QUERY_BASELINES,
  SEO_RECOVERY_BRICK13_REVIEW_CADENCE,
} from '../../config/seoRecoveryBrick13Measurement';

describe('SEO recovery Brick 13 measurement framework', () => {
  it('locks the finalized GSC before/after baseline windows', () => {
    expect(SEO_RECOVERY_BRICK13_GSC_BASELINE.current).toMatchObject({
      startDate: '2026-08-13',
      endDate: '2026-09-09',
      finalized: true,
      clicks: 3490,
      impressions: 46626,
    });
    expect(SEO_RECOVERY_BRICK13_GSC_BASELINE.comparison).toMatchObject({
      startDate: '2026-07-16',
      endDate: '2026-08-12',
      finalized: true,
      clicks: 1794,
      impressions: 35296,
    });
    expect(SEO_RECOVERY_BRICK13_GSC_BASELINE.finalizationLagDaysApprox).toBe(3);
  });

  it('keeps revenue, qualified informational and traffic SEO separate', () => {
    expect(Object.keys(SEO_RECOVERY_BRICK13_BUCKETS)).toEqual([
      'revenue',
      'qualified-informational',
      'traffic',
    ]);

    expect(SEO_RECOVERY_BRICK13_BUCKETS.revenue.pages).toContain('/phonics');
    expect(SEO_RECOVERY_BRICK13_BUCKETS.revenue.pages).toContain('/phonics-fees-india');
    expect(SEO_RECOVERY_BRICK13_BUCKETS['qualified-informational'].pages).toContain(
      '/blog/satpin-phonics-guide',
    );
    expect(SEO_RECOVERY_BRICK13_BUCKETS['qualified-informational'].pages).toContain(
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    );
    expect(SEO_RECOVERY_BRICK13_BUCKETS.traffic.pages).toContain(
      '/free-letter-tracing-game-for-kids',
    );
  });

  it('protects the key GSC baselines that explain the recovery problem', () => {
    const phonics = SEO_RECOVERY_BRICK13_PRIORITY_GSC_BASELINES.find((row) => row.page === '/phonics');
    const satpin = SEO_RECOVERY_BRICK13_PRIORITY_GSC_BASELINES.find(
      (row) => row.page === '/blog/satpin-phonics-guide',
    );
    const tracing = SEO_RECOVERY_BRICK13_PRIORITY_GSC_BASELINES.find(
      (row) => row.page === '/free-letter-tracing-game-for-kids',
    );

    expect(phonics).toMatchObject({ clicks: 128, impressions: 3966 });
    expect(satpin).toMatchObject({ clicks: 83, impressions: 6907 });
    expect(tracing).toMatchObject({ clicks: 1931, impressions: 19975 });
  });

  it('tracks commercial query performance independently from whole-site growth', () => {
    const byQuery = new Map(SEO_RECOVERY_BRICK13_REVENUE_QUERY_BASELINES.map((row) => [row.query, row]));
    expect(byQuery.get('phonics classes online')?.position).toBeCloseTo(6.350574712643678);
    expect(byQuery.get('online phonics classes for kids')?.position).toBeCloseTo(8.385964912280702);
    expect(byQuery.get('phonics online classes')?.position).toBeCloseTo(9.62295081967213);
    expect(byQuery.get('best phonics classes online')?.position).toBeCloseTo(3.2098765432098766);
  });

  it('adds business attribution without crediting non-Google channels to Google Organic', () => {
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.august2026).toMatchObject({
      leads: 161,
      reachedDemo: 156,
      admitted: 8,
    });
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.august2026.channels.googleOrganic).toEqual({
      leads: 40,
      demo: 40,
      admitted: 2,
    });
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.august2026.channels.chatgpt).toEqual({
      leads: 66,
      demo: 66,
      admitted: 4,
    });
    expect(SEO_RECOVERY_BRICK13_DECISION_RULES.attributionRule).toContain(
      'must not be credited to Google Organic',
    );
  });

  it('treats the September attribution snapshot as an immature cohort', () => {
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.september2026Snapshot.period).toContain(
      'exact start/end dates not supplied',
    );
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.september2026Snapshot.cohortMaturity).toContain(
      'do not interpret zero admissions as final',
    );
    expect(SEO_RECOVERY_BRICK13_ATTRIBUTION.september2026Snapshot.channels.googleOrganic).toEqual({
      leads: 24,
      demo: 24,
      admitted: 0,
    });
  });

  it('prevents traffic growth from masking revenue-intent weakness', () => {
    expect(SEO_RECOVERY_BRICK13_DECISION_RULES.doNotUseTotalTrafficAsRevenueProxy).toBe(true);
    expect(SEO_RECOVERY_BRICK13_DECISION_RULES.trafficRule).toContain(
      'cannot offset a decline in revenue-intent search performance',
    );
    expect(SEO_RECOVERY_BRICK13_DECISION_RULES.requireOwnerConsistencyBeforeDeclaringWin).toBe(true);
  });

  it('locks the stabilization cadence instead of reacting to one short window', () => {
    expect(SEO_RECOVERY_BRICK13_REVIEW_CADENCE).toMatchObject({
      deploymentCheck: '7 days after deployment',
      preliminarySearchReview: '14–21 days after deployment',
      fullRecoveryReview: '28+ days after deployment',
    });
  });
});
