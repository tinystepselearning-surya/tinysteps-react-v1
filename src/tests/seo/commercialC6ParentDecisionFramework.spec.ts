import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  COMMERCIAL_C6_R3_DECISION_GATES,
  COMMERCIAL_C6_R3_POLICY,
  COMMERCIAL_C6_R3_STATUS,
  COMMERCIAL_C6_R3_SUMMARY,
} from '../../lib/commercialC6ParentDecisionFramework';
import { COMMERCIAL_C5_POLICY } from '../../lib/commercialC5ConversionFlow';
import { COMMERCIAL_C1_DECLARED_OPERATING_PRIORS } from '../../lib/commercialC1InternationalAiResearch';

const ROOT = process.cwd();
const bookDemoSource = fs.readFileSync(path.join(ROOT, 'src/pages/public/BookDemoPage.tsx'), 'utf8');

describe('Commercial C6-R3 parent decision framework', () => {
  it('implements five evidence-backed decision gates on the existing /book-demo owner', () => {
    expect(COMMERCIAL_C6_R3_STATUS).toBe('parent-decision-framework-implemented');
    expect(COMMERCIAL_C6_R3_DECISION_GATES).toHaveLength(5);
    expect(COMMERCIAL_C6_R3_DECISION_GATES.every((gate) => gate.ownerPath === '/book-demo')).toBe(true);
    expect(COMMERCIAL_C6_R3_SUMMARY.ownerPath).toBe('/book-demo');
  });

  it('accounts for the core post-demo enrolment factors from C1 evidence', () => {
    const factors = new Set(COMMERCIAL_C6_R3_DECISION_GATES.flatMap((gate) => gate.decisionFactors));
    for (const factor of [
      'teacher fit',
      'price',
      'schedule',
      'programme fit',
      'progress expectations',
      'assessment result',
      'programme choice',
      'trial experience',
      'outcomes',
      'class structure',
    ]) {
      expect(factors.has(factor)).toBe(true);
    }
  });

  it('maps every decision gate to copy already present on /book-demo', () => {
    for (const gate of COMMERCIAL_C6_R3_DECISION_GATES) {
      expect(gate.existingSurfaceMarkers.length).toBeGreaterThan(0);
      for (const marker of gate.existingSurfaceMarkers) {
        expect(bookDemoSource, `${gate.id} missing marker: ${marker}`).toContain(marker);
      }
    }
  });

  it('keeps the current programme, samples and pricing handoffs visible', () => {
    expect(bookDemoSource).toContain('to="/curriculum"');
    expect(bookDemoSource).toContain('to="/class-samples"');
    expect(bookDemoSource).toContain('to="/pricing"');
    expect(bookDemoSource).toContain('Before You Enrol');
  });

  it('preserves C2/C4/C5 guardrails and creates no second conversion owner', () => {
    expect(COMMERCIAL_C6_R3_POLICY.newCommercialUrlsAllowed).toBe(false);
    expect(COMMERCIAL_C6_R3_POLICY.c2OwnershipMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R3_POLICY.c4MetadataMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R3_POLICY.c5ConversionOwnerMutationAllowed).toBe(false);
    expect(COMMERCIAL_C6_R3_POLICY.paymentFlowCreated).toBe(false);
    expect(COMMERCIAL_C5_POLICY.singleConversionOwner).toBe('/book-demo');
  });

  it('does not present declared operating priors as measured conversion performance', () => {
    expect(COMMERCIAL_C1_DECLARED_OPERATING_PRIORS.trackingStatus).toBe('not-systematically-measured');
    expect(COMMERCIAL_C6_R3_POLICY.operatingPriorsMayBePresentedAsMeasuredData).toBe(false);
    expect(bookDemoSource).not.toContain('33.3%');
    expect(bookDemoSource).not.toContain('one enrolment is expected for every three');
  });

  it('does not require body-copy churn because the existing owner already covers the framework', () => {
    expect(COMMERCIAL_C6_R3_POLICY.frameworkImplementedOnExistingOwner).toBe(true);
    expect(COMMERCIAL_C6_R3_POLICY.bodyCopyChangeRequired).toBe(false);
    expect(COMMERCIAL_C6_R3_POLICY.reasonBodyCopyChangeNotRequired).toContain('current /book-demo page already exposes');
  });
});
