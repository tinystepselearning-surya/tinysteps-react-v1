import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import {
  ATTENDANCE_VALIDATION_DIRTY_START_YMD,
  markAttendanceValidationDirtySession,
  resolveAttendanceValidationServiceDateYmd,
} from './dirtySessionMarker';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function currentIstYmd(now: Date): string {
  return new Date(now.getTime() + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

export function shouldMarkCreatedClassSessionDirty(
  session: Record<string, unknown>,
  now: Date = new Date(),
): boolean {
  const serviceDateYmd =
    resolveAttendanceValidationServiceDateYmd(session);
  if (!serviceDateYmd) return false;

  return (
    serviceDateYmd >= ATTENDANCE_VALIDATION_DIRTY_START_YMD
    && serviceDateYmd < currentIstYmd(now)
  );
}

/**
 * Late-created historical/ad-hoc/backfilled sessions must enter the AVS dirty
 * queue even when their date range was already baselined. Future/today
 * scheduled materialization is intentionally ignored to avoid unnecessary
 * AVS sidecar writes.
 */
export const onAttendanceValidationHistoricalSessionCreated =
  onDocumentCreated(
    {
      document: 'classSessions/{sessionId}',
      region: REGION,
    },
    async (event) => {
      const snapshot = event.data;
      if (!snapshot) return;

      const session =
        (snapshot.data() || {}) as Record<string, unknown>;
      if (!shouldMarkCreatedClassSessionDirty(session)) return;

      const sessionId = String(event.params.sessionId || '').trim();
      if (!sessionId) return;

      const result = await markAttendanceValidationDirtySession(
        admin.firestore(),
        {
          sessionId,
          session,
          reason: 'historical_session_created',
        },
      );

      if (result.written) {
        logger.info(
          'AVS queued newly created historical class session',
          {
            sessionId,
            serviceDateYmd: result.serviceDateYmd,
          },
        );
      }
    },
  );
