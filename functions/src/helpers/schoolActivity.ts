import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

export type SchoolActivityType =
  | 'academic_year_created'
  | 'academic_year_changed'
  | 'grade_saved'
  | 'grade_status_changed'
  | 'section_saved'
  | 'section_status_changed'
  | 'teacher_saved'
  | 'teacher_status_changed'
  | 'curriculum_progress_updated'
  | 'teacher_training_updated'
  | 'review_recorded'
  | 'assessment_recorded';

export interface SchoolActivityInput {
  schoolRef: admin.firestore.DocumentReference;
  schoolId: string;
  actorUid: string;
  actorKind: 'admin' | 'learningPartner';
  type: SchoolActivityType;
  summary: string;
  academicYearId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Operational audit trail for the School Partnership programme.
 *
 * The primary domain mutation has already been validated before this helper is
 * called. Activity logging is intentionally best-effort rather than causing a
 * successful academic mutation to be reported as failed if the audit write has
 * a transient problem. Errors are still emitted to Cloud Logging.
 */
export async function appendSchoolActivity(input: SchoolActivityInput): Promise<void> {
  try {
    const ref = input.schoolRef.collection('activity').doc();
    await ref.set({
      schemaVersion: 1,
      schoolId: input.schoolId,
      type: input.type,
      summary: input.summary,
      academicYearId: input.academicYearId || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
      actorUid: input.actorUid,
      actorKind: input.actorKind,
      metadata: input.metadata || {},
      occurredAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error('School activity log write failed', {
      schoolId: input.schoolId,
      actorUid: input.actorUid,
      type: input.type,
      error: String(error),
    });
  }
}
