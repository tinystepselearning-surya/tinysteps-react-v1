import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C1_BING_AI_EXPORT,
  COMMERCIAL_C1_BING_AI_PAGE_EVIDENCE,
  COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE,
  COMMERCIAL_C1_BING_COMMERCIAL_PAGE_EVIDENCE,
  COMMERCIAL_C1_BING_CORE_QUERY_EVIDENCE,
  COMMERCIAL_C1_BING_WEB_EXPORT,
  COMMERCIAL_C1_FINAL_SOURCE_STATUS,
  COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE,
  COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE,
  COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE,
  COMMERCIAL_C1_GSC_EXPORT,
  COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES,
  COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS,
  getCommercialC1ObservedEvidenceSnapshot,
} from '../../lib/commercialC1ObservedSearchEvidence';

describe('Commercial C1 observed Google and Bing evidence', () => {
  it('locks the full GSC 3-month export totals and dates', () => {
    expect(COMMERCIAL_C1_GSC_EXPORT).toMatchObject({
      observedFrom: '2026-06-09',
      observedThrough: '2026-09-08',
      observedDays: 92,
      queryRows: 1000,
      pageRows: 181,
      clicks: 6612,
      impressions: 107515,
      ctr: 0.0615,
    });
  });

  it('captures the strongest observed commercial phonics opportunity', () => {
    const family = COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE.find((row) => row.family === 'phonics');
    expect(family).toMatchObject({ queryRows: 103, impressions: 7604, clicks: 124 });

    const priceBuyer = COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE.find((row) => row.query === 'best online phonics classes in india with fees');
    expect(priceBuyer).toMatchObject({ clicks: 11, impressions: 117, ctr: 0.094, position: 2.72 });

    const broadTerm = COMMERCIAL_C1_GSC_CORE_QUERY_EVIDENCE.find((row) => row.query === 'phonics classes');
    expect(broadTerm).toMatchObject({ clicks: 6, impressions: 1056, ctr: 0.0057, position: 4.88 });
  });

  it('records Google evidence across every commercial subject area without claiming equal maturity', () => {
    for (const family of ['phonics','broad_english','reading','grammar','writing_classes','spoken_english','public_speaking','communication']) {
      expect(COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE.some((row) => row.family === family), family).toBe(true);
    }
    expect(COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE.find((row) => row.family === 'phonics')?.impressions).toBeGreaterThan(7000);
    expect(COMMERCIAL_C1_GSC_COMMERCIAL_FAMILY_EVIDENCE.find((row) => row.family === 'grammar')?.impressions).toBeLessThan(50);
  });

  it('locks commercial page evidence rather than using the site-wide average position', () => {
    expect(COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE.find((row) => row.path === '/phonics')).toMatchObject({
      clicks: 371, impressions: 11306, ctr: 0.0328, position: 4.86,
    });
    expect(COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE.find((row) => row.path === '/speaking')).toMatchObject({
      clicks: 62, impressions: 2602, position: 9.1,
    });
    expect(COMMERCIAL_C1_GSC_COMMERCIAL_PAGE_EVIDENCE.find((row) => row.path === '/writing-classes-for-kids')).toMatchObject({
      clicks: 0, impressions: 4,
    });
  });

  it('captures priority international country traffic from GSC', () => {
    for (const country of ['India','United States','United Kingdom','Australia','United Arab Emirates','Singapore']) {
      expect(COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES.some((row) => row.country === country), country).toBe(true);
    }
    expect(COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES.find((row) => row.country === 'United States')).toMatchObject({ clicks:1587, impressions:26641 });
    expect(COMMERCIAL_C1_GSC_PRIORITY_COUNTRIES.find((row) => row.country === 'United Arab Emirates')).toMatchObject({ clicks:104, impressions:1700 });
  });

  it('keeps Bing dimensions separate because the export does not encode its date range', () => {
    expect(COMMERCIAL_C1_BING_WEB_EXPORT).toMatchObject({
      reportPeriod: null,
      keywordRows: 830,
      keywordDimensionClicks: 426,
      keywordDimensionImpressions: 3167,
      pageRows: 59,
      pageDimensionClicks: 514,
      pageDimensionImpressions: 9509,
    });
    expect(COMMERCIAL_C1_BING_CORE_QUERY_EVIDENCE.find((row) => row.query === 'online phonics classes')).toMatchObject({
      clicks:1, impressions:8, ctr:0.125, position:2.625,
    });
    expect(COMMERCIAL_C1_BING_COMMERCIAL_PAGE_EVIDENCE.find((row) => row.path === '/phonics')).toMatchObject({
      clicks:11, impressions:236, ctr:0.0466,
    });
  });

  it('proves that Bing AI commercial visibility is observed, not hypothetical', () => {
    expect(COMMERCIAL_C1_BING_AI_EXPORT).toMatchObject({ groundingQueryRows:31, aiPageRows:71, groundingQueryCitations:1405, aiPageCitations:2962 });
    expect(COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE.find((row) => row.query === 'phonics classes for kids')).toMatchObject({ citations:25, citationShare:0.1623 });
    expect(COMMERCIAL_C1_BING_AI_QUERY_EVIDENCE.find((row) => row.query === 'online phonics classes')).toMatchObject({ citations:24, citationShare:0.2034 });
    expect(COMMERCIAL_C1_BING_AI_PAGE_EVIDENCE.find((row) => row.path === '/phonics')).toMatchObject({ citations:120 });
    expect(COMMERCIAL_C1_BING_AI_PAGE_EVIDENCE.some((row) => row.path === '/book-demo')).toBe(false);
  });

  it('marks C1 search-source evidence complete but keeps implementation deferred to C2', () => {
    expect(COMMERCIAL_C1_OBSERVED_EVIDENCE_STATUS).toBe('evidence-complete');
    expect(COMMERCIAL_C1_FINAL_SOURCE_STATUS).toMatchObject({
      googleQueryLevelEvidence: 'available-from-user-export',
      bingKeywordEvidence: 'available-from-user-export',
      bingAiGroundingEvidence: 'available-from-user-export',
      conversionEvidence: 'declared-operating-priors-only',
      ownershipDecision: 'deferred-to-C2',
      publicImplementationAllowed: false,
    });
    expect(Object.isFrozen(getCommercialC1ObservedEvidenceSnapshot())).toBe(true);
  });
});
