import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

if (!admin.apps.length) admin.initializeApp();

export const onEnrollmentUpdate = functions
  .region('asia-south1')
  .firestore.document('enrollments/{enrollmentId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const enrollmentId = context.params.enrollmentId;

      const beforeTeacher = before?.teacherId || null;
      const afterTeacher = after?.teacherId || null;

      // Determine student id (inconsistent naming across code: studentId or kidId)
      const studentId = after?.studentId || after?.kidId || before?.studentId || before?.kidId || null;
      if (!studentId) {
        functions.logger.warn(`Enrollment ${enrollmentId} has no studentId/kidId to update`);
        return;
      }

      const kidRef = admin.firestore().collection('kids').doc(studentId);

      // If teacher changed, update the kid's teacherIds array accordingly
      if (beforeTeacher && beforeTeacher !== afterTeacher) {
        await kidRef.update({
          teacherIds: admin.firestore.FieldValue.arrayRemove(beforeTeacher),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as any);
        functions.logger.info(`Removed prior teacher ${beforeTeacher} from student ${studentId}`);
      }

      if (afterTeacher && beforeTeacher !== afterTeacher) {
        await kidRef.update({
          teacherIds: admin.firestore.FieldValue.arrayUnion(afterTeacher),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as any);
        functions.logger.info(`Added teacher ${afterTeacher} to student ${studentId}`);
      }

    } catch (err: any) {
      functions.logger.error('onEnrollmentUpdate failed', { err });
    }
  });
