import type { Firestore } from 'firebase-admin/firestore';
import type {
  AttendanceValidationEvidenceDocument,
  AttendanceValidationEvidenceStore,
  AttendanceValidationRunDocument,
} from './teamsEvidenceCollector';

export const ATTENDANCE_VALIDATION_RUNS_COLLECTION = 'attendanceValidationRuns';
export const ATTENDANCE_VALIDATION_EVIDENCE_COLLECTION = 'attendanceValidationEvidence';

export class FirestoreAttendanceValidationEvidenceStore
implements AttendanceValidationEvidenceStore {
  constructor(private readonly db: Firestore) {}

  async saveCollectionResult(
    run: AttendanceValidationRunDocument,
    evidence: AttendanceValidationEvidenceDocument,
  ): Promise<void> {
    const batch = this.db.batch();
    const runRef = this.db.collection(ATTENDANCE_VALIDATION_RUNS_COLLECTION).doc(run.id);
    const evidenceRef = this.db
      .collection(ATTENDANCE_VALIDATION_EVIDENCE_COLLECTION)
      .doc(evidence.id);

    batch.set(runRef, run, { merge: true });
    batch.set(evidenceRef, evidence, { merge: true });
    await batch.commit();
  }
}
