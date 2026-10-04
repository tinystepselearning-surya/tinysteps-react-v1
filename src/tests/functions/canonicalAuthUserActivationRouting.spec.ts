import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const indexSource = read('functions/src/index.ts');
const createModuleSource = read(
  'functions/src/adminCreateUser.ts',
);
const updateModuleSource = read(
  'functions/src/adminUpdateUser.ts',
);
const archiveModuleSource = read(
  'functions/src/adminArchiveUser.ts',
);
const assignModuleSource = read(
  'functions/src/assignLP.ts',
);
const createSource = read(
  'functions/src/adminCreateUserCanonical.ts',
);
const updateSource = read(
  'functions/src/adminUpdateUserCanonical.ts',
);
const archiveSource = read(
  'functions/src/adminArchiveUserCanonical.ts',
);
const roleSource = read(
  'functions/src/adminSetUserRoleCanonical.ts',
);
const teacherCallableSource = read(
  'functions/src/updateTeacherProfile.ts',
);
const legacySyncSource = read(
  'functions/src/schoolOS/identity/legacySync.ts',
);
const createFormSource = read(
  'src/pages/admin/UserManagement/CreateUserForm.tsx',
);
const editFormSource = read(
  'src/pages/admin/UserManagement/EditUserForm.tsx',
);
const userListSource = read(
  'src/pages/admin/UserManagement/UserList.tsx',
);
const teacherProfileSource = read(
  'src/pages/teacher/components/profile/TeacherProfile.tsx',
);

describe('Wave 1 R4 Brick 5E auth-backed writer activation routing', () => {
  it('preserves existing production export topology while routing modules to canonical implementations', () => {
    expect(indexSource).toContain(
      'export { adminCreateUser } from "./adminCreateUser";',
    );
    expect(indexSource).toContain(
      'export { adminUpdateUser } from "./adminUpdateUser";',
    );
    expect(indexSource).toContain(
      'export { adminArchiveUser } from "./adminArchiveUser";',
    );
    expect(indexSource).toContain(
      'adminSetUserRole',
    );
    expect(indexSource).toContain(
      '} from "./assignLP";',
    );
    expect(indexSource).toContain(
      'export { updateTeacherProfile } from "./updateTeacherProfile";',
    );

    expect(createModuleSource).toContain(
      "export { adminCreateUser } from './adminCreateUserCanonical';",
    );
    expect(updateModuleSource).toContain(
      "export { adminUpdateUser } from './adminUpdateUserCanonical';",
    );
    expect(archiveModuleSource).toContain(
      "export { adminArchiveUser } from './adminArchiveUserCanonical';",
    );
    expect(assignModuleSource).toContain(
      "export { adminSetUserRole } from './adminSetUserRoleCanonical';",
    );
  });

  it('creates a Tiny Steps Person ID independently from Firebase Auth UID and compensates failed Firestore creation', () => {
    expect(createSource).toContain(
      "db.collection('people').doc().id",
    );
    expect(createSource).toContain(
      'planCanonicalAuthUserCreate',
    );
    expect(createSource).toContain(
      'writeCanonicalAuthUserCreatePlan',
    );
    expect(createSource).toContain(
      '.deleteUser(createdUid)',
    );
    expect(createSource).not.toContain(
      'personId = authUser.uid',
    );
  });

  it('resolves UID to Person before canonical update, role transition, and archive', () => {
    for (const source of [
      updateSource,
      roleSource,
      archiveSource,
    ]) {
      expect(source).toContain(
        'resolvePersonIdFromFirebaseUid',
      );
    }

    expect(updateSource).toContain(
      'writeCanonicalAuthUserUpdatePlan',
    );
    expect(roleSource).toContain(
      'writeCanonicalAuthUserUpdatePlan',
    );
    expect(archiveSource).toContain(
      'writeCanonicalAuthUserArchivePlan',
    );
  });

  it('corroborates canonical users projections before suppressing legacy user expansion', () => {
    expect(legacySyncSource).toContain(
      'authUserProjectionAuthIdentityId',
    );
    expect(legacySyncSource).toContain(
      'authUserProjectionMarker',
    );
    expect(legacySyncSource).toContain(
      'canonicalAuthUserProjectionMatchesAuthority',
    );
    expect(legacySyncSource).toContain(
      "db.collection('authIdentities')",
    );
    expect(legacySyncSource).toContain(
      'projection.canonicalPersonId',
    );
  });

  it('routes teacher self-profile writes through the canonical callable with no browser users write', () => {
    expect(teacherCallableSource).toContain(
      'writeCanonicalTeacherProfileUpdatePlan',
    );
    expect(teacherCallableSource).toContain(
      'resolvePersonIdFromFirebaseUid',
    );
    expect(teacherProfileSource).toContain(
      "httpsCallable(\n        functions,\n        'updateTeacherProfile'",
    );
    expect(teacherProfileSource).not.toContain(
      "setDoc(doc(db, 'users'",
    );
    expect(teacherProfileSource).not.toContain(
      'serverTimestamp()',
    );
  });

  it('removes generic Kid/School Admin creation, obsolete learner reads, and token payload logging from Create User', () => {
    expect(createFormSource).not.toContain(
      '<TabsTrigger value="schoolAdmin">',
    );
    expect(createFormSource).not.toContain(
      '<TabsTrigger value="kid">',
    );
    expect(createFormSource).not.toContain(
      "collection(db, 'kids')",
    );
    expect(createFormSource).not.toContain(
      'KidMultiSelect',
    );
    expect(createFormSource).not.toContain(
      'adminToken:',
    );
    expect(createFormSource).not.toContain(
      "console.log('Debug:",
    );
    expect(createFormSource).toContain(
      "status: z.enum(['active', 'suspended'])",
    );
  });

  it('keeps archive out of generic Edit User and blocks generic Kid/School Admin role transitions in the UI', () => {
    expect(editFormSource).not.toContain(
      '<SelectItem value="schoolAdmin">',
    );
    expect(editFormSource).not.toContain(
      '<SelectItem value="kid">',
    );
    expect(editFormSource).not.toContain(
      '<SelectItem value="archived">',
    );
    expect(editFormSource).toContain(
      "status: z.enum(['active', 'suspended'])",
    );
  });

  it('protects all identity-bearing roles from the legacy hard-delete action', () => {
    for (const role of [
      'admin',
      'founder',
      'teacher',
      'parent',
      'learningPartner',
      'kid',
      'schoolAdmin',
    ]) {
      expect(userListSource).toContain(
        `canonical === '${role}'`,
      );
    }
    expect(userListSource).toContain(
      'Delete disabled (archive only)',
    );
  });
});
