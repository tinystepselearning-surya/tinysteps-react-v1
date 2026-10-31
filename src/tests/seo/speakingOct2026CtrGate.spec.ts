import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES,
  COMMERCIAL_C4_POLICY,
  evaluateCommercialC4FreshObservation,
} from '../../lib/commercialC4CtrOptimization';

// Historical, read-only Search Console snapshot. October 16–29, 2026.
// Query impressions come from deduplicated daily page/query rows for the
// three fixed C4 Speaking owner query strings (48 + 2 + 0 observed).
const speakingOctober2026Observation = Object.freeze({
  ownerPath: '/speaking',
  observedThrough: '2026-10-29',
  observationDays: 14,
  pageClicks: 21,
  pageImpressions: 755,
  pageCtr: 0.0278,
  pagePosition: 6.7391,
  queryImpressions: 50,
  qualifiedOrganicLeads: null,
});

describe('Speaking October 2026 C4 CTR evidence gate (read-only)', () => {
  it('reaches the review gate but does not authorize automatic deployment', () => {
    const result = evaluateCommercialC4FreshObservation(speakingOctober2026Observation);
    expect(result.experimentState).toBe('READY');
    expect(result.deployEligible).toBe(true); // Policy calls this HUMAN-REVIEW eligibility only.
    expect(result.meetsObservationDays).toBe(true);
    expect(result.meetsPageImpressions).toBe(true);
    expect(result.meetsQueryImpressions).toBe(true);
    expect(speakingOctober2026Observation.qualifiedOrganicLeads).toBeNull();
    expect(COMMERCIAL_C4_POLICY.deployCandidateBeforeFreshEvidence).toBe(false);
    expect(COMMERCIAL_C4_POLICY.controlTitleAndDescriptionFrozen).toBe(true);
  });

  it('fails if just one core query impression is removed from the boundary sample', () => {
    const result = evaluateCommercialC4FreshObservation({
      ...speakingOctober2026Observation,
      queryImpressions: 49,
    });
    expect(result.experimentState).toBe('CONTROL');
    expect(result.deployEligible).toBe(false);
    expect(result.meetsQueryImpressions).toBe(false);
  });

  it('preserves the existing approved Speaking title and description control', () => {
    expect(COMMERCIAL_C4_AUTHORIZED_OWNER_OVERRIDES['/speaking']).toEqual({
      title: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps',
      description: 'Live 1:1 online public speaking & communication classes for kids ages 4–12. Structured answers, storytelling and presentations. ₹400/class; free assessment.',
    });
  });
});
