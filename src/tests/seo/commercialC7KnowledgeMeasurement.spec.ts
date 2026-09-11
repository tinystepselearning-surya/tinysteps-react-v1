import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C0_MEASUREMENT } from '../../lib/commercialC0Foundation';
import {
  COMMERCIAL_C7_R4_MEASUREMENT,
  COMMERCIAL_C7_R4_POLICY,
  COMMERCIAL_C7_R4_STATUS,
  isCommercialC7MeasuredKnowledgePath,
} from '../../lib/commercialC7KnowledgeMeasurement';

describe('Commercial C7-R4 knowledge conversion measurement', () => {
  it('keeps C0 qualified organic leads as the only business KPI', () => {
    expect(COMMERCIAL_C7_R4_STATUS).toBe('knowledge-conversion-measurement-implemented');
    expect(COMMERCIAL_C7_R4_MEASUREMENT.primaryKpi).toBe(COMMERCIAL_C0_MEASUREMENT.primaryKpi);
    expect(COMMERCIAL_C7_R4_MEASUREMENT.primaryKpi).toBe('qualified_organic_leads_per_day');
    expect(COMMERCIAL_C7_R4_POLICY.diagnosticOnly).toBe(true);
    expect(COMMERCIAL_C7_R4_POLICY.clickEqualsQualifiedLead).toBe(false);
    expect(COMMERCIAL_C7_R4_MEASUREMENT.rule).toContain('diagnostic only');
    expect(COMMERCIAL_C7_R4_MEASUREMENT.rule).toContain('C0 canonical lead lifecycle');
  });

  it('measures the intended knowledge-to-lead sequence without creating a second conversion owner', () => {
    expect(COMMERCIAL_C7_R4_MEASUREMENT.measuredSequence).toEqual([
      'knowledge_surface',
      'commercial_owner',
      'book_demo',
      'qualified_lead',
    ]);
    expect(COMMERCIAL_C7_R4_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C7_R4_MEASUREMENT.diagnosticEvents.knowledgeView).toBe('knowledge_commercial_view');
    expect(COMMERCIAL_C7_R4_MEASUREMENT.diagnosticEvents.knowledgeHandoffClick).toBe('knowledge_commercial_handoff_click');
  });

  it('recognizes frozen C7 knowledge surfaces rather than arbitrary marketing pages', () => {
    expect(isCommercialC7MeasuredKnowledgePath('/blog/online-english-classes-for-kids-india')).toBe(true);
    expect(isCommercialC7MeasuredKnowledgePath('/resources/phonics/ai-vowel-team-phonics')).toBe(true);
    expect(isCommercialC7MeasuredKnowledgePath('/resources/phonics/ai-ay-long-a')).toBe(false);
    expect(isCommercialC7MeasuredKnowledgePath('/pricing')).toBe(false);
    expect(isCommercialC7MeasuredKnowledgePath('/book-demo')).toBe(false);
  });

  it('preserves frozen upstream boundaries', () => {
    expect(COMMERCIAL_C7_R4_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R4_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R4_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R4_POLICY.c5ConversionOwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R4_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R4_POLICY.knowledgeBodyMutationAllowed).toBe(false);
  });
});
