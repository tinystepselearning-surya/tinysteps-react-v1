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

const updateUser = read(
  'functions/src/adminUpdateUserCanonical.ts',
);
const archiveUser = read(
  'functions/src/adminArchiveUserCanonical.ts',
);
const createUser = read(
  'functions/src/adminCreateUserCanonical.ts',
);
const setUserRole = read(
  'functions/src/adminSetUserRoleCanonical.ts',
);

describe('Wave 1 R5C2C2 generic-user mutation Admin authorization routing', () => {
  it('routes generic-user update and archive through canonical Admin access', () => {
    for (const source of [
      updateUser,
      archiveUser,
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
      expect(source).not.toContain(
        'ensureAdmin(',
      );
    }
  });

  it('preserves canonical-primary user mutation writers', () => {
    expect(updateUser).toContain(
      'planCanonicalAuthUserUpdate',
    );
    expect(updateUser).toContain(
      'writeCanonicalAuthUserUpdatePlan',
    );
    expect(archiveUser).toContain(
      'planCanonicalAuthUserArchive',
    );
    expect(archiveUser).toContain(
      'writeCanonicalAuthUserArchivePlan',
    );
  });

  it('keeps create and role-change outside this bounded slice', () => {
    for (const source of [
      createUser,
      setUserRole,
    ]) {
      expect(source).toContain(
        "from './helpers/adminGuard'",
      );
      expect(source).toContain(
        'ensureAdmin',
      );
      expect(source).not.toContain(
        "from './helpers/canonicalAdminGuard'",
      );
    }
  });
});
