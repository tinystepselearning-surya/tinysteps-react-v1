import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const src = (file: string) => readFileSync(resolve(process.cwd(), 'functions/src', file), 'utf8');
const lifecycle = src('lifecycle.ts');
const finite = src('createSessionsFromSchedule.ts');
const index = src('index.ts');

describe('R5C2C38 lifecycle and finite-scheduler legacy Admin closure', () => {
  it('canonicalizes all 13 remaining guards in the two coupled modules', () => {
    for(const [source, count] of [[lifecycle, 7], [finite, 6]] as const){
      expect(source).toMatch(/from ['"]\.\/helpers\/canonicalAdminGuard['"]/);
      expect(source).not.toMatch(/from ['"]\.\/helpers\/adminGuard['"]/);
      expect(source).not.toMatch(/await\s+ensureAdmin\(/);
      expect((source.match(/await\s+ensureCanonicalAdmin\(/g) || []).length).toBe(count);
    }
  });
  it('keeps current lifecycle callables in place without routing public API back to finite schedule', () => {
    for(const name of [
      'createAdminManualSession',
      'cancelAdminManualSession',
      'reassignEnrollmentTeacher',
      'repairEnrollmentTeacherSessionConsistency',
      'archiveKid',
    ]) {
      expect(lifecycle).toContain('export const ' + name);
      expect(index).toContain(name);
    }
    expect(index).toContain('from "./scheduling/rollingScheduleCompatibility"');
    expect(index).toContain('from "./scheduling/rollingScheduleCourseTransition"');
    expect(index).not.toContain('} from "./createSessionsFromSchedule";');
  });
  it('preserves the legacy finite scheduler compatibility exports and repair contracts', () => {
    for(const name of [
      'createSessionsFromSchedule',
      'saveEnrollmentScheduleAndGenerateSessions',
      'repairEnrollmentFutureSessionsFromSchedule',
      'repairCancelledFutureRegularSessionsForEnrollment',
      'pauseEnrollmentUpcomingSessions',
      'resumeEnrollmentSchedule',
    ]) {
      expect(finite).toContain('export const ' + name);
    }
    expect(lifecycle).toContain("from './createSessionsFromSchedule'");
    expect(finite).toContain('repairEnrollmentFutureSessionsFromScheduleInternal');
  });
  it('retains lifecycle transaction and protected session safeguards', () => {
    expect(lifecycle).toContain('buildOperationalEnrollmentKeyId');
    expect(lifecycle).toContain('isLifecycleSessionProtected');
    expect(lifecycle).toContain('repairEnrollmentTeacherSessionConsistency');
  });
});
