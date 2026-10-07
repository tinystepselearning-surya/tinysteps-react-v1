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
    'src/pages/admin/StudentManagement/EditStudentForm.tsx',
  ),
  'utf8',
);

describe('Admin student reactivation UI', () => {
  it('recognizes archived to active as reactivation', () => {
    expect(source).toContain(
      "status === 'active' &&",
    );
    expect(source).toContain(
      "student.status === 'archived'",
    );
    expect(source).toContain(
      'reactivate: isReactivationTransition',
    );
  });

  it('keeps archive on the dedicated archiveKid workflow', () => {
    expect(source).toContain(
      "httpsCallable(functions, 'archiveKid')",
    );
    expect(source).toContain(
      'status: isArchiveTransition ? null : status',
    );
  });

  it('confirms successful reactivation to the admin', () => {
    expect(source).toContain(
      "'Student reactivated'",
    );
    expect(source).toContain(
      "'Student restored to Active successfully.'",
    );
  });
});
