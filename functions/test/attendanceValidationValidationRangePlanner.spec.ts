import { describe, expect, it } from 'vitest';
import {
  AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN,
  remainingUnifiedValidationCapacity,
  uniqueFreshValidationTargets,
} from '../src/attendanceValidation/validationRangePlanner';

describe('AVS unified validation planner', () => {
  it('keeps one invocation at 100 sessions total', () => {
    expect(AVS_UNIFIED_VALIDATION_MAX_SESSIONS_PER_RUN).toBe(100);
    expect(remainingUnifiedValidationCapacity(0)).toBe(100);
    expect(remainingUnifiedValidationCapacity(34)).toBe(66);
    expect(remainingUnifiedValidationCapacity(100)).toBe(0);
    expect(remainingUnifiedValidationCapacity(140)).toBe(0);
  });

  it('deduplicates fresh targets while preserving stale-before-missing priority', () => {
    expect(uniqueFreshValidationTargets({
      staleCaseSessionIds: ['a', 'b'],
      missingCaseSessionIds: ['b', 'c', ''],
    })).toEqual([
      { sessionId: 'a', kind: 'stale' },
      { sessionId: 'b', kind: 'stale' },
      { sessionId: 'c', kind: 'missing' },
    ]);
  });
});
