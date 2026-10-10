import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const source = read('functions/src/attendanceValidation/latestCheckCallable.ts');
const index = read('functions/src/index.ts');

describe('R5C2C18 AVS latest check canonical Admin authorization', () => {
  it('requires canonical Admin without a legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });
  it('preserves private callable boundaries and non-operational mutation stance', () => {
    expect(source).toContain("invoker: 'private'");
    expect(source).toContain('operationalMutationAllowed: false');
    expect(source).toContain('deleteBatch.delete(');
    expect(source).toContain('await deleteBatch.commit()');
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
  });
  it('keeps a separately exported deployed Function', () => {
    expect(index).toContain('runAttendanceValidationLatestCheck');
  });
});
