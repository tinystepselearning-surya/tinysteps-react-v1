import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C7_FREEZE_POLICY,
  COMMERCIAL_C7_STATUS,
  getCommercialC7Snapshot,
} from '../../lib/commercialC7ValidationFreeze';

describe('Commercial C7-R5 validation and freeze', () => {
  it('freezes the complete R0-R4 knowledge conversion system', () => {
    const snapshot = getCommercialC7Snapshot();
    expect(COMMERCIAL_C7_STATUS).toBe('frozen');
    expect(snapshot.r0.status).toBe('knowledge-conversion-audit-complete');
    expect(snapshot.r1.status).toBe('knowledge-owner-mapping-validated');
    expect(snapshot.r2.status).toBe('intent-next-step-rules-validated');
    expect(snapshot.r3.status).toBe('contextual-commercial-handoffs-implemented');
    expect(snapshot.r4.status).toBe('knowledge-conversion-measurement-implemented');
  });

  it('protects all upstream commercial ownership and conversion boundaries', () => {
    expect(COMMERCIAL_C7_FREEZE_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C7_FREEZE_POLICY.newKnowledgeUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.c5ConversionOwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.directBlogBodyMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_FREEZE_POLICY.maxCommercialPromptsPerKnowledgeSurface).toBe(2);
  });

  it('keeps qualified organic leads as the authoritative business outcome', () => {
    expect(COMMERCIAL_C7_FREEZE_POLICY.measurementPrimaryKpi).toBe('qualified_organic_leads_per_day');
    expect(COMMERCIAL_C7_FREEZE_POLICY.measurementRule).toContain('diagnostic');
    expect(COMMERCIAL_C7_FREEZE_POLICY.measurementRule).toContain('C0 canonical lead lifecycle');
  });

  it('requires measured evidence or a verified defect before reopening C7', () => {
    expect(COMMERCIAL_C7_FREEZE_POLICY.frozen).toBe(true);
    expect(COMMERCIAL_C7_FREEZE_POLICY.reopenOnlyWithMeasuredEvidenceOrVerifiedDefect).toBe(true);
  });
});
