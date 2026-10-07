import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  expect,
  it,
} from 'vitest';

const read = (relativePath: string) =>
  fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

const studentList = read(
  'src/pages/admin/StudentManagement/StudentList.tsx',
);
const enrollmentDetail = read(
  'src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx',
);

describe('Past Student reactivation workflow', () => {
  it('provides a direct Reactivate Student action using the canonical learner update callable', () => {
    expect(studentList).toContain('Reactivate Student');
    expect(studentList).toContain(
      "httpsCallable(\n        functions,\n        'adminUpdateStudent'",
    );
    expect(studentList).toContain("status: 'active'");
    expect(studentList).toContain('reactivate: true');
    expect(studentList).toContain(
      'Historical terminal enrollments were preserved.',
    );
    expect(studentList).toContain(
      "row.id === student.id",
    );
    expect(studentList).toContain(
      "? ({ ...row, status: 'active' } as Student)",
    );
    expect(studentList).toContain(
      "setStatusFilter('all')",
    );
  });

  it('blocks operational enrollment actions while the learner is still a Past Student', () => {
    expect(studentList).toContain(
      'disabled={!canManageActionsFor || actionsForIsPast}',
    );
    expect(studentList).toContain(
      "description: 'Only an Admin can reactivate a Past Student.'",
    );
  });

  it('does not offer resume or mark-active lifecycle controls for terminal enrollments', () => {
    expect(enrollmentDetail).toContain(
      'const enrollmentIsTerminal = new Set([',
    );
    expect(enrollmentDetail).toContain(
      "'discontinued'",
    );
    expect(enrollmentDetail).toContain(
      "'completed'",
    );
    expect(enrollmentDetail).toContain(
      'Historical enrollment — cannot be resumed',
    );
    expect(enrollmentDetail).toContain(
      'reactivate the student from Past Students and create a new enrollment',
    );
    expect(enrollmentDetail).toContain(
      '{enrollmentIsTerminal ? (',
    );
  });
});
