import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const source = read('functions/src/attendanceValidation/runValidationCallable.ts');
const index = read('functions/src/index.ts');

describe('R5C2C19 AVS range canonical Admin authorization', () => {
  it('uses canonical Admin with no legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });

  it('preserves current AVS completed-date, read and write semantics', () => {
    expect(source).toContain('normalizeAvsLatestCheckRange(');
    expect(source).toContain('discoverAvsRangeGroups(db, range, enrollmentIds, cursor)');
    expect(source).toContain('persistAvsGroupCases(db, persistenceRows, cases)');
    expect(source).toContain('bindTeacherIdentityFromFreshEvidence(');
    expect(source).toContain('operationalMutationAllowed: false');
    expect(source).toContain('maxSessionsPerInvocation: 100');
    expect(source).toContain('range.toDate >= today');
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
  });

  it('preserves bounded dedicated callable transport', () => {
    expect(source).toContain("invoker: 'public'");
    expect(source).toContain("labels: { 'avs-public-invoker': 'true' }");
    expect(source).toContain('maxInstances: 1');
    expect(index).toContain('runAttendanceValidationRange');
  });
});
