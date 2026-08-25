import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { canSkipTeacherEarningsRollupRecompute } from './helpers/teacherEarningsRollupDelta';
import { checkTeacherFinanceAnalyticsReadinessRow } from './helpers/teacherFinanceAnalyticsReadiness';
import {
  onTeacherEarningsRollupWrite as authoritativeTeacherEarningsRollupWrite,
} from './revenue';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';

async function invalidateUnsafeAnalyticsProjection(input: {
  earningId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): Promise<void> {
  const checks = [
    checkTeacherFinanceAnalyticsReadinessRow(input.earningId, input.before),
    checkTeacherFinanceAnalyticsReadinessRow(input.earningId, input.after),
  ].filter((check) => check.relevant && !check.safe);

  if (checks.length === 0) return;

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
        batch.set(
          db.collection('teachers').doc(check.teacherId).collection('earnings').doc(check.monthKey),
          {
            analyticsProjectionVersion: 0,
            analyticsProjectionInvalidReason: invalidReasons.join(','),
            analyticsProjectionInvalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    }

    if (check.monthKey && !touchedMonths.has(check.monthKey)) {
      touchedMonths.add(check.monthKey);
      batch.set(
        db
          .collection('adminStats')
          .doc('teacherFinanceAnalyticsProjection')
          .collection('months')
          .doc(check.monthKey),
        {
          monthKey: check.monthKey,
          ready: false,
          analyticsProjectionVersion: 1,
          invalidReason: invalidReasons.join(','),
          invalidatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'b6_teacher_earnings_readiness_guard',
        },
        { merge: true },
      );
    }
  }

  await batch.commit();
}

/**
 * Read-optimized entry point for the teacherEarnings monthly rollup.
 *
 * Only proven metadata-only updates are suppressed here. Every create/delete, finance-changing,
 * payout-related, legacy, moved, or ambiguous event delegates to the existing authoritative
 * revenue handler unchanged.
 *
 * B6 Brick 6B1 additionally invalidates a previously prepared Analytics projection only when an
 * active earning is noncanonical, unclassified, or otherwise unsafe. Canonical session/demo
 * events add no extra Firestore write here; the authoritative rollup continues to refresh totals.
 */
export const onTeacherEarningsRollupWrite = onDocumentWritten(
  {
    document: 'teacherEarnings/{earningId}',
    region: REGION,
  },
  async (event) => {
    const change = event.data;
    if (change) {
      const beforeData = change.before.exists
        ? ((change.before.data() || {}) as Record<string, unknown>)
        : null;
      const afterData = change.after.exists
        ? ((change.after.data() || {}) as Record<string, unknown>)
        : null;
      const earningId = String(event.params.earningId || '');

      await invalidateUnsafeAnalyticsProjection({
        earningId,
        before: beforeData,
        after: afterData,
      });

      if (
        canSkipTeacherEarningsRollupRecompute({
          earningId,
          before: beforeData,
          after: afterData,
        })
      ) {
        return;
      }
    }

    return authoritativeTeacherEarningsRollupWrite.run(event);
  },
);
