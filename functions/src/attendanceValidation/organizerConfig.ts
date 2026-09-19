import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

export const ATTENDANCE_VALIDATION_CONFIG_COLLECTION =
  'attendanceValidationConfig';
export const ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC = 'teams';
export const AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT = 25;

export interface AvsOrganizerResolution {
  organizerUserId: string;
  source: 'config' | 'bootstrapped_from_evidence';
  firestoreReadCount: number;
  configWriteCount: number;
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

/**
 * Resolves the approved organizer without exposing it to browser code.
 *
 * Existing AV2 evidence already stores organizerUserId. If the dedicated
 * backend-only config is absent, we may bootstrap it only when a bounded
 * evidence sample proves exactly one non-empty organizer ID.
 */
export async function resolveAttendanceValidationOrganizerUserId(
  db: Firestore,
): Promise<AvsOrganizerResolution> {
  const configRef = db
    .collection(ATTENDANCE_VALIDATION_CONFIG_COLLECTION)
    .doc(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC);
  const configSnap = await configRef.get();
  const configured = configSnap.exists
    ? text(configSnap.data()?.organizerUserId)
    : null;

  if (configured) {
    return {
      organizerUserId: configured,
      source: 'config',
      firestoreReadCount: 1,
      configWriteCount: 0,
    };
  }

  const evidenceSnap = await db
    .collection('attendanceValidationEvidence')
    .orderBy('collectedAt', 'desc')
    .limit(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT)
    .get();

  const organizerIds = [
    ...new Set(
      evidenceSnap.docs
        .map((docSnapshot) => text(docSnapshot.data().organizerUserId))
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (organizerIds.length === 0) {
    throw new Error(
      'AVS Teams organizer is not configured and no prior evidence can bootstrap it.',
    );
  }

  if (organizerIds.length > 1) {
    throw new Error(
      'AVS Teams organizer is ambiguous across prior evidence; configure it explicitly.',
    );
  }

  const organizerUserId = organizerIds[0];
  await configRef.set({
    schemaVersion: 1,
    organizerUserId,
    source: 'bootstrapped_from_existing_av2_evidence',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    browserAccessAllowed: false,
  }, { merge: false });

  return {
    organizerUserId,
    source: 'bootstrapped_from_evidence',
    firestoreReadCount: 1 + evidenceSnap.size,
    configWriteCount: 1,
  };
}
