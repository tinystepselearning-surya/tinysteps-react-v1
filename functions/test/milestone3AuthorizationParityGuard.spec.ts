import {describe, expect, it} from 'vitest';
import {isCanonicalAdminPrincipal} from '../src/helpers/canonicalAdminGuard';
import {
  parseCurrentAuthAccessPrincipal,
  principalHasSchoolAdminAccess,
} from '../src/schoolOS/identity/authAccessAuthorization';
import {
  AUTH_ACCESS_READ_MODEL_AUTHORITY,
  AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION,
} from '../src/schoolOS/identity/authAccessReadModel';

const baseline = {
  schemaVersion: AUTH_ACCESS_READ_MODEL_SCHEMA_VERSION,
  authority: AUTH_ACCESS_READ_MODEL_AUTHORITY,
  firebaseUid: 'synthetic-uid',
  personId: 'synthetic-person',
  sourceAuthIdentityId: 'synthetic-auth-id',
  personStatus: 'active',
  authStatus: 'active',
  accessActive: true,
  globalRoles: ['admin'],
  schoolAdminOrganisationIds: [],
};

function principal(overrides: Record<string, unknown> = {}) {
  return parseCurrentAuthAccessPrincipal({
    documentId: 'synthetic-uid',
    data: {...baseline, ...overrides},
  });
}

describe('Milestone 3 canonical authorization parity without legacy exceptions', () => {
  it('requires an active canonical global Admin role, not a legacy superUser flag', () => {
    expect(isCanonicalAdminPrincipal(principal())).toBe(true);
    expect(isCanonicalAdminPrincipal(principal({globalRoles: ['parent'], superUser: true}))).toBe(false);
    expect(isCanonicalAdminPrincipal(principal({globalRoles: ['founder']}))).toBe(false);
    expect(isCanonicalAdminPrincipal(principal({globalRoles: []}))).toBe(false);
  });

  it('never turns scoped school Admin into global Admin', () => {
    const scoped = principal({
      globalRoles: [],
      schoolAdminOrganisationIds: ['school-a'],
    });
    expect(isCanonicalAdminPrincipal(scoped)).toBe(false);
    expect(principalHasSchoolAdminAccess(scoped, 'school-a')).toBe(true);
    expect(principalHasSchoolAdminAccess(scoped, 'school-b')).toBe(false);
  });

  it('denies inactive canonical principals even when role arrays contain Admin', () => {
    const suspended = principal({personStatus: 'suspended', accessActive: false});
    const disabled = principal({authStatus: 'disabled', accessActive: false});
    expect(isCanonicalAdminPrincipal(suspended)).toBe(false);
    expect(isCanonicalAdminPrincipal(disabled)).toBe(false);
    expect(principalHasSchoolAdminAccess(
      principal({globalRoles: [], authStatus: 'disabled', accessActive: false, schoolAdminOrganisationIds: ['school-a']}),
      'school-a',
    )).toBe(false);
  });

  it('rejects malformed identity authority, UID and accessActive projections', () => {
    expect(() => principal({authority: 'legacy-users'})).toThrow();
    expect(() => principal({firebaseUid: 'different-uid'})).toThrow();
    expect(() => principal({personStatus: 'suspended', accessActive: true})).toThrow();
  });

  it('does not derive global Admin from a token email or identity exception', () => {
    const p = principal({globalRoles: ['teacher'], email: 'fictional@example.invalid', legacyAdminException: true});
    expect(isCanonicalAdminPrincipal(p)).toBe(false);
  });
});
