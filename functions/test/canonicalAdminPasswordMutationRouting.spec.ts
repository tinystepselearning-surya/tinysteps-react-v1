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

const generateResetLink = read(
  'functions/src/adminGenerateResetLink.ts',
);
const resetPassword = read(
  'functions/src/adminResetPassword.ts',
);
const deleteUser = read(
  'functions/src/adminDeleteUser.ts',
);
const createUser = read(
  'functions/src/adminCreateUserCanonical.ts',
);
const setUserRole = read(
  'functions/src/adminSetUserRoleCanonical.ts',
);

describe('Wave 1 R5C2C3 password-management Admin authorization routing', () => {
  it('routes reset-link generation and password reset through canonical Admin access', () => {
    for (const source of [
      generateResetLink,
      resetPassword,
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

  it('preserves password-management business behavior', () => {
    expect(generateResetLink).toContain(
      'generatePasswordResetLink',
    );
    expect(generateResetLink).toContain(
      "collection('password_reset_requests')",
    );
    expect(resetPassword).toContain(
      'admin.auth().updateUser',
    );
    expect(resetPassword).toContain(
      "collection('password_reset_requests')",
    );
  });

  it('keeps destructive delete and coupled account mutations outside this bounded slice', () => {
    for (const source of [
      deleteUser,
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
