import { describe, expect, it } from 'vitest';
import { NEW_GROUP_CLASS_PLAN, PER_CLASS_PRICE } from '../../config/pricing';
import { SEMANTIC_FACTS } from '../../config/semanticFacts';
import { STANDARD_PRICING_SUMMARY } from '../../config/publicOffer';
import { organizationSchema } from '../../lib/schemas';
import { APPROVED_PUBLIC_TEACHER_PROFILES } from '../../pages/team/publicTeacherProfiles';

describe('Public company identity, currently advertised fees, and consent-controlled teacher profiles', () => {
  it('uses one public company name and a single previously published operating year', () => {
    expect(SEMANTIC_FACTS.brand.organizationName).toBe(SEMANTIC_FACTS.brand.name);
    expect(organizationSchema.name).toBe('Tiny Steps Learning');
    expect(organizationSchema.foundingDate).toBe(SEMANTIC_FACTS.brand.operatingSinceYear);
  });

  it('does not confuse historical group rates with the newly advertised offer', () => {
    expect(PER_CLASS_PRICE).toBe(400);
    expect(NEW_GROUP_CLASS_PLAN.monthlyFee).toBe(3000);
    expect(NEW_GROUP_CLASS_PLAN.classes).toBe(12);
    expect(NEW_GROUP_CLASS_PLAN.durationMinutes).toBe(50);
    expect(NEW_GROUP_CLASS_PLAN.monthlyFee / NEW_GROUP_CLASS_PLAN.classes).toBe(250);
    expect(STANDARD_PRICING_SUMMARY).toContain('₹250');
    expect(STANDARD_PRICING_SUMMARY).toContain('50-minute');
    expect(STANDARD_PRICING_SUMMARY).toContain('₹3,000');
  });

  it('never lists staff who have not been verified and approved for public display', () => {
    for (const profile of APPROVED_PUBLIC_TEACHER_PROFILES) {
      expect(profile.publicationApproved).toBe(true);
      expect(profile.publicName.trim().length).toBeGreaterThan(0);
      expect(profile.qualifications.length).toBeGreaterThan(0);
      expect(profile.specialisms.length).toBeGreaterThan(0);
    }
  });
});
