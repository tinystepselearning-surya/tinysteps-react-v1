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
const studentListSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/StudentList.tsx'),
  'utf8',
);
const sessionsManagementSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/TodaysNotifications.tsx'),
  'utf8',
);
const createEnrollmentSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/EnrollmentManagement/CreateEnrollmentForm.tsx'),
  'utf8',
);
const assignCourseSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/AssignCourseModal.tsx'),
  'utf8',
);
const enrollmentDetailSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/EnrollmentManagement/EnrollmentDetailView.tsx'),
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

  it('routes admin manual session creation and cancellation through lifecycle callables', () => {
    const createHandler = studentListSource.slice(
      studentListSource.indexOf('async function handleCreateAdHocSession'),
      studentListSource.indexOf('async function handleApproveRequest'),
    );
    expect(createHandler).toContain("httpsCallable(functions, 'createAdminManualSession')");
    expect(createHandler).not.toContain("httpsCallable(getFunctions(), 'createAdminManualSession')");
    expect(createHandler).not.toContain('setDoc(');
    expect(sessionsManagementSource).toContain("httpsCallable(getFunctions(), 'cancelAdminManualSession')");
  });

  it('routes enrollment creation through explicit first/additional intent and the admission wizard', () => {
    expect(createEnrollmentSource).toContain('createEnrollment({');
    expect(assignCourseSource).toContain('createEnrollment({');
    expect(createEnrollmentSource).toContain("creationIntent: 'initial_course'");
    expect(assignCourseSource).toContain('creationIntent,');
    expect(assignCourseSource).toContain("type WizardStep = 1 | 2 | 3 | 4 | 5");
    expect(assignCourseSource).toContain("Course");
    expect(assignCourseSource).toContain("Fees");
    expect(assignCourseSource).toContain("Teacher");
    expect(assignCourseSource).toContain("Schedule");
    expect(assignCourseSource).toContain("Review");
    expect(assignCourseSource).toContain("Save & Exit");
    expect(assignCourseSource).toContain("Save Teacher & Exit");
    expect(assignCourseSource).toContain("Save Schedule & Exit");
    expect(assignCourseSource).toContain("saveTeacherAndContinue(true)");
    expect(assignCourseSource).toContain("saveScheduleAndContinue(true)");
    expect(assignCourseSource).toContain("reassignEnrollmentTeacher");
    expect(assignCourseSource).toContain("saveRollingEnrollmentSchedule");
    expect(createEnrollmentSource).not.toContain("setDoc(enrollmentRef");
    expect(assignCourseSource).not.toContain("setDoc(enrollmentRef");
  });

  it('requires explicit progression or correction and keeps transition continuity server-authoritative', () => {
    expect(enrollmentDetailSource).toContain("httpsCallable(functions, 'transitionEnrollmentCourse')");
    expect(enrollmentDetailSource).toContain("Course completed — move to next course");
    expect(enrollmentDetailSource).toContain("Wrong course assigned — correct admission");
    expect(enrollmentDetailSource).toContain("transitionType === 'progression'");
    expect(enrollmentDetailSource).toContain("transitionType === 'correction'");
    expect(enrollmentDetailSource).toContain('transitionType,');
    expect(enrollmentDetailSource).toContain('joinUrl: nextClassLink || null');
    expect(enrollmentDetailSource).toContain('Use a new Teams link');
    expect(enrollmentDetailSource).toContain('Keep existing Teams link');
    expect(enrollmentDetailSource).toContain('const newSchedule = enrollment.schedule;');
    expect(enrollmentDetailSource).toContain('const operationId = `course-${transitionType}-');
    expect(enrollmentDetailSource).not.toContain("httpsCallable(functions, 'repairEnrollmentFutureSessionsFromSchedule')");
    expect(enrollmentDetailSource).not.toContain('inheritedFields.joinUrl');
    expect(enrollmentDetailSource).not.toContain("window.prompt('Next canonical course ID?')");
    expect(enrollmentDetailSource).not.toContain("window.prompt('Next teacher user ID?')");
  });

});
