import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      relativePath,
    ),
    'utf8',
  );

const canonicalGuard = read(
  'functions/src/helpers/canonicalAdminGuard.ts',
);

const migratedSources = [
  'functions/src/auditTeacherEarningsCanonicalCoverage.ts',
  'functions/src/getAdminTeacherEarningAdjustments.ts',
  'functions/src/getAdminTeacherPayWithholdings.ts',
  'functions/src/auditTeacherTodaySessions.ts',
  'functions/src/traceStudentTransferHistory.ts',
].map(read);

describe('Wave 1 R5C2A bounded Admin read/audit cutover', () => {
  it('authorizes from the reconciled canonical access read model with no legacy fallback', () => {
    expect(canonicalGuard).toContain(
      'loadCurrentAuthAccessPrincipal',
    );
    expect(canonicalGuard).toContain(
      "principalHasGlobalRole",
    );
    expect(canonicalGuard).toContain(
      "'admin'",
    );
    expect(canonicalGuard).not.toContain(
      ".collection('users')",
    );
    expect(canonicalGuard).not.toContain(
      '.collection("users")',
    );
    expect(canonicalGuard).not.toContain(
      'normalizeRole(auth?.token?.role)',
    );
    expect(canonicalGuard).not.toContain(
      'auth?.token?.admin',
    );
  });

  it('moves only the selected low-risk report/audit callers in this slice', () => {
    for (const source of migratedSources) {
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

  it('does not alter the shared legacy Admin guard in this slice', () => {
    const sharedGuard = read(
      'functions/src/helpers/adminGuard.ts',
    );

    expect(sharedGuard).toContain(
      ".collection('users')",
    );
    expect(sharedGuard).not.toContain(
      'loadCurrentAuthAccessPrincipal',
    );
  });
});
