import {readFileSync, readdirSync, statSync} from 'node:fs';
import {relative, resolve, join, sep} from 'node:path';
import {describe, expect, it} from 'vitest';

const root = resolve(process.cwd(), 'functions/src');

function allProductionSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? allProductionSourceFiles(path)
      : /\.(?:ts|js)$/.test(path) ? [path] : [];
  });
}
function source(name: string): string {
  return readFileSync(resolve(root, name), 'utf8');
}

describe('Wave 1 R5 Milestone 2 permanent legacy Admin authorization exit gate', () => {
  it('leaves no importer or invocation of the legacy Admin guard in production source', () => {
    const violations: string[] = [];
    for (const file of allProductionSourceFiles(root)) {
      const relativePath = relative(root, file).split(sep).join('/');
      // Retain the unused historical helper until a separately audited retirement.
      if (relativePath === 'helpers/adminGuard.ts') continue;
      const data = readFileSync(file, 'utf8');
      if (/from\s*['"][^'"]*\/helpers\/adminGuard['"]/.test(data) ||
          /\bawait\s+ensureAdmin\s*\(/.test(data)) {
        violations.push(relativePath);
      }
    }
    expect(violations).toEqual([]);
  });

  it('records canonical authorization at all 34 last-batch guard sites', () => {
    const expected: Record<string, number> = {
      'sessionsManagementSnapshot.ts': 3,
      'adminAttendanceCorrectionTeacherPayDecision.ts': 1,
      'parentPaymentBackfillWriteMode.ts': 1,
      'wallet.ts': 9,
      'revenue.ts': 7,
      'lifecycle.ts': 7,
      'createSessionsFromSchedule.ts': 6,
    };
    for (const [file, expectedCount] of Object.entries(expected)) {
      const content = source(file);
      expect(content).toMatch(/from\s*['"][^'"]*\/helpers\/canonicalAdminGuard['"]/);
      expect((content.match(/\bawait\s+ensureCanonicalAdmin\s*\(/g) || []).length).toBe(expectedCount);
      expect(content).not.toMatch(/\bawait\s+ensureAdmin\s*\(/);
    }
    expect(Object.values(expected).reduce((sum, n) => sum + n, 0)).toBe(34);
  });

  it('keeps canonical authority fail-closed without reading legacy users for Admin permission', () => {
    const guard = source('helpers/canonicalAdminGuard.ts');
    const authority = source('schoolOS/identity/authAccessAuthorization.ts');
    expect(guard).toContain('loadCurrentAuthAccessPrincipal');
    expect(guard).toContain('isCanonicalAdminPrincipal');
    expect(guard).toContain("'permission-denied'");
    expect(guard).not.toContain("collection('users')");
    expect(authority).toContain('AUTH_ACCESS_READ_MODEL_COLLECTION');
    expect(authority).toContain('.doc(firebaseUid)');
    expect(authority).toContain('auth_access_read_model_missing');
  });
});
