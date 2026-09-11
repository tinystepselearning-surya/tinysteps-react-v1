import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C6_R1_POLICY,
  COMMERCIAL_C6_R1_R2_APPROVALS,
} from '../../lib/commercialC6BuyerIntentArchitecture';

const repoRoot = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const pricingSource = read('src/pages/PricingPage.tsx');

describe('Commercial C6-R2 pricing decision support', () => {
  it('is implemented only on the R1-approved pricing owner', () => {
    expect(COMMERCIAL_C6_R1_POLICY.r2ApprovedOwnerPaths).toEqual(['/pricing']);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS).toHaveLength(1);
    expect(COMMERCIAL_C6_R1_R2_APPROVALS[0].ownerPath).toBe('/pricing');
  });

  it('adds subject-aware fee navigation for the five non-phonics programme families', () => {
    expect(pricingSource).toContain('const subjectPricingRoutes = [');
    expect(pricingSource).toContain("label: 'Reading'");
    expect(pricingSource).toContain("href: '/reading-classes-for-kids'");
    expect(pricingSource).toContain("label: 'Grammar'");
    expect(pricingSource).toContain("href: '/grammar'");
    expect(pricingSource).toContain("label: 'Writing'");
    expect(pricingSource).toContain("href: '/writing-classes-for-kids'");
    expect(pricingSource).toContain("label: 'Spoken English'");
    expect(pricingSource).toContain("href: '/spoken-english-classes-for-kids-online'");
    expect(pricingSource).toContain("label: 'Public Speaking'");
    expect(pricingSource).toContain("href: '/speaking'");
  });

  it('keeps pricing as the fee owner and programme pages as fit destinations', () => {
    expect(pricingSource).toContain('Fees by learning need');
    expect(pricingSource).toContain('this page remains the Tiny Steps fee and value owner');
    expect(pricingSource).toContain('Use this pricing page, then check programme fit');
    expect(pricingSource).toContain('Check {route.label} programme fit');
  });

  it('preserves the phonics fee-research exception', () => {
    expect(pricingSource).toContain('Phonics is the exception:');
    expect(pricingSource).toContain('to="/phonics-fees-india"');
    expect(pricingSource).toContain('Phonics Class Fees in India');
  });

  it('preserves C4-controlled pricing metadata and canonical wiring', () => {
    expect(pricingSource).toContain("pricingSeo?.title ?? 'Online English Classes for Kids Fees & Pricing | Tiny Steps'");
    expect(pricingSource).toContain('See Tiny Steps online English class fees: standard live 1:1');
    expect(pricingSource).toContain("const pricingCanonicalPath = pricingSeo?.canonicalPath ?? '/pricing';");
    expect(COMMERCIAL_C6_R1_POLICY.c4MetadataMutationAllowed).toBe(false);
  });

  it('does not create a new conversion owner', () => {
    expect(pricingSource).toContain('to="/book-demo"');
    expect(COMMERCIAL_C6_R1_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
  });
});
