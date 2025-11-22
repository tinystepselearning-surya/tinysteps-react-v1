import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

if (!admin.apps.length) admin.initializeApp();

export const onEnrollmentUpdate = functions
  .region('asia-south1')
  .firestore.document('enrollments/{enrollmentId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const enrollmentId = context.params.enrollmentId;

    const beforeTeacher = before.teacherId || null;
    const afterTeacher = after.teacherId || null;

    // If teacher didn't change, nothing to do
    if (beforeTeacher === afterTeacher) {
      return;
    }

    // Determine student id (inconsistent naming across code: studentId or kidId)
    const studentId =
      after.studentId ||
      after.kidId ||
      before.studentId ||
      before.kidId ||
      null;

    if (!studentId) {
      functions.logger.warn(
        `onEnrollmentUpdate: enrollment ${enrollmentId} has no studentId/kidId to update`
      );
      return;
    }

    const db = admin.firestore();
    const kidRef = db.collection('kids').doc(studentId);

    try {
      // If there was a previous teacher, remove it
      if (beforeTeacher) {
        await kidRef.update({
          teacherIds: admin.firestore.FieldValue.arrayRemove(beforeTeacher),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as any);
        functions.logger.info(
          `onEnrollmentUpdate: removed prior teacher ${beforeTeacher} from student ${studentId}`
        );
      }

      // If there's a new teacher, add it
      if (afterTeacher) {
        await kidRef.update({
          teacherIds: admin.firestore.FieldValue.arrayUnion(afterTeacher),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        } as any);
        functions.logger.info(
          `onEnrollmentUpdate: added teacher ${afterTeacher} to student ${studentId}`
        );
      }
    } catch (err: any) {
      functions.logger.error('onEnrollmentUpdate failed', {
        enrollmentId,
        studentId,
        error: err?.message || String(err),
      });
    }
  });
