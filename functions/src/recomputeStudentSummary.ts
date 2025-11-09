import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface RecomputeSummaryRequest {
  kidId: string;
  courseId: string;
}

interface StudentSummary {
  phonicsMastery: number;
  grammarMastery: number;
  speakingMastery: number;
  attendanceRate30d: number;
  sessionsCompletedMTD: number;
  worksheetsDone: number;
  lastUpdated: admin.firestore.FieldValue;
}

export const recomputeStudentSummary = functions.https.onCall(
  async (data, context) => {
    const { kidId, courseId } = data as RecomputeSummaryRequest;

    if (!kidId || !courseId) {
      throw new functions.https.HttpsError('invalid-argument', 'kidId and courseId are required');
    }

    try {
      // Fetch all progress docs for kid and course
      const progressQuery = await admin.firestore()
        .collection('progress')
        .where('kidId', '==', kidId)
        .where('courseId', '==', courseId)
        .get();

      const areas: { [key: string]: number[] } = { phonics: [], grammar: [], speaking: [] };

      progressQuery.forEach(doc => {
        const data = doc.data();
        const area = data.area;
        const score = data.score;
        if (areas[area]) {
          const mastery = getMasteryFromScore(score);
          areas[area].push(mastery);
        }
      });

      const summary: StudentSummary = {
        phonicsMastery: Math.round(areas.phonics.reduce((a, b) => a + b, 0) / areas.phonics.length) || 0,
        grammarMastery: Math.round(areas.grammar.reduce((a, b) => a + b, 0) / areas.grammar.length) || 0,
        speakingMastery: Math.round(areas.speaking.reduce((a, b) => a + b, 0) / areas.speaking.length) || 0,
        attendanceRate30d: 0,
        sessionsCompletedMTD: 0,
        worksheetsDone: 0,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      // Calculate attendance rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sessionsQuery = await admin.firestore()
        .collection('sessions')
        .where('kidIds', 'array-contains', kidId)
        .where('date', '>=', thirtyDaysAgo.toISOString().split('T')[0])
        .get();

      let totalSessions = 0;
      let presentSessions = 0;

      for (const sessionDoc of sessionsQuery.docs) {
        const sessionId = sessionDoc.id;
        const attendanceDoc = await admin.firestore()
          .collection('attendance')
          .doc(sessionId)
          .collection('attendanceRecords')
          .doc(kidId)
          .get();

        if (attendanceDoc.exists) {
          totalSessions++;
          if (attendanceDoc.data()?.status === 'present') {
            presentSessions++;
          }
        }
      }

      summary.attendanceRate30d = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

      // Sessions completed MTD
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const mtdSessionsQuery = await admin.firestore()
        .collection('sessions')
        .where('kidIds', 'array-contains', kidId)
        .where('status', '==', 'completed')
        .where('date', '>=', startOfMonth.toISOString().split('T')[0])
        .get();

      summary.sessionsCompletedMTD = mtdSessionsQuery.size;

      // Worksheets done
      const worksheetsQuery = await admin.firestore()
        .collection('activities')
        .where('kidId', '==', kidId)
        .where('status', '==', 'completed')
        .get();

      summary.worksheetsDone = worksheetsQuery.size;

      // Write to kids/{kidId}
      await admin.firestore().collection('kids').doc(kidId).update({
        summary,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'recomputeStudentSummary'
      });

      functions.logger.info(`Summary updated: kidId=${kidId}, phonics=${summary.phonicsMastery}, grammar=${summary.grammarMastery}, speaking=${summary.speakingMastery}`);

      return { success: true, summary };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      functions.logger.error(`Error in recomputeStudentSummary: ${errorMessage}`, { kidId, courseId });
      throw new functions.https.HttpsError('internal', 'Failed to recompute student summary');
    }
  }
);

function getMasteryFromScore(score: number): number {
  if (score >= 90) return 100;
  if (score >= 80) return 80;
  if (score >= 70) return 60;
  if (score >= 60) return 40;
  return 20;
}