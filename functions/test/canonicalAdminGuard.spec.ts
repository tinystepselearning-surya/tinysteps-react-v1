import { describe, expect, it } from 'vitest';

import {
  isCanonicalAdminPrincipal,
} from '../src/helpers/canonicalAdminGuard';
import type {
  CurrentAuthAccessPrincipal,
} from '../src/schoolOS/identity/authAccessAuthorization';

function principal(
  overrides: Partial<CurrentAuthAccessPrincipal> = {},
): CurrentAuthAccessPrincipal {
  return {
    firebaseUid: 'uid-1',
    personId: 'person-1',
    personStatus: 'active',
    authStatus: 'active',
    accessActive: true,
    globalRoles: ['admin'],
    schoolAdminOrganisationIds: [],
    sourceAuthIdentityId: 'auth-1',
    ...overrides,
  };
}

describe('Wave 1 R5C2A canonical Admin guard', () => {
  it('accepts only an active canonical Admin principal', () => {
    expect(
      isCanonicalAdminPrincipal(
        principal(),
      ),
    ).toBe(true);

    expect(
      isCanonicalAdminPrincipal(
        principal({
          globalRoles: ['teacher'],
        }),
      ),
    ).toBe(false);

    expect(
      isCanonicalAdminPrincipal(
        principal({
          accessActive: false,
        }),
      ),
    ).toBe(false);
  });

  it('does not elevate Founder or School Admin scopes into global Admin', () => {
    expect(
      isCanonicalAdminPrincipal(
        principal({
          globalRoles: ['founder'],
        }),
      ),
    ).toBe(false);

    expect(
      isCanonicalAdminPrincipal(
        principal({
          globalRoles: [],
          schoolAdminOrganisationIds: [
            'school-1',
          ],
        }),
      ),
    ).toBe(false);
  });
});
