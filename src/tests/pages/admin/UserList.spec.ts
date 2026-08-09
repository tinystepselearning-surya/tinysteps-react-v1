import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  normalizeStoredUserRole,
} from '../../../pages/admin/UserManagement/UserList';

describe('Admin User Management stored role compatibility', () => {
  it.each([
    'student',
    'students',
  ])('treats legacy %s users as Kid rather than Parent', (role) => {
    expect(
      normalizeStoredUserRole(role),
    ).toBe('kid');
  });
});
