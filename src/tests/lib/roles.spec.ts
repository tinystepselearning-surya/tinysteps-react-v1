import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  AUTH_ROLES,
  getRoleRedirectPath,
  normalizeAuthRole,
} from '../../constants/roles';

describe('Tiny Steps role contract', () => {
  it('contains all canonical roles', () => {
    expect(AUTH_ROLES).toEqual([
      'admin',
      'teacher',
      'parent',
      'kid',
      'learningPartner',
      'schoolAdmin',
    ]);
  });

  it('normalizes the legacy Learning Partner role', () => {
    expect(
      normalizeAuthRole(
        'learning-partner',
      ),
    ).toBe('learningPartner');

    expect(
      normalizeAuthRole(
        'learningPartner',
      ),
    ).toBe('learningPartner');

    expect(
      normalizeAuthRole(
        'LEARNINGPARTNER',
      ),
    ).toBe('learningPartner');
  });

  it('normalizes School Admin values', () => {
    expect(
      normalizeAuthRole('schoolAdmin'),
    ).toBe('schoolAdmin');

    expect(
      normalizeAuthRole('school-admin'),
    ).toBe('schoolAdmin');
  });

  it('rejects unknown roles', () => {
    expect(
      normalizeAuthRole('rm'),
    ).toBeNull();

    expect(
      normalizeAuthRole('unknown'),
    ).toBeNull();

    expect(
      normalizeAuthRole(null),
    ).toBeNull();
  });

  it('redirects School Admin to the school workspace', () => {
    expect(
      getRoleRedirectPath('schoolAdmin'),
    ).toBe('/school');
  });
});
