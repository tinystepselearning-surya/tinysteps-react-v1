import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const transition = readFileSync(
  resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleCourseTransition.ts'),
  'utf8',
);

describe('R5C2C31 course transition canonical Admin authorization', () => {
  it('requires canonical Admin with no legacy fallback', () => {
    expect(transition).toContain("from '../helpers/canonicalAdminGuard'");
    expect(transition).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(transition).not.toContain("from '../helpers/adminGuard'");
    expect(transition).not.toContain('await ensureAdmin(request.auth);');
  });

  it('preserves the bounded rolling course-transition contract', () => {
    expect(transition).toContain('materializeRollingEnrollmentWindowInternal');
    expect(transition).toContain('buildCanonicalRollingScheduleDefinition');
    expect(transition).toContain('transitionType must be progression or correction');
    expect(transition).not.toMatch(/from ["'][^"']*createSessionsFromSchedule["']/);
    expect(transition).not.toContain('legacyTransitionEnrollmentCourse');
  });
});
