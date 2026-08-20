import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const studentManagementSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/StudentManagementTab.tsx'),
  'utf8',
);
const sidebarSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/components/Sidebar.tsx'),
  'utf8',
);
const headerSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/components/Header.tsx'),
  'utf8',
);
const enrollmentDetailSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx'),
  'utf8',
);
const assignTeacherSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/AssignTeacherModal.tsx'),
  'utf8',
);

describe('unified student and enrollment management', () => {
  it('exposes Students and Enrollments as two views of one workspace', () => {
    expect(studentManagementSource).toContain("type ManagementView = 'students' | 'enrollments'");
    expect(studentManagementSource).toContain("import EnrollmentsList from '../EnrollmentManagement/EnrollmentsList'");
    expect(studentManagementSource).toContain('Students & Enrollments');
    expect(studentManagementSource).toContain("switchView('students')");
    expect(studentManagementSource).toContain("switchView('enrollments')");
    expect(studentManagementSource).toContain('<EnrollmentsList reloadKey={refreshKey} />');
  });

  it('turns the reconciliation summary into actionable, plain-language controls', () => {
    expect(studentManagementSource).toContain('type SummaryFocus =');
    expect(studentManagementSource).toContain("label: 'Enrolled Students'");
    expect(studentManagementSource).toContain("label: 'Active Enrollments'");
    expect(studentManagementSource).toContain("label: 'Without Enrollment'");
    expect(studentManagementSource).toContain('student counts are unique profiles; enrollment counts are course-registration records');
    expect(studentManagementSource).toContain('aria-pressed={selected}');
    expect(studentManagementSource).toContain("focus: 'without-enrollment'");
  });

  it('provides direct lifecycle-safe actions for students who need enrollment review', () => {
    expect(studentManagementSource).toContain('Students Needing Enrollment Review');
    expect(studentManagementSource).toContain("'Create enrollment'");
    expect(studentManagementSource).toContain("'Add enrollment'");
    expect(studentManagementSource).toContain('Manage enrollment');
    expect(studentManagementSource).toContain('EnrollmentDetailView');
    expect(studentManagementSource).toContain('Historical records are preserved.');
  });

  it('removes the duplicate desktop Enrollment Management navigation entry', () => {
    expect(sidebarSource).toContain("{ id: 'students', label: 'Students & Enrollments'");
    expect(sidebarSource).not.toContain("{ id: 'enrollments', label: 'Enrollment Management'");
    expect(headerSource).toContain("students: 'Students & Enrollments'");
    expect(headerSource).toContain("enrollments: 'Students & Enrollments'");
  });

  it('archives student records instead of hard-deleting canonical child history', () => {
    expect(studentManagementSource).not.toContain("from '../../../services/kidsService'");
    expect(studentManagementSource).not.toContain('deleteKid(');
    expect(studentManagementSource).toContain("httpsCallable(functions, 'archiveKid')");
    expect(studentManagementSource).toContain('Historical enrollments, schedules, attendance, payments, earnings and audit history will be preserved.');
  });

  it('keeps teacher reassignment and course changes on lifecycle-safe backend callables', () => {
    expect(assignTeacherSource).toContain("httpsCallable(functions, 'reassignEnrollmentTeacher')");
    expect(enrollmentDetailSource).toContain("httpsCallable(functions, 'transitionEnrollmentCourse')");
    expect(enrollmentDetailSource).toContain('Historical records were preserved.');
    expect(studentManagementSource).toContain('teacher reassignment updates eligible future classes only');
    expect(studentManagementSource).toContain('creates a linked next enrollment');
  });
});
