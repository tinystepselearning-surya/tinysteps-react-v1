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

const adminGuard = read(
  'functions/src/helpers/adminGuard.ts',
);
const schoolAuthorization = read(
  'functions/src/helpers/schoolAuthorization.ts',
);
const schoolEvidence = read(
  'functions/src/schoolEvidence.ts',
);

describe('Wave 1 R5C1 school authorization routing', () => {
  it('keeps the shared Admin guard unchanged until the separately bounded R5C2 rollout', () => {
    expect(adminGuard).toContain(
      "collection('users')",
    );
    expect(adminGuard).not.toContain(
      'loadCurrentAuthAccessPrincipal',
    );
  });

  it('removes legacy users and schoolUsers from current school-principal authorization', () => {
    expect(schoolAuthorization).toContain(
      'loadCurrentAuthAccessPrincipal',
    );
    expect(schoolAuthorization).toContain(
      'principalHasSchoolAdminAccess',
    );
    expect(schoolAuthorization).not.toContain(
      ".collection('users')",
    );
    expect(schoolAuthorization).not.toContain(
      ".collection('schoolUsers')",
    );
    expect(schoolAuthorization).not.toContain(
      '.collection("users")',
    );
    expect(schoolAuthorization).not.toContain(
      '.collection("schoolUsers")',
    );
  });

  it('preserves operational Firebase UID ownership for Learning Partner school assignment', () => {
    expect(schoolAuthorization).toContain(
      'school.learningPartnerId ===',
    );
    expect(schoolAuthorization).toContain(
      'current.uid',
    );
  });

  it('uses canonical Person profile data for school evidence actor names', () => {
    expect(schoolEvidence).toContain(
      ".collection('people')",
    );
    expect(schoolEvidence).toContain(
      'manager.personId',
    );
    expect(schoolEvidence).not.toContain(
      'manager.user',
    );
  });
});
