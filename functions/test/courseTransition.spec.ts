import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const lifecycleSource = readFileSync(join(process.cwd(), 'functions/src/lifecycle.ts'), 'utf8');

describe('course transition state machine contract', () => {
  it('records every recoverable transition stage in order', () => {
    const states = [
      'validated',
      'old_enrollment_completed',
      'old_sessions_reconciled',
      'new_enrollment_created',
      'new_sessions_generated',
      'complete',
    ];
    let previousIndex = -1;
    states.forEach((state) => {
      const index = lifecycleSource.indexOf(`state: '${state}'`, previousIndex + 1);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    });
  });

  it('persists failure metadata and a resumable state', () => {
    expect(lifecycleSource).toContain("state: 'failed'");
    expect(lifecycleSource).toContain('resumeState:');
    expect(lifecycleSource).toContain('failedStep:');
    expect(lifecycleSource).toContain('failureCode:');
    expect(lifecycleSource).toContain('failureMessage:');
    expect(lifecycleSource).toContain('retryable: true');
  });

  it('reconciles only the selected old enrollment before generating the new schedule', () => {
    expect(lifecycleSource).toContain("cancelFutureSessionsByEnrollmentId(\n        oldEnrollmentId");
    expect(lifecycleSource).toContain('repairEnrollmentFutureSessionsFromScheduleInternal({');
    expect(lifecycleSource).toContain('nextEnrollmentId: newEnrollmentId');
    expect(lifecycleSource).toContain('previousEnrollmentId: oldEnrollmentId');
  });
});
