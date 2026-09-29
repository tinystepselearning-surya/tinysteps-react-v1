import * as admin from 'firebase-admin';
import { isDeepStrictEqual } from 'util';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ensureAdmin } from '../helpers/adminGuard';
import { exactAvsId } from './cachedGroupRevalidationCallable';
import { loadAvsBusinessGroupForSession } from './groupValidation';
import { sameDayGroupDescriptor } from './shadowRunner';

if (!admin.apps.length) admin.initializeApp();

export function verifiedReason(value: unknown): string {
  const reason = typeof value === 'string' ? value.trim() : '';
  if (reason.length < 5 || reason.length > 500) {
    throw new HttpsError('invalid-argument', 'A reason of 5 to 500 characters is required.');
  }
  return reason;
}

export async function verifyAvsGroupManually(db: FirebaseFirestore.Firestore, params: {
  classSessionId: string; kidId: string; reason: string; uid: string; name: string | null; email: string | null;
}) {
  const rows = await loadAvsBusinessGroupForSession(db, params.classSessionId, params.kidId);
  const descriptor = sameDayGroupDescriptor(String(rows[0].data.date), rows[0].data, null);
  if (!descriptor) throw new HttpsError('failed-precondition', 'Canonical business group is unavailable.');
  const sessionRefs = rows.map((row) => db.collection('classSessions').doc(row.id));
  const caseRefs = rows.map((row) => db.collection('attendanceValidationCases').doc(row.id));
  const resolutionRef = db.collection('attendanceValidationResolutions').doc();
  await db.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(...sessionRefs, ...caseRefs);
    if (snapshots.slice(0, rows.length).some((snap, index) => !snap.exists || !isDeepStrictEqual(snap.data(), rows[index].data))) {
      throw new HttpsError('aborted', 'Attendance changed during manual verification. Reload the group.');
    }
    const cases = snapshots.slice(rows.length).map((snap) => snap.data() as Record<string, unknown> | undefined);
    if (cases.some((item) => !item || !['false_present', 'false_absent'].includes(String(item.businessOutcome)))) {
      throw new HttpsError('failed-precondition', 'Only a complete unresolved AVS discrepancy can be marked verified.');
    }
    const sourceOutcome = String(cases[0]!.businessOutcome);
    const teamsCount = cases[0]!.teamsSupportedPresentCount;
    const tinyCount = cases[0]!.tinyStepsPresentCount;
    if (cases.some((item) => item!.businessOutcome !== sourceOutcome
      || item!.teamsSupportedPresentCount !== teamsCount || item!.tinyStepsPresentCount !== tinyCount)) {
      throw new HttpsError('failed-precondition', 'AVS group members disagree. Refresh Tiny Steps validation first.');
    }
    const resolvedAt = admin.firestore.FieldValue.serverTimestamp();
    transaction.create(resolutionRef, {
      schemaVersion: 1, decision: 'manual_verified', resolutionDecision: 'manual_verified',
      resolutionStatus: 'resolved', groupKey: descriptor.key,
      serviceDateYmd: descriptor.serviceDateYmd, kidId: descriptor.kidId,
      teacherId: descriptor.teacherId, caseIds: rows.map((row) => row.id),
      sourceBusinessOutcome: sourceOutcome, sourceTeamsSupportedPresentCount: teamsCount,
      sourceTinyStepsPresentCount: tinyCount,
      sourceInputFingerprints: cases.map((item) => item!.inputFingerprint ?? null),
      reason: params.reason, resolvedByUid: params.uid,
      resolvedByName: params.name, resolvedByEmail: params.email, resolvedAt,
    });
    cases.forEach((item, index) => transaction.update(caseRefs[index], {
      businessOutcome: 'verified', businessDifferenceCount: 0,
      resolutionStatus: 'resolved', resolutionDecision: 'manual_verified',
      resolutionId: resolutionRef.id, manualVerificationReason: params.reason,
      sourceBusinessOutcome: sourceOutcome,
      sourceTeamsSupportedPresentCount: teamsCount,
      sourceTinyStepsPresentCount: tinyCount,
      resolvedByUid: params.uid, resolvedByName: params.name,
      resolvedByEmail: params.email, resolvedAt,
    }));
  });
  return { ok: true, status: 'manual_verified', classSessionIds: rows.map((row) => row.id), resolutionId: resolutionRef.id };
}

export const adminVerifyAttendanceValidationGroup = onCall({
  region: 'asia-south1', memory: '256MiB', invoker: 'public',
  labels: { 'avs-public-invoker': 'true' }, timeoutSeconds: 120, maxInstances: 2,
}, async (request) => {
  await ensureAdmin(request.auth);
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in as an admin.');
  return verifyAvsGroupManually(admin.firestore(), {
    classSessionId: exactAvsId(request.data?.classSessionId, 'classSessionId'),
    kidId: exactAvsId(request.data?.kidId, 'kidId'),
    reason: verifiedReason(request.data?.reason), uid,
    name: typeof request.auth?.token?.name === 'string' ? request.auth.token.name : null,
    email: typeof request.auth?.token?.email === 'string' ? request.auth.token.email : null,
  });
});
