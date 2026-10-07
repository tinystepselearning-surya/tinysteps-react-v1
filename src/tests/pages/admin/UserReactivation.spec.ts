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
    'src/pages/admin/UserManagement/UserList.tsx',
  ),
  'utf8',
);

describe('Admin User Management reactivation action', () => {
  it('shows Reactivate for archived lifecycle-managed users', () => {
    expect(source).toContain(
      '{archived && lifecycleManaged && (',
    );
    expect(source).toContain('Reactivate');
    expect(source).toContain(
      'onReactivate(user)',
    );
  });

  it('routes reactivation through canonical adminUpdateUser with active status', () => {
    expect(source).toContain(
      "'adminUpdateUser'",
    );
    expect(source).toContain(
      "status: 'active'",
    );
    expect(source).toContain(
      'handleReactivateUser',
    );
  });

  it('keeps Edit disabled while the user is still archived', () => {
    expect(source).toContain(
      'disabled={!lifecycleManaged || archived}',
    );
  });
});
