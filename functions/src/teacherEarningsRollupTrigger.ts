import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { canSkipTeacherEarningsRollupRecompute } from './helpers/teacherEarningsRollupDelta';
import {
  onTeacherEarningsRollupWrite as authoritativeTeacherEarningsRollupWrite,
} from './revenue';

const REGION = 'asia-south1';

/**
 * Read-optimized entry point for the teacherEarnings monthly rollup.
 *
 * Only proven metadata-only updates are suppressed here. Every create/delete, finance-changing,
 * payout-related, legacy, moved, or ambiguous event delegates to the existing authoritative
 * revenue handler unchanged.
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

      if (
        canSkipTeacherEarningsRollupRecompute({
          earningId: String(event.params.earningId || ''),
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
