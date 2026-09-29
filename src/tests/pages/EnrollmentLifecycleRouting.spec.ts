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
const admissionSetupSource = readFileSync(
  join(process.cwd(), 'src/pages/admin/StudentManagement/AdmissionSetupWizard.tsx'),
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

  it('routes both enrollment creation UIs through the centralized backend invariant', () => {
    expect(createEnrollmentSource).toContain('createEnrollment({');
    expect(assignCourseSource).toContain('createEnrollment({');
    expect(createEnrollmentSource).toContain("from '../../../lib/createEnrollmentCallable'");
    expect(assignCourseSource).toContain("from '../../../lib/createEnrollmentCallable'");
    expect(createEnrollmentSource).not.toContain("setDoc(enrollmentRef");
    expect(assignCourseSource).not.toContain("setDoc(enrollmentRef");
    expect(assignCourseSource).toContain('disabled={!canAssign || saving || !selected || coursesLoading}');
    expect(assignCourseSource).toContain("description: 'Course assigned to student.'");
    expect(assignCourseSource.indexOf('onAssigned?.()')).toBeGreaterThan(
      assignCourseSource.indexOf("description: 'Course assigned to student.'"),
    );
    expect(assignCourseSource.indexOf('onClose();')).toBeGreaterThan(assignCourseSource.indexOf('onAssigned?.()'));
    expect(assignCourseSource).toContain('getCreateEnrollmentErrorMessage(err)');
  });

  it('keeps course changes explicit, idempotent, and server-authoritative', () => {
    expect(enrollmentDetailSource).toContain("httpsCallable(functions, 'transitionEnrollmentCourse')");
    expect(enrollmentDetailSource).toContain('Change Course');
    expect(enrollmentDetailSource).toContain("courseTransitionType === 'progression'");
    expect(enrollmentDetailSource).toContain("courseTransitionType === 'correction'");
    expect(enrollmentDetailSource).toContain('Wrong course assigned — correct it');
    expect(enrollmentDetailSource).toContain('Course completed — move forward');
    expect(enrollmentDetailSource).toContain('const newSchedule = enrollment.schedule;');
    expect(enrollmentDetailSource).toContain('const operationId = `course-${courseTransitionType}-${String(enrollment.id || enrollmentId).trim()}-${newCourseId}`;');
    expect(enrollmentDetailSource).toContain('transitionType: courseTransitionType');
    expect(enrollmentDetailSource).toContain('joinUrl: nextClassLink || null');
    expect(enrollmentDetailSource).not.toContain("httpsCallable(functions, 'repairEnrollmentFutureSessionsFromSchedule')");
    expect(enrollmentDetailSource).not.toContain('inheritedFields.joinUrl');
    expect(enrollmentDetailSource).not.toContain("window.prompt('Next canonical course ID?')");
  });

  it('keeps incomplete admissions non-operational until final schedule activation', () => {
    expect(admissionSetupSource).toContain("setupPending: true");
    expect(admissionSetupSource).toContain("httpsCallable(regionalFunctions, 'updateEnrollmentFinancialTerms')");
    expect(admissionSetupSource).toContain("httpsCallable(regionalFunctions, 'saveEnrollmentSetupDraft')");
    expect(admissionSetupSource).toContain("httpsCallable(regionalFunctions, 'reassignEnrollmentTeacher')");
    expect(admissionSetupSource).toContain("httpsCallable(regionalFunctions, 'saveRollingEnrollmentSchedule')");
    expect(admissionSetupSource).toContain('Save & Exit');
    expect(admissionSetupSource).toContain('Complete Setup');
  });
});
