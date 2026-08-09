import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  buildRoleClaims,
  getRoleMirrorCollection,
  normalizeRole,
} from '../src/helpers/roles';

describe('backend role contract', () => {
  it('normalizes Learning Partner aliases', () => {
    expect(
      normalizeRole('learningPartner'),
    ).toBe('learningPartner');

    expect(
      normalizeRole('learning-partner'),
    ).toBe('learningPartner');
  });

  it('normalizes School Admin aliases', () => {
    expect(
      normalizeRole('schoolAdmin'),
    ).toBe('schoolAdmin');

    expect(
      normalizeRole('school-admin'),
    ).toBe('schoolAdmin');
  });

  it('rejects the historical rm role', () => {
    expect(
      normalizeRole('rm'),
    ).toBeNull();
  });

  it('maps only mirror-backed roles', () => {
    expect(
      getRoleMirrorCollection(
        'learningPartner',
      ),
    ).toBe('learningPartners');

    expect(
      getRoleMirrorCollection(
        'schoolAdmin',
      ),
    ).toBeNull();

    expect(
      getRoleMirrorCollection('kid'),
    ).toBeNull();
  });

  it('replaces stale role claims while keeping unrelated claims', () => {
    const claims =
      buildRoleClaims(
        {
          role: 'teacher',
          teacher: true,
          rm: true,
          unrelatedClaim: 'keep-me',
        },
        'schoolAdmin',
      );

    expect(claims).toMatchObject({
      role: 'schoolAdmin',
      rawRole: 'schoolAdmin',
      schoolAdmin: true,
      'school-admin': true,
      unrelatedClaim: 'keep-me',
    });

    expect(claims.teacher)
      .toBeUndefined();

    expect(claims.rm)
      .toBeUndefined();
  });
});
