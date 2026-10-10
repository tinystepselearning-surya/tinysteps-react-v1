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

const historicalCandidates = read(
  'functions/src/getAdminHistoricalAttendanceCandidates.ts',
);
const transferredAudit = read(
  'functions/src/auditAllTransferredSessionSnapshotIssues.ts',
);
const deferredPaymentDryRun = read(
  'functions/src/parentPaymentBackfillDryRun.ts',
);

describe('Wave 1 R5C2B Admin diagnostics authorization routing', () => {
  it('routes the two independent diagnostic requesters through canonical Admin access', () => {
    for (const source of [
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

  it('allows target-entity legacy/profile reads without treating them as requester authorization', () => {
    expect(
      historicalCandidates,
    ).toContain(
      ".collection('users')",
    );
    expect(
      transferredAudit,
    ).toContain('fetchTeacherProfiles');

    for (const source of [
      historicalCandidates,
      transferredAudit,
    ]) {
      expect(source).not.toContain(
        'ensureAdmin(request.auth)',
      );
    }
  });

  it('recognizes the separately migrated C33 payment dry-run canonical guard', () => {
    expect(deferredPaymentDryRun).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(deferredPaymentDryRun).toContain(
      'await ensureCanonicalAdmin(request.auth)',
    );
    expect(deferredPaymentDryRun).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(deferredPaymentDryRun).not.toContain(
      'await ensureAdmin(request.auth)',
    );
  });
});
