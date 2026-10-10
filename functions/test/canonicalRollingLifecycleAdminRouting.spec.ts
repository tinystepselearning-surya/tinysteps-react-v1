import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const src = readFileSync(resolve(process.cwd(), 'functions/src/scheduling/rollingScheduleLifecycle.ts'), 'utf8');
const index = readFileSync(resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');

describe('R5C2C30 rolling lifecycle canonical requester authorization', () => {
  it('requires canonical Admin for both lifecycle entry points', () => {
    expect(src).toContain("from '../helpers/canonicalAdminGuard'");
    expect(src).not.toContain("from '../helpers/adminGuard'");
    expect(src).not.toContain('await ensureAdmin(request.auth);');
    expect(src.match(/await ensureCanonicalAdmin\(request.auth\);/g)).toHaveLength(2);
  });
  it('preserves both exports and existing session safety operations', () => {
    expect(index).toContain('saveRollingEnrollmentSchedule');
    expect(index).toContain('setRollingEnrollmentLifecycle');
    expect(src).toContain('canCancelRollingLifecycleSession');
    expect(src).toContain('canRestorePausedRollingSession');
    expect(src).toContain('externallyFinanceLinkedSessionIds');
  });
});
