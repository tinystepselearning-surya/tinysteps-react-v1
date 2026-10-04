import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const source = fs.readFileSync(
  path.resolve(
    process.cwd(),
    'functions/src/adminDeleteUser.ts',
  ),
  'utf8',
);

describe('Wave 1 R5C2C4 adminDeleteUser authorization routing', () => {
  it('routes requester authorization through canonical Admin access', () => {
    expect(source).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(source).toContain(
      'await ensureCanonicalAdmin(auth);',
    );
    expect(source).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(source).not.toContain(
      'await ensureAdmin(auth);',
    );
  });

  it('preserves self-delete and protected-role hard-delete guards', () => {
    expect(source).toContain(
      'if (auth.uid === targetUid)',
    );
    expect(source).toContain(
      'You cannot delete your own admin account',
    );
    expect(source).toContain(
      "canonicalRole === 'parent'",
    );
    expect(source).toContain(
      "canonicalRole === 'kid'",
    );
    expect(source).toContain(
      "canonicalRole === 'schoolAdmin'",
    );
    expect(source).toContain(
      "rawRole === 'student'",
    );
    expect(source).toContain(
      "rawRole === 'students'",
    );
    expect(source).toContain(
      'Parent/student accounts cannot be permanently deleted. Archive the user instead.',
    );
  });

  it('preserves the existing destructive cleanup boundary', () => {
    expect(source).toContain(
      'await admin.auth().deleteUser(targetUid);',
    );
    expect(source).toContain(
      'batch.delete(userRef);',
    );
    expect(source).toContain(
      'getRoleMirrorCollection',
    );
    expect(source).toContain(
      'We intentionally do NOT auto-delete kids, sessions, invoices etc.',
    );
  });
});
