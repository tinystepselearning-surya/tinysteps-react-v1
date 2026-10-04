import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), relativePath),
    'utf8',
  );

const createSource = read(
  'functions/src/adminCreateUserCanonical.ts',
);
const updateSource = read(
  'functions/src/adminUpdateUserCanonical.ts',
);
const roleSource = read(
  'functions/src/adminSetUserRoleCanonical.ts',
);
const archiveSource = read(
  'functions/src/adminArchiveUserCanonical.ts',
);
const teacherProfileSource = read(
  'functions/src/updateTeacherProfile.ts',
);
const legacySyncSource = read(
  'functions/src/schoolOS/identity/legacySync.ts',
);
const maintenanceSource = read(
  'functions/src/schoolOS/identity/authAccessReadModelMaintenance.ts',
);

describe('Wave 1 R5B auth access read-model maintenance routing', () => {
  it('refreshes once after each canonical auth access mutation through a best-effort sidecar', () => {
    const expected = [
      [createSource, "'adminCreateUser'"],
      [updateSource, "'adminUpdateUser'"],
      [roleSource, "'adminSetUserRole'"],
      [archiveSource, "'adminArchiveUser'"],
    ] as const;

    for (const [source, context] of expected) {
      expect(source).toContain(
        'refreshAuthAccessReadModelBestEffort',
      );
      expect(source).toContain(
        'context: ' + context,
      );
    }
  });

  it('does not refresh authorization state for teacher profile-only edits', () => {
    expect(teacherProfileSource).not.toContain(
      'refreshAuthAccessReadModel',
    );
    expect(teacherProfileSource).not.toContain(
      'authAccessReadModelMaintenance',
    );
  });

  it('keeps callable maintenance non-blocking after the canonical transaction has committed', () => {
    expect(maintenanceSource).toContain(
      'export async function refreshAuthAccessReadModelBestEffort',
    );
    expect(maintenanceSource).toContain(
      'return result;',
    );
    expect(maintenanceSource).not.toContain(
      'throw new HttpsError',
    );
  });

  it('refreshes legacy users strictly and removes stale access state on user deletion', () => {
    expect(legacySyncSource).toContain(
      'maintainAuthAccessAfterLegacySync',
    );
    expect(legacySyncSource).toContain(
      "sourceCollection === 'users'",
    );
    expect(legacySyncSource).toContain(
      "result.outcome === 'source_deleted'",
    );
    expect(legacySyncSource).toContain(
      'deleteAuthAccessReadModelStrict',
    );
    expect(legacySyncSource).toContain(
      "context: 'legacyUserSync'",
    );
  });

  it('refreshes both previous and current school-admin Persons after schoolUsers synchronization', () => {
    expect(legacySyncSource).toContain(
      "sourceCollection !== 'schoolUsers'",
    );
    expect(legacySyncSource).toContain(
      ".collection('schoolUsers')",
    );
    expect(legacySyncSource).toContain(
      'resolveFirebaseUidFromPersonId',
    );
    expect(legacySyncSource).toContain(
      'beforeData?.userId',
    );
    expect(legacySyncSource).toContain(
      'currentData?.userId',
    );
    expect(legacySyncSource).toContain(
      "context: 'legacySchoolUserSync'",
    );
  });

  it('does not add broad canonical Firestore triggers that would multiply refresh reads', () => {
    const indexSource = read(
      'functions/src/index.ts',
    );

    expect(indexSource).not.toContain(
      'onAuthAccessPersonWrite',
    );
    expect(indexSource).not.toContain(
      'onAuthAccessRoleAssignmentWrite',
    );
    expect(indexSource).not.toContain(
      'onAuthAccessAuthIdentityWrite',
    );
    expect(indexSource).not.toContain(
      'onAuthAccessOrganisationMembershipWrite',
    );
  });
});
