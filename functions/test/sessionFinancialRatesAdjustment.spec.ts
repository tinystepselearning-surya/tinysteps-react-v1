import { describe, expect, it } from 'vitest';
import {
  isRetainSchoolTeacherPayDecisionActive,
  resolveSessionTeacherPayRate,
} from '../src/helpers/sessionFinancialRates';

describe('session financial rates after Brick 4 adjustment posting', () => {
  it('stops direct withholding once the matching settled adjustment is posted', () => {
    const session = {
      teacherPayRateSnapshot: 175,
      teacherPayDisposition: 'retain_school',
      teacherPayDecisionId: 'decision-1',
      teacherPayDecisionSource: 'admin-attendance-correction',
      teacherPayDecisionStatus: 'applied',
      teacherPayAdjustmentRequired: false,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentDecisionId: 'decision-1',
    };

    expect(isRetainSchoolTeacherPayDecisionActive(session)).toBe(false);
    expect(resolveSessionTeacherPayRate(session, {})).toBe(175);
  });

  it('does not let an unrelated posted adjustment disable a newer retain decision', () => {
    const session = {
      teacherPayRateSnapshot: 175,
      teacherPayDisposition: 'retain_school',
      teacherPayDecisionId: 'decision-2',
      teacherPayDecisionSource: 'admin-attendance-correction',
      teacherPayDecisionStatus: 'applied',
      teacherPayAdjustmentRequired: false,
      teacherPayAdjustmentStatus: 'posted',
      teacherPayAdjustmentDecisionId: 'decision-1',
    };

    expect(isRetainSchoolTeacherPayDecisionActive(session)).toBe(true);
    expect(resolveSessionTeacherPayRate(session, {})).toBe(0);
  });
});
