import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES,
  COMMERCIAL_C7_R0_POLICY,
  COMMERCIAL_C7_R0_PRIORITY_FINDINGS,
  COMMERCIAL_C7_R0_REVISION,
  COMMERCIAL_C7_R0_STATUS,
  COMMERCIAL_C7_R0_SUMMARY,
  getCommercialC7R0BlogSurface,
  getCommercialC7R0Surface,
} from '../../lib/commercialC7KnowledgeConversionAudit';

describe('Commercial C7-R0 knowledge conversion audit', () => {
  it('starts from the frozen knowledge and commercial baselines without authorising changes', () => {
    expect(COMMERCIAL_C7_R0_REVISION).toBe('2026-09-11-c7-r0');
    expect(COMMERCIAL_C7_R0_STATUS).toBe('knowledge-conversion-audit-complete');
    expect(COMMERCIAL_C7_R0_POLICY.auditOnly).toBe(true);
    expect(COMMERCIAL_C7_R0_POLICY.knowledgeBaseRemainsFrozen).toBe(true);
    expect(COMMERCIAL_C7_R0_POLICY.liveKnowledgeCopyChangesAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.newKnowledgeUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R0_POLICY.singleConversionOwner).toBe('/book-demo');
  });

  it('covers the frozen blog, phonics publication, subject-hub and commercial-owner baselines', () => {
    expect(COMMERCIAL_C7_R0_SUMMARY.blogAuthorityPlanCount).toBe(51);
    expect(COMMERCIAL_C7_R0_SUMMARY.publishedPhonicsKnowledgePageCount).toBe(31);
    expect(COMMERCIAL_C7_R0_SUMMARY.subjectHubCount).toBe(3);
    expect(COMMERCIAL_C7_R0_SUMMARY.frozenCommercialOwnerCount).toBe(14);
    expect(COMMERCIAL_C7_R0_SUMMARY.auditedSurfaceCount).toBeGreaterThan(51);
  });

  it('deduplicates surfaces even when multiple knowledge registries describe the same path', () => {
    const paths = COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.map((surface) => surface.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES.every((surface) => surface.sourceKinds.length > 0)).toBe(true);
  });

  it('protects all three subject hubs as programme + assessment bridge surfaces', () => {
    const expectations = [
      ['/resources/phonics', '/phonics'],
      ['/resources/grammar', '/grammar'],
      ['/resources/speaking', '/speaking'],
    ] as const;

    for (const [path, programme] of expectations) {
      const surface = getCommercialC7R0Surface(path);
      expect(surface).not.toBeNull();
      expect(surface?.currentTargets).toContain(programme);
      expect(surface?.currentTargets).toContain('/book-demo');
      expect(surface?.coverage).toBe('DIRECT_CONVERSION');
    }
  });

  it('recognises existing blog-to-programme and blog-to-assessment paths', () => {
    const grammarDiagnostic = getCommercialC7R0BlogSurface('child-knows-grammar-but-makes-mistakes');
    expect(grammarDiagnostic?.currentTargets).toContain('/grammar');
    expect(grammarDiagnostic?.currentTargets).toContain('/book-demo');
    expect(grammarDiagnostic?.coverage).toBe('DIRECT_CONVERSION');

    const phonicsComparison = getCommercialC7R0BlogSurface('how-to-choose-phonics-classes');
    expect(phonicsComparison?.currentTargets).toContain('/best-online-phonics-classes-for-kids-in-india');
    expect(phonicsComparison?.coverage).toBe('COMMERCIAL_HANDOFF');
  });

  it('flags the broad-English buyer guide as an R1 mapping decision rather than silently changing it', () => {
    const buyerGuide = getCommercialC7R0BlogSurface('online-english-classes-for-kids-india');
    expect(buyerGuide?.currentTargets).toEqual(expect.arrayContaining(['/courses', '/class-samples']));
    expect(buyerGuide?.commercialTargets).toHaveLength(0);
    expect(buyerGuide?.coverage).toBe('INDIRECT_ONLY');

    const finding = COMMERCIAL_C7_R0_PRIORITY_FINDINGS.find((item) => item.id === 'buyer-guide-broad-english-handoff');
    expect(finding?.liveChangeAuthorized).toBe(false);
  });

  it('never classifies a destination as commercial unless it belongs to the frozen C2 owner set', () => {
    const ownerPaths = new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath));
    expect(new Set(ownerPaths).size).toBe(14);

    for (const surface of COMMERCIAL_C7_R0_KNOWLEDGE_SURFACES) {
      for (const target of surface.commercialTargets) expect(ownerPaths.has(target)).toBe(true);
    }
  });

  it('keeps the audit descriptive: coverage counts account for every audited surface', () => {
    const accounted =
      COMMERCIAL_C7_R0_SUMMARY.directConversionSurfaceCount +
      COMMERCIAL_C7_R0_SUMMARY.commercialHandoffSurfaceCount +
      COMMERCIAL_C7_R0_SUMMARY.indirectOnlySurfaceCount +
      COMMERCIAL_C7_R0_SUMMARY.noKnownHandoffSurfaceCount;
    expect(accounted).toBe(COMMERCIAL_C7_R0_SUMMARY.auditedSurfaceCount);
  });
});
