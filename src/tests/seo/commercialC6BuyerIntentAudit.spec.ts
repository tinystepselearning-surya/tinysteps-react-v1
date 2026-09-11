import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import { COMMERCIAL_C5_OWNER_FLOWS } from '../../lib/commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE,
  COMMERCIAL_C6_R0_CORE_SURFACE_AUDIT,
  COMMERCIAL_C6_R0_GAPS,
  COMMERCIAL_C6_R0_POLICY,
  COMMERCIAL_C6_R0_REVISION,
  COMMERCIAL_C6_R0_STATUS,
  COMMERCIAL_C6_R0_SUMMARY,
} from '../../lib/commercialC6BuyerIntentAudit';

describe('Commercial C6-R0 buyer/comparison/fees audit', () => {
  it('ships an audit-only C6-R0 baseline', () => {
    expect(COMMERCIAL_C6_R0_REVISION).toBe('2026-09-11-c6-r0');
    expect(COMMERCIAL_C6_R0_STATUS).toBe('buyer-intent-audit-complete');
    expect(COMMERCIAL_C6_R0_POLICY.auditOnly).toBe(true);
    expect(COMMERCIAL_C6_R0_POLICY.livePageCopyChangesAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.newCommercialUrlsAllowed).toBe(false);
  });

  it('preserves C2 ownership and the C4/C5 guardrails', () => {
    expect(COMMERCIAL_C6_R0_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.c4ControlMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.titleChangesAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.metaDescriptionChangesAllowed).toBe(false);
    expect(COMMERCIAL_C6_R0_POLICY.canonicalChangesAllowed).toBe(false);
  });

  it('audits the three current high-intent decision surfaces', () => {
    const paths = COMMERCIAL_C6_R0_CORE_SURFACE_AUDIT.map((entry) => entry.path);
    expect(paths).toEqual([
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
      '/pricing',
    ]);
  });

  it('keeps phonics as the only dedicated comparison and price-research subject at baseline', () => {
    expect(COMMERCIAL_C6_R0_SUMMARY.dedicatedComparisonOwners).toEqual([
      '/best-online-phonics-classes-for-kids-in-india',
    ]);
    expect(COMMERCIAL_C6_R0_SUMMARY.dedicatedPriceResearchOwners).toEqual([
      '/phonics-fees-india',
    ]);
  });

  it('keeps /pricing as the cross-programme fee/value owner', () => {
    expect(COMMERCIAL_C6_R0_SUMMARY.pricingHub).toBe('/pricing');
    const generalPricing = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find(
      (entry) => entry.id === 'general-pricing',
    );
    expect(generalPricing?.canonicalOwnerPath).toBe('/pricing');
    expect(generalPricing?.ownerRole).toBe('pricing-hub');
  });

  it('keeps /book-demo as the single conversion owner from C5', () => {
    expect(COMMERCIAL_C6_R0_SUMMARY.conversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C5_OWNER_FLOWS.filter((entry) => entry.stage === 'conversion')).toHaveLength(1);
    expect(COMMERCIAL_C5_OWNER_FLOWS.find((entry) => entry.stage === 'conversion')?.ownerPath).toBe('/book-demo');
  });

  it('accounts for comparison, price and enrolment evidence without inventing metrics', () => {
    expect(COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.length).toBeGreaterThan(0);
    expect(COMMERCIAL_C6_R0_SUMMARY.comparisonEvidenceRows).toBeGreaterThan(0);
    expect(COMMERCIAL_C6_R0_SUMMARY.priceEvidenceRows).toBeGreaterThan(0);
    expect(COMMERCIAL_C6_R0_SUMMARY.enrolmentEvidenceRows).toBeGreaterThan(0);
    expect(
      COMMERCIAL_C6_R0_SUMMARY.comparisonEvidenceRows
      + COMMERCIAL_C6_R0_SUMMARY.priceEvidenceRows
      + COMMERCIAL_C6_R0_SUMMARY.enrolmentEvidenceRows,
    ).toBe(COMMERCIAL_C6_R0_SUMMARY.totalBuyerIntentEvidenceRows);
  });

  it('maps base phonics comparison and fee intent to their dedicated owners', () => {
    const bestPhonics = COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.find((entry) => entry.id === 'ph-best');
    const phonicsFees = COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.find((entry) => entry.id === 'ph-fees');

    expect(bestPhonics).toMatchObject({
      buyerStage: 'comparison',
      ownerPath: '/best-online-phonics-classes-for-kids-in-india',
      ownerRole: 'comparison',
      coverageClass: 'dedicated-comparison-owner',
    });
    expect(phonicsFees).toMatchObject({
      buyerStage: 'price',
      ownerPath: '/phonics-fees-india',
      ownerRole: 'price-research',
      coverageClass: 'dedicated-price-research-owner',
    });
  });

  it('consolidates non-phonics subject fee intent into /pricing', () => {
    const expected = ['rd-price', 'gr-fees', 'wr-fees', 'se-fees', 'ps-fees'];
    for (const id of expected) {
      const evidence = COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE.find((entry) => entry.id === id);
      expect(evidence).toMatchObject({
        buyerStage: 'price',
        ownerPath: '/pricing',
        ownerRole: 'pricing-hub',
        coverageClass: 'cross-programme-pricing-hub',
      });
    }
  });

  it('recognises non-phonics comparison research without authorising new URLs', () => {
    const comparisonSubjects = new Set(
      COMMERCIAL_C6_R0_BUYER_INTENT_EVIDENCE
        .filter((entry) => entry.buyerStage === 'comparison')
        .map((entry) => entry.subject),
    );
    expect(comparisonSubjects.has('public_speaking')).toBe(true);
    expect(comparisonSubjects.has('grammar')).toBe(true);
    expect(comparisonSubjects.has('broad_english')).toBe(true);
    expect(comparisonSubjects.has('tutor')).toBe(true);
    expect(COMMERCIAL_C6_R0_GAPS.every((gap) => gap.newUrlAuthorized === false)).toBe(true);
  });

  it('protects the declared budget objection prior from being treated as measured performance', () => {
    const guardrail = COMMERCIAL_C6_R0_GAPS.find((gap) => gap.id === 'budget-objection-is-prior-not-measurement');
    expect(guardrail?.severity).toBe('GUARDRAIL');
    expect(guardrail?.finding).toContain('declared operating heuristic');
    expect(guardrail?.finding).toContain('not audited funnel performance');
  });
});
