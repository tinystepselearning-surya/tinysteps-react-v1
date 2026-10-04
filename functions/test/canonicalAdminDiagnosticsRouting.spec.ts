import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const dryRun = read(
  'functions/src/parentPaymentBackfillDryRun.ts',
);
const historicalCandidates = read(
  'functions/src/getAdminHistoricalAttendanceCandidates.ts',
);
const transferredAudit = read(
  'functions/src/auditAllTransferredSessionSnapshotIssues.ts',
);

describe('Wave 1 R5C2B Admin diagnostics authorization routing', () => {
  it('routes all three diagnostic requesters through canonical Admin access', () => {
    for (const source of [
      dryRun,
      historicalCandidates,
      transferredAudit,
    ]) {
      expect(source).toContain(
        "from './helpers/canonicalAdminGuard'",
      );
      expect(source).toContain(
        'ensureCanonicalAdmin',
      );
      expect(source).not.toContain(
        "from './helpers/adminGuard'",
      );
    }
  });

  it('keeps parent payment backfill strictly dry-run with no business mutation', () => {
    expect(dryRun).toContain(
      "mode must be \"dry_run\" in this phase",
    );
    expect(dryRun).toContain(
      'wrotePayments: false',
    );
    expect(dryRun).toContain(
      'wroteBillingCharges: false',
    );
    expect(dryRun).toContain(
      'wroteParentWallets: false',
    );
    expect(dryRun).toContain(
      'wroteInvoices: false',
    );
  });

  it('allows target-entity legacy/profile reads without treating them as requester authorization', () => {
    expect(
      historicalCandidates,
    ).toContain(
      ".collection('users')",
    );
    expect(
      transferredAudit,
    ).toContain('fetchTeacherProfiles');
    expect(
      dryRun,
    ).toContain(
      ".collection('users').doc(parentId)",
    );

    for (const source of [
      historicalCandidates,
      transferredAudit,
      dryRun,
    ]) {
      expect(source).not.toContain(
        'ensureAdmin(request.auth)',
      );
    }
  });
});
