import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), 'utf8');
const coverage = read('functions/src/enrollmentCanonicalCoverage.ts');
const finance = read('functions/src/financeReconciliationReport.ts');
const index = read('functions/src/index.ts');

describe('R5C2C20 canonical Admin for bounded reporting functions', () => {
  it.each([['coverage', coverage], ['finance', finance]])('%s manual callable uses canonical Admin without legacy fallback', (_, source) => {
    expect(source).toContain("from './helpers/canonicalAdminGuard'");
    expect(source).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(source).not.toContain("from './helpers/adminGuard'");
    expect(source).not.toContain('await ensureAdmin(request.auth);');
  });

  it('keeps manual and scheduled enrollment coverage with report-only persistence', () => {
    expect(coverage).toContain('export const runEnrollmentCanonicalCoverage = onCall(');
    expect(coverage).toContain('export const runEnrollmentCanonicalCoverageDaily = onSchedule(');
    expect(coverage).toContain("db.collection('adminStats').doc('enrollmentCanonicalCoverage')");
    expect(coverage).toContain('rootRef.set(writePayload, { merge: true })');
    expect(coverage).toContain('runRef.set(writePayload, { merge: false })');
    expect(coverage).toContain("schedule: '45 2 * * *'");
  });

  it('keeps bounded manual and scheduled finance reconciliation reporting', () => {
    expect(finance).toContain('export const runFinanceReconciliationAudit = onCall(');
    expect(finance).toContain('export const runFinanceReconciliationAuditDaily = onSchedule(');
    expect(finance).toContain('persistFinanceReconciliationReport(');
    expect(finance).toContain('maxDocsPerCollection: 5000');
    expect(finance).toContain('maxLinkedLookups: 7000');
    expect(finance).toContain("schedule: '15 2 * * *'");
    expect(finance).not.toContain("collection('teacherPayouts').doc().set(");
  });

  it('keeps all four deployed roots exported', () => {
    for (const name of ['runEnrollmentCanonicalCoverage', 'runEnrollmentCanonicalCoverageDaily', 'runFinanceReconciliationAudit', 'runFinanceReconciliationAuditDaily']) {
      expect(index).toContain(name);
    }
  });
});
