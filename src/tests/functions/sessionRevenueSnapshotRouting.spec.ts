import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const functionsIndexSource = readFileSync(
  join(process.cwd(), 'functions/src/index.ts'),
  'utf8',
);
const sessionRevenueSource = readFileSync(
  join(process.cwd(), 'functions/src/sessionRevenue.ts'),
  'utf8',
);

describe('session revenue immutable financial terms routing', () => {
  it('deploys the snapshot-aware session revenue trigger instead of the legacy revenue export', () => {
    expect(functionsIndexSource).toContain(
      'export { onSessionRevenueWrite } from "./sessionRevenue";',
    );
    const compactIndexSource = functionsIndexSource.replace(/\s+/g, ' ');
    expect(compactIndexSource).not.toMatch(
      /export\s*\{[^}]*onSessionRevenueWrite[^}]*\}\s*from\s*["']\.\/revenue["']/,
    );
  });

  it('captures financial terms before accrual and resolves rates from the session snapshot helper', () => {
    expect(sessionRevenueSource).toContain('ensureSessionFinancialTermsSnapshot');
    expect(sessionRevenueSource).toContain('resolveSessionBillingRate(session, enrollment)');
    expect(sessionRevenueSource).toContain('resolveSessionTeacherPayRate(session, enrollment)');
    expect(sessionRevenueSource).toContain('billingRateSnapshot: ratePerSession');
    expect(sessionRevenueSource).toContain('teacherPayRateSnapshot: teacherPayPerSession');
  });
});
