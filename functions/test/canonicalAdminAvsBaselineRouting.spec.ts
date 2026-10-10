import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const source = read('functions/src/attendanceValidation/firstTimeBaselineCallable.ts');
const index = read('functions/src/index.ts');

describe('R5C2C17 AVS first-time baseline canonical Admin authorization', () => {
  it('requires canonical Admin authority without legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves bounded baseline and operational write exclusion', () => {
    expect(source).toContain('AVS_BASELINE_MAX_SESSIONS_PER_RUN');
    expect(source).toContain('AVS_BASELINE_QUERY_LIMIT');
    expect(source).toContain('operationalMutationAllowed: false');
    expect(source).toContain('runAttendanceValidationFirstTimeBaselineBatch(db, range)');
    expect(source).toContain("region: REGION");
    expect(source).toContain("invoker: 'private'");
    expect(source).toContain('maxInstances: 1');
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
  });
  it('maintains dedicated export', () => {
    expect(index).toContain('export { runAttendanceValidationFirstTimeBaseline } from "./attendanceValidation/firstTimeBaselineCallable";');
  });
});
