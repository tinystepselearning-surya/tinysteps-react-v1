import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const enrollmentListSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/EnrollmentManagement/EnrollmentsList.tsx'),
  'utf8',
);
const studentEditSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/EditStudentForm.tsx'),
  'utf8',
);

describe('admin lifecycle routing', () => {
  it('does not directly write enrollment status transitions from the enrollment list', () => {
    expect(enrollmentListSource).not.toMatch(
      /updateDoc\(doc\(db, ['"]enrollments['"][\s\S]{0,500}?status\s*:/,
    );
    expect(enrollmentListSource).not.toMatch(
      /batch\.update\(doc\(db, ['"]enrollments['"][\s\S]{0,500}?status\s*:/,
    );
    expect(enrollmentListSource).toContain("httpsCallable(functions, 'setEnrollmentStatus')");
  });

  it('routes the student archive transition through archiveKid', () => {
    expect(studentEditSource).toContain("httpsCallable(functions, 'archiveKid')");
    expect(studentEditSource).toContain("...(!isArchiveTransition ? { status } : {})");
  });
});
