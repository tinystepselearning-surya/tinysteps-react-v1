import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const source = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/attendanceValidation/forceFreshRangeCallable.ts'), 'utf8');
const index = fs.readFileSync(path.resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');
describe('R5C2C22 forced AVS range canonical Admin authorization', () => {
  it('uses canonical Admin and no legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });
  it('keeps bounded non-operational AVS writes and transport', () => {
    expect(source).toContain('operationalMutationAllowed: false');
    expect(source).toContain('runRef.create(');
    expect(source).toContain('transaction.set(checkpointRef, {');
    expect(source).toContain('transaction.set(params.runRef, {');
    expect(source).toContain("invoker: 'public'");
    expect(source).toContain('maxInstances: 1');
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
  });
  it('remains separately exported', () => {
    expect(index).toContain('forceRefreshAttendanceValidationRange');
  });
});
