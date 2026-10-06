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

const teacherProfile = read(
  'functions/src/updateTeacherProfile.ts',
);
const indexSource = read(
  'functions/src/index.ts',
);

describe('Wave 1 R5C2C5 teacher profile Admin authorization', () => {
  it('uses canonical Admin access only for Admin-on-behalf teacher profile edits', () => {
    expect(teacherProfile).toContain(
      "from './helpers/canonicalAdminGuard'",
    );
    expect(teacherProfile).toContain(
      'await ensureCanonicalAdmin(request.auth);',
    );
    expect(teacherProfile).not.toContain(
      "from './helpers/adminGuard'",
    );
    expect(teacherProfile).not.toContain(
      'await ensureAdmin(request.auth);',
    );
  });

  it('preserves teacher self-service authorization and canonical profile writing', () => {
    expect(teacherProfile).toContain(
      'request.auth.uid !== teacherUid',
    );
    expect(teacherProfile).toContain(
      "await db.collection('users')",
    );
    expect(teacherProfile).toContain(
      "normalizeRole(userData.role) !==\n          'teacher'",
    );
    expect(teacherProfile).toContain(
      'resolvePersonIdFromFirebaseUid',
    );
    expect(teacherProfile).toContain(
      'planCanonicalTeacherProfileUpdate',
    );
    expect(teacherProfile).toContain(
      'writeCanonicalTeacherProfileUpdatePlan',
    );
  });

  it('keeps the deployment surface isolated to the existing updateTeacherProfile export', () => {
    expect(indexSource).toContain(
      'export { updateTeacherProfile } from "./updateTeacherProfile";',
    );
  });
});
