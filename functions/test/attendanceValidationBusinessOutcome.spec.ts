import { describe, expect, it } from 'vitest';
import {
  reconcileAvsBusinessOutcome,
  supportedPresentCountFromOverlap,
} from '../src/attendanceValidation/businessOutcomeEngine';

describe('AVS simple business outcome engine', () => {
  it('uses strictly greater than 25 minutes and scales for multiple Presents', () => {
    expect(supportedPresentCountFromOverlap(0)).toBe(0);
    expect(supportedPresentCountFromOverlap(1500)).toBe(0);
    expect(supportedPresentCountFromOverlap(1501)).toBe(1);
    expect(supportedPresentCountFromOverlap(3000)).toBe(1);
    expect(supportedPresentCountFromOverlap(3001)).toBe(2);
    expect(supportedPresentCountFromOverlap(4500)).toBe(2);
    expect(supportedPresentCountFromOverlap(4501)).toBe(3);
  });

  it('returns Verified when Teams-supported and Tiny Steps Present counts match', () => {
    expect(reconcileAvsBusinessOutcome({
      evidenceEvaluable: true,
      teamsOverlapSeconds: 2100,
      sameDaySessionCount: 1,
      tinyStepsPresentCount: 1,
    })).toEqual({
      outcome: 'verified',
      teamsSupportedPresentCount: 1,
      tinyStepsPresentCount: 1,
      differenceCount: 0,
    });
  });

  it('caps a long single Teams class at one supported Present', () => {
    expect(reconcileAvsBusinessOutcome({
      evidenceEvaluable: true,
      teamsOverlapSeconds: 65 * 60,
      sameDaySessionCount: 1,
      tinyStepsPresentCount: 1,
    })).toEqual({
      outcome: 'verified',
      teamsSupportedPresentCount: 1,
      tinyStepsPresentCount: 1,
      differenceCount: 0,
    });
  });

  it('returns False Present only for excess Tiny Steps Present marks', () => {
    expect(reconcileAvsBusinessOutcome({
      evidenceEvaluable: true,
      teamsOverlapSeconds: 2100,
      sameDaySessionCount: 1,
      tinyStepsPresentCount: 2,
    })).toEqual({
      outcome: 'false_present',
      teamsSupportedPresentCount: 1,
      tinyStepsPresentCount: 2,
      differenceCount: 1,
    });
  });

  it('returns False Absent only for Teams-supported Presents missing in Tiny Steps', () => {
    expect(reconcileAvsBusinessOutcome({
      evidenceEvaluable: true,
      teamsOverlapSeconds: 4200,
      sameDaySessionCount: 2,
      tinyStepsPresentCount: 1,
    })).toEqual({
      outcome: 'false_absent',
      teamsSupportedPresentCount: 2,
      tinyStepsPresentCount: 1,
      differenceCount: 1,
    });
  });

  it('keeps incomplete source evidence technical and outside business outcomes', () => {
    expect(reconcileAvsBusinessOutcome({
      evidenceEvaluable: false,
      teamsOverlapSeconds: 0,
      sameDaySessionCount: 1,
      tinyStepsPresentCount: 1,
    })).toEqual({
      outcome: 'not_evaluable',
      teamsSupportedPresentCount: null,
      tinyStepsPresentCount: 1,
      differenceCount: 0,
    });
  });
});
