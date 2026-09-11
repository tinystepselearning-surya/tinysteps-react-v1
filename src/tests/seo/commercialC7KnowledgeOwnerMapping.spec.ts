import { describe, expect, it } from 'vitest';
import { COMMERCIAL_C2_OWNERSHIP_CLUSTERS } from '../../lib/commercialC2KeywordOwnership';
import {
  COMMERCIAL_C7_R1_OWNER_MAPPINGS,
  COMMERCIAL_C7_R1_POLICY,
  COMMERCIAL_C7_R1_REVISION,
  COMMERCIAL_C7_R1_STATUS,
  COMMERCIAL_C7_R1_SUMMARY,
  getCommercialC7R1Mapping,
} from '../../lib/commercialC7KnowledgeOwnerMapping';

describe('Commercial C7-R1 knowledge to commercial owner mapping', () => {
  it('validates the architecture without authorising live page changes', () => {
    expect(COMMERCIAL_C7_R1_REVISION).toBe('2026-09-11-c7-r1');
    expect(COMMERCIAL_C7_R1_STATUS).toBe('knowledge-owner-mapping-validated');
    expect(COMMERCIAL_C7_R1_POLICY.architectureOnly).toBe(true);
    expect(COMMERCIAL_C7_R1_POLICY.liveKnowledgeCopyChangesAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.newKnowledgeUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R1_POLICY.singleConversionOwner).toBe('/book-demo');
    expect(COMMERCIAL_C7_R1_POLICY.implementationRequiresLaterBrick).toBe(true);
  });

  it('uses the final frozen knowledge ownership view and covers at least the R0 surface universe', () => {
    expect(COMMERCIAL_C7_R1_SUMMARY.finalKnowledgeOwnerRegistryCount).toBeGreaterThan(0);
    expect(COMMERCIAL_C7_R1_SUMMARY.mappedSurfaceCount).toBeGreaterThan(51);
    expect(COMMERCIAL_C7_R1_SUMMARY.commerciallyMappedSurfaceCount).toBeGreaterThan(0);
  });

  it('maps every commercial destination to one of the frozen 14 C2 owners', () => {
    const ownerPaths = new Set(COMMERCIAL_C2_OWNERSHIP_CLUSTERS.map((entry) => entry.canonicalOwnerPath));
    expect(ownerPaths.size).toBe(14);
    expect(COMMERCIAL_C7_R1_SUMMARY.frozenCommercialOwnerCount).toBe(14);

    for (const mapping of COMMERCIAL_C7_R1_OWNER_MAPPINGS) {
      if (mapping.primaryCommercialOwner) expect(ownerPaths.has(mapping.primaryCommercialOwner)).toBe(true);
    }
  });

  it('gives each commercially relevant knowledge surface at most one primary commercial owner', () => {
    for (const mapping of COMMERCIAL_C7_R1_OWNER_MAPPINGS) {
      if (mapping.decision === 'HOLD_SOFT_DISCOVERY') {
        expect(mapping.primaryCommercialOwner).toBeNull();
      } else {
        expect(mapping.primaryCommercialOwner).toMatch(/^\//);
      }
    }
  });

  it('resolves the R0 broad-English buyer-guide gap to the frozen broad-English owner', () => {
    const mapping = getCommercialC7R1Mapping('/blog/online-english-classes-for-kids-india');
    expect(mapping).not.toBeNull();
    expect(mapping?.primaryCommercialOwner).toBe('/online-english-classes-for-kids');
    expect(mapping?.ownerFamily).toBe('broad-english');
    expect(mapping?.decision).toBe('ADD_CONTEXTUAL_HANDOFF');
    expect(mapping?.currentTargets).toEqual(expect.arrayContaining(['/courses', '/class-samples']));
  });

  it('uses specialist owners when the knowledge intent is specifically fluency, confidence, spoken English or writing', () => {
    expect(getCommercialC7R1Mapping('/blog/how-to-improve-reading-fluency-in-children')?.primaryCommercialOwner).toBe('/reading-fluency-program');
    expect(getCommercialC7R1Mapping('/slow-reader-child-help')?.primaryCommercialOwner).toBe('/reading-fluency-program');
    expect(getCommercialC7R1Mapping('/shy-child-speaking-confidence')?.primaryCommercialOwner).toBe('/confidence-building-program-kids');
    expect(getCommercialC7R1Mapping('/blog/child-understands-english-but-does-not-speak')?.primaryCommercialOwner).toBe('/spoken-english-classes-for-kids-online');

    const paragraph = getCommercialC7R1Mapping('/blog/how-to-teach-paragraph-writing-to-kids');
    if (paragraph) expect(paragraph.primaryCommercialOwner).toBe('/writing-classes-for-kids');
  });

  it('preserves the existing phonics comparison owner rather than routing comparison traffic to generic phonics', () => {
    const mapping = getCommercialC7R1Mapping('/blog/how-to-choose-phonics-classes');
    expect(mapping?.primaryCommercialOwner).toBe('/best-online-phonics-classes-for-kids-in-india');
    expect(mapping?.ownerFamily).toBe('phonics-comparison');
    expect(mapping?.decision).toBe('KEEP_EXISTING_OWNER');
  });

  it('keeps subject hubs attached to their existing programme owners', () => {
    expect(getCommercialC7R1Mapping('/resources/phonics')?.primaryCommercialOwner).toBe('/phonics');
    expect(getCommercialC7R1Mapping('/resources/grammar')?.primaryCommercialOwner).toBe('/grammar');
    expect(getCommercialC7R1Mapping('/resources/speaking')?.primaryCommercialOwner).toBe('/speaking');
  });

  it('does not force pure practice or parent-routine surfaces into a commercial CTA when no commercial handoff exists', () => {
    const held = COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'HOLD_SOFT_DISCOVERY');
    expect(held.length).toBeGreaterThan(0);
    expect(held.every((mapping) => mapping.primaryCommercialOwner === null)).toBe(true);
  });

  it('preserves assessment-first journeys only where assessment already resolves an ambiguous need', () => {
    const assessmentFirst = COMMERCIAL_C7_R1_OWNER_MAPPINGS.filter((mapping) => mapping.decision === 'PRESERVE_ASSESSMENT_FIRST');
    expect(assessmentFirst.length).toBeGreaterThan(0);
    expect(assessmentFirst.every((mapping) => mapping.primaryCommercialOwner === '/book-demo')).toBe(true);
  });

  it('accounts for every mapped surface in one decision bucket', () => {
    const accounted =
      COMMERCIAL_C7_R1_SUMMARY.keepExistingCount +
      COMMERCIAL_C7_R1_SUMMARY.addContextualHandoffCount +
      COMMERCIAL_C7_R1_SUMMARY.assessmentFirstCount +
      COMMERCIAL_C7_R1_SUMMARY.softDiscoveryHoldCount;
    expect(accounted).toBe(COMMERCIAL_C7_R1_SUMMARY.mappedSurfaceCount);
  });
});
