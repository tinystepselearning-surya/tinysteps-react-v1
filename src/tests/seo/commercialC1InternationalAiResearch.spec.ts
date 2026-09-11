import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C1_AI_STYLE_QUERIES,
  COMMERCIAL_C1_DECLARED_OPERATING_PRIORS,
  COMMERCIAL_C1_ENHANCEMENT_GUARDRAILS,
  COMMERCIAL_C1_ENHANCEMENT_STATUS,
  COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY,
  COMMERCIAL_C1_INTERNATIONAL_MARKETS,
  COMMERCIAL_C1_INTERNATIONAL_QUERIES,
} from '../../lib/commercialC1InternationalAiResearch';

const requiredMarkets = ['uae','usa','uk','australia','singapore','nri'];

describe('Commercial C1 international and AI-style research', () => {
  it('covers every required international market systematically', () => {
    expect(COMMERCIAL_C1_ENHANCEMENT_STATUS).toBe('research-complete');
    expect(COMMERCIAL_C1_INTERNATIONAL_MARKETS.map((market) => market.id)).toEqual(requiredMarkets);
    expect(COMMERCIAL_C1_INTERNATIONAL_QUERIES).toHaveLength(54);
    for (const market of requiredMarkets) {
      const rows = COMMERCIAL_C1_INTERNATIONAL_QUERIES.filter((row) => row.market === market);
      expect(rows, market).toHaveLength(9);
      expect(rows.some((row) => row.subject === 'phonics')).toBe(true);
      expect(rows.some((row) => row.subject === 'reading')).toBe(true);
      expect(rows.some((row) => row.subject === 'grammar')).toBe(true);
      expect(rows.some((row) => row.subject === 'public_speaking')).toBe(true);
      expect(rows.some((row) => row.subject === 'communication')).toBe(true);
      expect(rows.some((row) => row.subject === 'broad_english')).toBe(true);
      expect(rows.some((row) => row.subject === 'tutor')).toBe(true);
      expect(rows.some((row) => row.intent === 'price')).toBe(true);
      expect(rows.some((row) => row.intent === 'trial-demo')).toBe(true);
    }
  });

  it('adds a proper AI-style parent-query layer across markets and lower-funnel stages', () => {
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.length).toBeGreaterThanOrEqual(20);
    for (const market of requiredMarkets) {
      expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.market === market), market).toBe(true);
    }
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.parentStage === 'problem')).toBe(true);
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.parentStage === 'comparison')).toBe(true);
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.parentStage === 'price')).toBe(true);
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.parentStage === 'trial_demo')).toBe(true);
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.some((row) => row.parentStage === 'enrolment')).toBe(true);
    expect(COMMERCIAL_C1_AI_STYLE_QUERIES.every((row) => row.evidenceClass === 'ai-style-research-query')).toBe(true);
  });

  it('closes the missing enrolment-stage research gap', () => {
    expect(COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY.length).toBeGreaterThanOrEqual(4);
    expect(COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY.every((row) => row.intent === 'enrolment')).toBe(true);
    expect(COMMERCIAL_C1_ENROLMENT_QUERY_FAMILY.every((row) => row.parentStage === 'enrolment')).toBe(true);
  });

  it('records operating conversion knowledge as unmeasured priors, not telemetry', () => {
    expect(COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.trackingStatus).toBe('not-systematically-measured');
    expect(COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.demoToEnrolment).toMatchObject({
      numerator: 1,
      denominator: 3,
      approximateRatePct: 33.3,
      kind: 'declared-operating-heuristic',
    });
    expect(COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.leadBudgetDropOff).toMatchObject({
      numerator: 1,
      denominator: 5,
      approximateRatePct: 20,
      pricePerClassInr: 400,
      kind: 'declared-operating-heuristic',
    });
    expect(COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.doNotCombineIntoObservedFunnel).toBe(true);
  });

  it('does not authorize country pages, AI-prompt pages or ownership in C1', () => {
    expect(COMMERCIAL_C1_ENHANCEMENT_GUARDRAILS).toMatchObject({
      researchOnly: true,
      newCountryPagesAuthorized: false,
      aiPromptPagesAuthorized: false,
      canonicalOwnershipAuthorized: false,
      ownershipBeginsAt: 'C2',
    });
  });
});
