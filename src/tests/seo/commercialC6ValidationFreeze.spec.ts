import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C3_UNIQUE_OWNER_PATHS } from '../../lib/commercialC3OwnerPageAudit';
import { COMMERCIAL_C4_STATUS } from '../../lib/commercialC4CtrOptimization';
import { COMMERCIAL_C5_POLICY } from '../../lib/commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R5_MILESTONES,
  COMMERCIAL_C6_R5_POLICY,
  COMMERCIAL_C6_R5_REVISION,
  COMMERCIAL_C6_R5_STATUS,
  COMMERCIAL_C6_R5_SUMMARY,
  COMMERCIAL_C6_STATUS,
} from '../../lib/commercialC6ValidationFreeze';

const repoRoot = path.resolve(__dirname, '../../..');
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Commercial C6-R5 validation and freeze', () => {
  it('marks C6 validation complete and freezes the workstream', () => {
    expect(COMMERCIAL_C6_R5_REVISION).toBe('2026-09-11-c6-r5');
    expect(COMMERCIAL_C6_R5_STATUS).toBe('validation-complete');
    expect(COMMERCIAL_C6_STATUS).toBe('frozen');
    expect(COMMERCIAL_C6_R5_POLICY.c6Frozen).toBe(true);
    expect(COMMERCIAL_C6_R5_SUMMARY.finalStatus).toBe('frozen');
  });

  it('accounts for every C6 milestone from R0 through R5', () => {
    expect(COMMERCIAL_C6_R5_MILESTONES.map((entry) => entry.id)).toEqual(['R0', 'R1', 'R2', 'R3', 'R4', 'R5']);
    expect(COMMERCIAL_C6_R5_MILESTONES).toHaveLength(6);
    expect(COMMERCIAL_C6_R5_SUMMARY.milestoneCount).toBe(6);
    expect(COMMERCIAL_C6_R5_MILESTONES.find((entry) => entry.id === 'R2')?.status).toBe('pricing-decision-support-implemented');
  });

  it('freezes the same 14-owner architecture with one conversion owner', () => {
    expect(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).toHaveLength(14);
    expect(new Set(COMMERCIAL_C3_UNIQUE_OWNER_PATHS).size).toBe(14);
    expect(COMMERCIAL_C6_R5_POLICY.frozenOwnerCount).toBe(14);
    expect(COMMERCIAL_C6_R5_SUMMARY.ownerCount).toBe(14);
    expect(COMMERCIAL_C6_R5_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C5_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C6_R5_POLICY.crossProgrammePricingOwner).toBe('/pricing');
  });

  it('preserves the comparison, fee-research and pricing ownership shape', () => {
    expect(COMMERCIAL_C6_R5_SUMMARY.dedicatedComparisonOwnerCount).toBe(1);
    expect(COMMERCIAL_C6_R5_SUMMARY.dedicatedPriceResearchOwnerCount).toBe(1);
    expect(COMMERCIAL_C6_R5_SUMMARY.r2ApprovedOwnerCount).toBe(1);
    expect(COMMERCIAL_C6_R5_POLICY.dedicatedComparisonOwner).toBe('/best-online-phonics-classes-for-kids-in-india');
    expect(COMMERCIAL_C6_R5_POLICY.dedicatedPhonicsPriceResearchOwner).toBe('/phonics-fees-india');
  });

  it('freezes the parent decision and internal-path outcomes', () => {
    expect(COMMERCIAL_C6_R5_SUMMARY.parentDecisionGateCount).toBe(5);
    expect(COMMERCIAL_C6_R5_SUMMARY.strategicJourneyCount).toBe(6);
    expect(COMMERCIAL_C6_R5_SUMMARY.directAssessmentOwnerCount).toBe(13);
  });

  it('verifies the R2 pricing implementation still exists on the approved owner', () => {
    const pricingSource = read('src/pages/PricingPage.tsx');
    expect(pricingSource).toContain('const subjectPricingRoutes = [');
    expect(pricingSource).toContain('Fees by learning need');
    expect(pricingSource).toContain('this page remains the Tiny Steps fee and value owner');
    expect(pricingSource).toContain('Phonics is the exception:');
    expect(pricingSource).toContain('to="/phonics-fees-india"');
    expect(pricingSource).toContain('to="/book-demo"');
  });

  it('keeps C4 observation active while C6 is frozen', () => {
    expect(COMMERCIAL_C4_STATUS).toBe('experiment-governance-armed');
    expect(COMMERCIAL_C6_R5_POLICY.c4ObservationContinuesAfterC6Freeze).toBe(true);
    expect(COMMERCIAL_C6_R5_POLICY.c4MetadataMutationAllowed).toBe(false);
  });

  it('blocks routine architecture expansion after freeze', () => {
    expect(COMMERCIAL_C6_R5_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C6_R5_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R5_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R5_POLICY.reopenRequiresNewEvidence).toBe(true);
    expect(COMMERCIAL_C6_R5_POLICY.permittedPostFreezeWork).toContain('C7 knowledge-to-commercial conversion graph');
    expect(COMMERCIAL_C6_R5_POLICY.permittedPostFreezeWork).toContain('C8 trust, evidence and differentiation');
    expect(COMMERCIAL_C6_R5_POLICY.permittedPostFreezeWork).toContain('C9 external authority and brand-search growth');
  });
});
