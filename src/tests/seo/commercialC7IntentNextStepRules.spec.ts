import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C7_R2_NEXT_STEP_RULES,
  COMMERCIAL_C7_R2_POLICY,
  COMMERCIAL_C7_R2_REVISION,
  COMMERCIAL_C7_R2_STATUS,
  COMMERCIAL_C7_R2_SUMMARY,
  getCommercialC7R2NextStepRule,
} from '../../lib/commercialC7IntentNextStepRules';
import { COMMERCIAL_C7_R1_OWNER_MAPPINGS } from '../../lib/commercialC7KnowledgeOwnerMapping';

describe('Commercial C7-R2 intent next-step rules', () => {
  it('remains architecture-only and protects frozen commercial controls', () => {
    expect(COMMERCIAL_C7_R2_REVISION).toBe('2026-09-11-c7-r2');
    expect(COMMERCIAL_C7_R2_STATUS).toBe('intent-next-step-rules-validated');
    expect(COMMERCIAL_C7_R2_POLICY.architectureOnly).toBe(true);
    expect(COMMERCIAL_C7_R2_POLICY.implementationDeferredToR3).toBe(true);
    expect(COMMERCIAL_C7_R2_POLICY.liveKnowledgeCopyChangesAllowed).toBe(false);
    expect(COMMERCIAL_C7_R2_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R2_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R2_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R2_POLICY.c6ArchitectureMutationAllowed).toBe(false);
    expect(COMMERCIAL_C7_R2_POLICY.singleConversionOwner).toBe('/book-demo');
  });

  it('accounts for every R1 mapping exactly once', () => {
    expect(COMMERCIAL_C7_R2_NEXT_STEP_RULES).toHaveLength(COMMERCIAL_C7_R1_OWNER_MAPPINGS.length);
    const paths = COMMERCIAL_C7_R2_NEXT_STEP_RULES.map((rule) => rule.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('keeps pure practice and parent-routine discovery unforced', () => {
    const softRules = COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'SOFT_DISCOVERY');
    expect(softRules.length).toBeGreaterThan(0);
    for (const rule of softRules) {
      expect(rule.primaryDestination).toBeNull();
      expect(rule.secondaryDestination).toBeNull();
      expect(rule.maxCommercialPrompts).toBe(0);
      expect(rule.assessmentRole).toBe('NONE');
    }
  });

  it('routes the broad-English buyer guide to the frozen broad-English owner without bypassing into assessment', () => {
    const rule = getCommercialC7R2NextStepRule('/blog/online-english-classes-for-kids-india');
    expect(rule?.ruleClass).toBe('OWNER_HANDOFF');
    expect(rule?.primaryDestination).toBe('/online-english-classes-for-kids');
    expect(rule?.secondaryDestination).toBeNull();
    expect(rule?.assessmentRole).toBe('NONE');
  });

  it('preserves phonics comparison as a research handoff', () => {
    const rule = getCommercialC7R2NextStepRule('/blog/how-to-choose-phonics-classes');
    expect(rule?.ruleClass).toBe('RESEARCH_HANDOFF');
    expect(rule?.primaryDestination).toBe('/best-online-phonics-classes-for-kids-in-india');
    expect(rule?.secondaryDestination).toBeNull();
  });

  it('uses programme-first with assessment only as a secondary step for problem-aware knowledge', () => {
    const grammar = getCommercialC7R2NextStepRule('/blog/child-knows-grammar-but-makes-mistakes');
    expect(grammar?.ruleClass).toBe('OWNER_THEN_ASSESSMENT');
    expect(grammar?.primaryDestination).toBe('/grammar');
    expect(grammar?.secondaryDestination).toBe('/book-demo');
    expect(grammar?.assessmentRole).toBe('SECONDARY');

    const fluency = getCommercialC7R2NextStepRule('/blog/how-to-improve-reading-fluency-in-children');
    expect(fluency?.primaryDestination).toBe('/reading-fluency-program');
    expect(fluency?.secondaryDestination).toBe('/book-demo');
  });

  it('keeps assessment first only where R1 explicitly could not resolve the correct programme', () => {
    const assessmentRules = COMMERCIAL_C7_R2_NEXT_STEP_RULES.filter((rule) => rule.ruleClass === 'ASSESSMENT_FIRST');
    for (const rule of assessmentRules) {
      expect(rule.primaryDestination).toBe('/book-demo');
      expect(rule.secondaryDestination).toBeNull();
      expect(rule.assessmentRole).toBe('PRIMARY');
      expect(rule.maxCommercialPrompts).toBe(1);
    }
  });

  it('never permits more than two commercial prompts and keeps /book-demo as the only secondary destination', () => {
    for (const rule of COMMERCIAL_C7_R2_NEXT_STEP_RULES) {
      expect(rule.maxCommercialPrompts).toBeLessThanOrEqual(2);
      if (rule.secondaryDestination) expect(rule.secondaryDestination).toBe('/book-demo');
    }
  });

  it('fully accounts for the rule-class summary', () => {
    const accounted =
      COMMERCIAL_C7_R2_SUMMARY.softDiscoveryCount +
      COMMERCIAL_C7_R2_SUMMARY.ownerHandoffCount +
      COMMERCIAL_C7_R2_SUMMARY.researchHandoffCount +
      COMMERCIAL_C7_R2_SUMMARY.ownerThenAssessmentCount +
      COMMERCIAL_C7_R2_SUMMARY.assessmentFirstCount;
    expect(accounted).toBe(COMMERCIAL_C7_R2_SUMMARY.ruleCount);
  });
});
