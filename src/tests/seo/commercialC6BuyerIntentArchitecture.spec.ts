import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import { COMMERCIAL_C5_OWNER_FLOWS } from '../../lib/commercialC5ConversionFlow';
import {
  COMMERCIAL_C6_R1_ARCHITECTURE,
  COMMERCIAL_C6_R1_POLICY,
  COMMERCIAL_C6_R1_R2_APPROVALS,
  COMMERCIAL_C6_R1_REVISION,
  COMMERCIAL_C6_R1_STATUS,
  COMMERCIAL_C6_R1_SUMMARY,
} from '../../lib/commercialC6BuyerIntentArchitecture';

describe('Commercial C6-R1 buyer intent architecture', () => {
  it('marks the architecture as validated', () => {
    expect(COMMERCIAL_C6_R1_REVISION).toBe('2026-09-11-c6-r1');
    expect(COMMERCIAL_C6_R1_STATUS).toBe('buyer-intent-architecture-validated');
    expect(COMMERCIAL_C6_R1_POLICY.architectureValidated).toBe(true);
  });

  it('authorises no new commercial URLs', () => {
    expect(COMMERCIAL_C6_R1_SUMMARY.newOwnersAuthorized).toBe(0);
    expect(COMMERCIAL_C6_R1_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.every((entry) => entry.newUrlAuthorized === false)).toBe(true);
  });

  it('keeps phonics comparison and fee research on their dedicated owners', () => {
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'phonics-comparison')).toMatchObject({
      canonicalOwnerPath: '/best-online-phonics-classes-for-kids-in-india',
      action: 'KEEP_DEDICATED_OWNER',
      implementationState: 'EXISTING_SUFFICIENT',
    });
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'phonics-price-research')).toMatchObject({
      canonicalOwnerPath: '/phonics-fees-india',
      action: 'KEEP_DEDICATED_OWNER',
      implementationState: 'EXISTING_SUFFICIENT',
    });
  });

  it('keeps public-speaking comparison inside /speaking', () => {
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'public-speaking-comparison')).toMatchObject({
      canonicalOwnerPath: '/speaking',
      action: 'EMBED_IN_EXISTING_OWNER',
      implementationState: 'EXISTING_SUFFICIENT',
    });
  });

  it('holds grammar comparison on existing ownership without new best pages', () => {
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'grammar-comparison')).toMatchObject({
      canonicalOwnerPath: '/grammar',
      action: 'HOLD_EXISTING_OWNER',
      implementationState: 'NO_CHANGE',
      evidenceTier: 'LIMITED',
    });
  });

  it('routes non-phonics subject fees and format/value comparison to /pricing', () => {
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'non-phonics-subject-fees')).toMatchObject({
      canonicalOwnerPath: '/pricing',
      action: 'CONSOLIDATE_TO_PRICING',
      implementationState: 'R2_APPROVED',
    });
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'format-value-comparison')).toMatchObject({
      canonicalOwnerPath: '/pricing',
      action: 'CONSOLIDATE_TO_PRICING',
      implementationState: 'R2_APPROVED',
    });
  });

  it('approves only /pricing for C6-R2 body-copy implementation', () => {
    expect(COMMERCIAL_C6_R1_R2_APPROVALS).toHaveLength(1);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS[0].ownerPath).toBe('/pricing');
    expect(COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths).toEqual(['/pricing']);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS[0].metadataChangeAllowed).toBe(false);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS[0].canonicalChangeAllowed).toBe(false);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS[0].newUrlAllowed).toBe(false);
  });

  it('preserves C2, C4 and C5 boundaries', () => {
    expect(COMMERCIAL_C6_R1_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R1_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R1_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);

    const pricingOwner = COMMERCIAL_C2_OWNERSHIP_CLUSTERS.find((entry) => entry.id === 'general-pricing');
    expect(pricingOwner?.canonicalOwnerPath).toBe('/pricing');

    const conversionOwners = COMMERCIAL_C5_OWNER_FLOWS.filter((entry) => entry.stage === 'conversion');
    expect(conversionOwners).toHaveLength(1);
    expect(conversionOwners[0].ownerPath).toBe('/book-demo');
  });

  it('defers post-demo enrolment support to a later brick', () => {
    expect(COMMERCIAL_C6_R1_ARCHITECTURE.find((entry) => entry.id === 'post-demo-enrolment')).toMatchObject({
      canonicalOwnerPath: '/book-demo',
      implementationState: 'LATER_BRICK',
    });
  });
});
