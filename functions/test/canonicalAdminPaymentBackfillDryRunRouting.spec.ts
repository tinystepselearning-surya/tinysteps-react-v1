import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe, expect, it} from 'vitest';

const src = readFileSync(resolve(process.cwd(), 'functions/src/parentPaymentBackfillDryRun.ts'), 'utf8');
const index = readFileSync(resolve(process.cwd(), 'functions/src/index.ts'), 'utf8');

describe('R5C2C33 payment backfill dry-run canonical Admin guard', () => {
  it('uses canonical Admin without a legacy fallback', () => {
    expect(src).toContain("from './helpers/canonicalAdminGuard'");
    expect(src).toContain('await ensureCanonicalAdmin(request.auth);');
    expect(src).not.toContain("from './helpers/adminGuard'");
    expect(src).not.toContain('await ensureAdmin(request.auth);');
    expect(index).toContain('export { auditParentPaymentBackfillDryRun } from "./parentPaymentBackfillDryRun";');
  });
  it('retains the same dry-run validation and no-write report contract', () => {
    expect(src).toContain("if (mode !== 'dry_run')");
    expect(src).toContain('limitParents');
    expect(src).toContain('limitPayments');
    expect(src).toContain('writeSafety: {');
    expect(src).toContain('wrotePayments: false');
    expect(src).toContain('wroteBillingCharges: false');
    expect(src).toContain('wroteParentWallets: false');
    expect(src).toContain('wroteInvoices: false');
  });
});
