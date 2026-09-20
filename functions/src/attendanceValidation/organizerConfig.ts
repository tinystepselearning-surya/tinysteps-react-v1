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

export type AvsOrganizerResolutionFailureReason =
  | 'organizer_config_invalid'
  | 'organizer_identity_unresolved'
  | 'organizer_identity_ambiguous';

export class AvsOrganizerResolutionError extends Error {
  constructor(
    readonly reason: AvsOrganizerResolutionFailureReason,
    readonly firestoreReadCount: number,
  ) {
    super(reason);
    this.name = 'AvsOrganizerResolutionError';
  }
}

export function isMicrosoftEntraObjectId(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      .test(value.trim());
}

function canonicalObjectId(value: unknown): string | null {
  return isMicrosoftEntraObjectId(value) ? value.trim().toLowerCase() : null;
}

/**
 * Resolves the approved organizer without exposing it to browser code.
 *
 * Existing AV2 evidence already stores organizerUserId. If the dedicated
 * backend-only config is absent, we may bootstrap it only when a bounded
 * evidence sample proves exactly one valid Entra object ID.
 */
export async function resolveAttendanceValidationOrganizerUserId(
  db: Firestore,
): Promise<AvsOrganizerResolution> {
  const configRef = db
    .collection(ATTENDANCE_VALIDATION_CONFIG_COLLECTION)
    .doc(ATTENDANCE_VALIDATION_TEAMS_CONFIG_DOC);
  const configSnap = await configRef.get();
  const configured = configSnap.exists
    ? canonicalObjectId(configSnap.data()?.organizerUserId)
    : null;

  if (configured) {
    return {
      organizerUserId: configured,
      source: 'config',
      firestoreReadCount: 1,
      configWriteCount: 0,
    };
  }

  if (configSnap.exists) {
    throw new AvsOrganizerResolutionError('organizer_config_invalid', 1);
  }

  const evidenceSnap = await db
    .collection('attendanceValidationEvidence')
    .orderBy('collectedAt', 'desc')
    .limit(AVS_ORGANIZER_BOOTSTRAP_EVIDENCE_LIMIT)
    .get();

  const organizerIds = [
    ...new Set(
      evidenceSnap.docs
        .map((docSnapshot) =>
          canonicalObjectId(docSnapshot.data().organizerUserId),
        )
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  if (organizerIds.length === 0) {
    throw new AvsOrganizerResolutionError(
      'organizer_identity_unresolved',
      1 + evidenceSnap.size,
    );
  }

  if (organizerIds.length > 1) {
    throw new AvsOrganizerResolutionError(
      'organizer_identity_ambiguous',
      1 + evidenceSnap.size,
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
