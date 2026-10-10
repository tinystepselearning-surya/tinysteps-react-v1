import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const source = read('functions/src/attendanceValidation/manualVerificationCallable.ts');
const index = read('functions/src/index.ts');

describe('R5C2C16 AVS manual verification canonical Admin routing', () => {
  it('requires canonical Admin authority with no legacy fallback', () => {
    expect(source).toContain("from '../helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from '../helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });

  it('retains transaction-level AVS discrepancy consistency and writes', () => {
    expect(source).toContain('loadAvsBusinessGroupForSession(db, params.classSessionId, params.kidId)');
    expect(source).toContain('await db.runTransaction(async (transaction) => {');
    expect(source).toContain('transaction.getAll(...sessionRefs, ...caseRefs)');
    expect(source).toContain('transaction.create(resolutionRef, {');
    expect(source).toContain('transaction.update(caseRefs[index], {');
    expect(source).toContain("['false_present', 'false_absent']");
    expect(source).toContain("businessOutcome: 'verified'");
    expect(source).not.toContain("transaction.update(sessionRefs[");
    expect(source).not.toContain("transaction.set(sessionRefs[");
    expect(source).not.toContain("collection('payments')");
    expect(source).not.toContain("collection('teacherEarnings')");
  });

  it('retains the dedicated exported callable and invocation transport', () => {
    expect(source).toContain('invoker: \'public\'');
    expect(source).toContain("labels: { 'avs-public-invoker': 'true' }");
    expect(index).toContain('adminVerifyAttendanceValidationGroup');
  });
});
