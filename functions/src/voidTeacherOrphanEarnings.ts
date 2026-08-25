import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { ensureAdmin } from './helpers/adminGuard';
import { evaluateTeacherOrphanEarning } from './helpers/teacherOrphanEarnings';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

/**
 * B6 Brick 4.
 *
 * Admin-only orphan earning correction scoped to exactly one teacher-month.
 * The historical implementation accepted monthKey but queried every earning for the teacher.
 * This callable preserves the same orphan/paid/attendance safety semantics while making the
 * Firestore read itself canonical and month-bounded.
 */
export const voidTeacherOrphanEarnings = onCall(
  {
    region: REGION,
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    await ensureAdmin(request.auth);

    const teacherId = String(request.data?.teacherId || '').trim();
    const monthKey = String(request.data?.monthKey || '').trim();
    const note =
      typeof request.data?.note === 'string'
        ? request.data.note.trim().slice(0, 300)
        : '';

    if (!teacherId) {
      throw new HttpsError('invalid-argument', 'teacherId is required');
    }
    if (!/^\d{4}-\d{2}$/.test(monthKey)) {
      throw new HttpsError('invalid-argument', 'monthKey must be in YYYY-MM format');
    }

    const db = admin.firestore();
    const earningsQuery = db
      .collection('teacherEarnings')
      .where('teacherId', '==', teacherId)
      .where('monthKey', '==', monthKey);

    const result = await db.runTransaction(async (tx) => {
      const earningsSnap = await tx.get(earningsQuery);
      const earnings = earningsSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ref: docSnap.ref,
          data: docSnap.data() || {},
        }))
        .filter(
          (earning) =>
            String(earning.data.teacherId || '').trim() === teacherId &&
            String(earning.data.monthKey || '').trim() === monthKey,
        );

      const sessionIds = Array.from(
        new Set(
          earnings
            .map((earning) => String(earning.data.sessionId || '').trim())
            .filter(Boolean),
        ),
      );
      const sessionSnaps = new Map<string, FirebaseFirestore.DocumentSnapshot>();
      for (const sessionId of sessionIds) {
        const snap = await tx.get(db.collection('classSessions').doc(sessionId));
        sessionSnaps.set(sessionId, snap);
      }

      let orphanCount = 0;
      let voidedCount = 0;
      let skippedPaidCount = 0;
      let skippedAlreadyVoidCount = 0;
      const voidedIds: string[] = [];
      const skippedPaidIds: string[] = [];

      for (const earning of earnings) {
        const sessionId = String(earning.data.sessionId || '').trim();
        const sessionSnap = sessionId ? sessionSnaps.get(sessionId) : undefined;
        const sessionData = sessionSnap?.exists ? sessionSnap.data() || {} : null;
        const evaluation = evaluateTeacherOrphanEarning({
          earning: earning.data,
          sessionExists: Boolean(sessionSnap?.exists),
          sessionData,
        });

        if (evaluation.skipReason === 'already_void') {
          skippedAlreadyVoidCount += 1;
          continue;
        }

        if (!evaluation.orphan) {
          continue;
        }

        orphanCount += 1;

        if (!evaluation.voidable) {
          if (evaluation.skipReason === 'paid_or_settled') {
            skippedPaidCount += 1;
            skippedPaidIds.push(earning.id);
          }
          continue;
        }

        tx.set(
          earning.ref,
          {
            status: 'void',
            voidedAt: FieldValue.serverTimestamp(),
            voidReason: note || 'Admin correction: orphan/invalid session earning',
            correctedBy: request.auth?.uid || null,
            correctedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        voidedCount += 1;
        voidedIds.push(earning.id);
      }

      return {
        checkedCount: earnings.length,
        orphanCount,
        voidedCount,
        skippedPaidCount,
        skippedAlreadyVoidCount,
        voidedIds,
        skippedPaidIds,
      };
    });

    logger.info('Admin voided orphan teacher earnings', {
      teacherId,
      monthKey,
      checkedCount: result.checkedCount,
      orphanCount: result.orphanCount,
      voidedCount: result.voidedCount,
      skippedPaidCount: result.skippedPaidCount,
      actorUid: request.auth?.uid || null,
      queryScope: 'teacher_month',
    });

    return {
      ok: true,
      teacherId,
      monthKey,
      ...result,
    };
  },
);
