import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { canSkipTeacherEarningsRollupRecompute } from './helpers/teacherEarningsRollupDelta';
import { checkTeacherFinanceAnalyticsReadinessRow } from './helpers/teacherFinanceAnalyticsReadiness';
import { recomputeTeacherEarningsEventCoordinated } from './helpers/teacherEarningsCoordinatedRecompute';
import { tryApplyTeacherEarningsIncrementalEvent } from './helpers/teacherEarningsIncrementalExecutor';
import { TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION } from './helpers/teacherEarningsSessionCreateFastPath';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const ANALYTICS_PROJECTION_VERSION = 1;

type EarningImages = {
  earningId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

const readinessChecksFor = (input: EarningImages) => [
  checkTeacherFinanceAnalyticsReadinessRow(input.earningId, input.before),
  checkTeacherFinanceAnalyticsReadinessRow(input.earningId, input.after),
];

async function invalidateUnsafeAnalyticsProjection(input: EarningImages): Promise<boolean> {
  const checks = readinessChecksFor(input).filter((check) => check.relevant && !check.safe);
  if (checks.length === 0) return false;

  const db = admin.firestore();
  const batch = db.batch();
  const touchedRollups = new Set<string>();
  const touchedMonths = new Set<string>();
  const invalidReasons = Array.from(new Set(checks.flatMap((check) => check.reasons)));

  for (const check of checks) {
    if (check.teacherId && check.monthKey) {
      const key = `${check.teacherId}__${check.monthKey}`;
      if (!touchedRollups.has(key)) {
        touchedRollups.add(key);
        batch.set(db.collection('teachers').doc(check.teacherId).collection('earnings').doc(check.monthKey), {
          analyticsProjectionVersion: 0,
          analyticsProjectionInvalidReason: invalidReasons.join(','),
          analyticsProjectionInvalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    if (check.monthKey && !touchedMonths.has(check.monthKey)) {
      touchedMonths.add(check.monthKey);
      batch.set(db.collection('adminStats').doc('teacherFinanceAnalyticsProjection').collection('months').doc(check.monthKey), {
        monthKey: check.monthKey,
        ready: false,
        analyticsProjectionVersion: ANALYTICS_PROJECTION_VERSION,
        invalidReason: invalidReasons.join(','),
        invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'b6_teacher_earnings_readiness_guard',
      }, { merge: true });
      batch.set(db.collection('adminStats').doc('teacherEarningsSessionCreateFastPath').collection('months').doc(check.monthKey), {
        monthKey: check.monthKey,
        ready: false,
        certificationVersion: TEACHER_EARNINGS_SESSION_CREATE_CERTIFICATION_VERSION,
        invalidReason: `unsafe_teacher_earning_event:${invalidReasons.join(',')}`,
        invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'b6_brick_7d2b_runtime_invalidation_guard',
      }, { merge: true });
    }
  }

  await batch.commit();
  return true;
}

async function refreshCertifiedAnalyticsRollups(input: EarningImages): Promise<void> {
  const checks = readinessChecksFor(input);
  if (checks.some((check) => check.relevant && !check.safe)) return;
  const targets = new Map<string, { teacherId: string; monthKey: string }>();
  for (const check of checks) {
    if (!check.relevant || !check.safe || !check.teacherId || !check.monthKey) continue;
    targets.set(`${check.teacherId}__${check.monthKey}`, { teacherId: check.teacherId, monthKey: check.monthKey });
  }
  if (targets.size === 0) return;

  const db = admin.firestore();
  const monthKeys = Array.from(new Set(Array.from(targets.values()).map((target) => target.monthKey)));
  const readinessRefs = monthKeys.map((monthKey) => db.collection('adminStats').doc('teacherFinanceAnalyticsProjection').collection('months').doc(monthKey));
  const readinessSnaps = readinessRefs.length > 0 ? await db.getAll(...readinessRefs) : [];
  const readyMonths = new Set<string>();
  readinessSnaps.forEach((snap, index) => {
    const data = snap.exists ? (snap.data() || {}) : {};
    const version = Number(data.analyticsProjectionVersion);
    if (data.ready === true && Number.isFinite(version) && version >= ANALYTICS_PROJECTION_VERSION) readyMonths.add(monthKeys[index]);
  });
  if (readyMonths.size === 0) return;

  const batch = db.batch();
  let writeCount = 0;
  for (const target of targets.values()) {
    if (!readyMonths.has(target.monthKey)) continue;
    batch.set(db.collection('teachers').doc(target.teacherId).collection('earnings').doc(target.monthKey), {
      monthKey: target.monthKey,
      analyticsProjectionVersion: ANALYTICS_PROJECTION_VERSION,
      unclassifiedEarnings: 0,
      analyticsProjectionSource: 'b6_teacher_earnings_live_refresh_v1',
      analyticsProjectionRefreshedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    writeCount += 1;
  }
  if (writeCount > 0) await batch.commit();
}

/**
 * Brick 7D2B teacherEarnings monthly-rollup entry point.
 * A canonical session earning create is incremental only with a valid month-specific v2
 * certification read in the same transaction. Session deletes, uncertified/noncanonical session
 * creates, payout-state changes, teacher/month moves, archive toggles, missing/equal watermarks,
 * invalid totals, stale certifications, and marker conflicts retain authoritative recompute.
 */
export const onTeacherEarningsRollupWrite = onDocumentWritten(
  { document: 'teacherEarnings/{earningId}', region: REGION },
  async (event) => {
    const change = event.data;
    if (!change) return;
    const beforeData = change.before.exists ? ((change.before.data() || {}) as Record<string, unknown>) : null;
    const afterData = change.after.exists ? ((change.after.data() || {}) as Record<string, unknown>) : null;
    const earningId = String(event.params.earningId || '');
    const images: EarningImages = { earningId, before: beforeData, after: afterData };

    await invalidateUnsafeAnalyticsProjection(images);
    if (canSkipTeacherEarningsRollupRecompute({ earningId, before: beforeData, after: afterData })) return;

    const db = admin.firestore();
    const eventUpdateTime = change.after.exists ? change.after.updateTime : null;
    const incremental = await tryApplyTeacherEarningsIncrementalEvent({
      db, eventId: event.id, earningId, eventUpdateTime, before: beforeData, after: afterData,
    });
    if (incremental.mode === 'applied') return;
    if (incremental.mode === 'covered') {
      await refreshCertifiedAnalyticsRollups(images);
      return;
    }
    if (incremental.mode === 'replay') {
      if (incremental.previousOutcome === 'covered') await refreshCertifiedAnalyticsRollups(images);
      return;
    }
    if (incremental.mode === 'conflict') {
      console.error('teacher earnings incremental marker conflict; forcing authoritative recompute', {
        earningId, eventId: event.id, reason: incremental.reason,
      });
    }
    const recompute = await recomputeTeacherEarningsEventCoordinated({ db, eventId: event.id, before: beforeData, after: afterData });
    if (recompute.allFinalized) await refreshCertifiedAnalyticsRollups(images);
  },
);
