import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const source = read('functions/src/scheduling/rollingScheduleReconciliation.ts');
const index = read('functions/src/index.ts');
const lifecycle = read('functions/src/scheduling/rollingScheduleLifecycle.ts');

describe('R5C2C28 reconciliation authorization boundary', () => {
  it('uses canonical Admin only without legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves the existing reconciliation entry point and imported lifecycle logic', () => {
    expect(source).toContain('export const reconcileRollingEnrollmentSchedule = onCall(');
    expect(index).toContain('export { reconcileRollingEnrollmentSchedule } from "./scheduling/rollingScheduleReconciliation";');
    expect(source).toContain('materializeRollingEnrollmentWindowInternal');
    expect(source).toContain('canCancelRollingLifecycleSession');
    expect(lifecycle).toContain('await ensureCanonicalAdmin(request.auth);');
  });
});
