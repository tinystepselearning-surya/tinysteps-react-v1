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

  it('keeps course progression recoverable while presenting simple defaults with optional overrides', () => {
    expect(enrollmentDetailSource).toContain("httpsCallable(functions, 'transitionEnrollmentCourse')");
    expect(enrollmentDetailSource).toContain('Move to Next Course');
    expect(enrollmentDetailSource).toContain('By default, the current teacher, class schedule, rates and class link continue automatically.');
    expect(enrollmentDetailSource).toContain("getDocs(collection(db, 'courses'))");
    expect(enrollmentDetailSource).toContain("where('role', '==', 'teacher')");
    expect(enrollmentDetailSource).toContain('Change teacher for next course');
    expect(enrollmentDetailSource).toContain('Use a different class link');
    expect(enrollmentDetailSource).toContain('const newSchedule = enrollment.schedule;');
    expect(enrollmentDetailSource).toContain('const operationId = `course-transition-${String(enrollment.id || enrollmentId).trim()}`;');
    expect(enrollmentDetailSource).not.toContain('crypto.randomUUID()');
    expect(enrollmentDetailSource).toContain("httpsCallable(functions, 'repairEnrollmentFutureSessionsFromSchedule')");
    expect(enrollmentDetailSource).toContain('inheritedFields.joinUrl = nextClassLink.trim()');
    expect(enrollmentDetailSource).toContain('inheritedFields.meetingLink = nextClassLink.trim()');
    expect(enrollmentDetailSource).toContain('inheritedFields.classLink = nextClassLink.trim()');
    expect(enrollmentDetailSource).not.toContain("window.prompt('Next canonical course ID?')");
    expect(enrollmentDetailSource).not.toContain("window.prompt('Next teacher user ID?')");
    expect(enrollmentDetailSource).not.toContain('Next schedule JSON');
    expect(enrollmentDetailSource).not.toContain('Transition operation ID');
  });
});
