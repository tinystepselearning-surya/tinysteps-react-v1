import {
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SHA256_HEX = /^[a-f0-9]{64}$/;

export type EvidenceFreshnessDecision =
  | 'reuse_cached'
  | 'fresh_required'
  | 'unsafe_review';

export type EvidenceFreshnessReason =
  | 'compatible'
  | 'evidence_document_missing'
  | 'evidence_session_id_mismatch'
  | 'operational_enrollment_unresolved'
  | 'evidence_enrollment_unresolved'
  | 'operational_teacher_unresolved'
  | 'evidence_teacher_unresolved'
  | 'operational_kid_unresolved'
  | 'evidence_kid_unresolved'
  | 'operational_service_date_unresolved'
  | 'operational_service_date_conflict'
  | 'evidence_service_date_unresolved'
  | 'operational_schedule_window_unresolved'
  | 'evidence_schedule_window_unresolved'
  | 'evidence_join_url_hash_invalid'
  | 'operational_join_url_unresolved'
  | 'enrollment_changed'
  | 'teacher_changed'
  | 'kid_changed'
  | 'service_date_changed'
  | 'scheduled_window_changed'
  | 'join_url_added'
  | 'join_url_changed';

export interface EvidenceFreshnessResult {
  decision: EvidenceFreshnessDecision;
  reasons: EvidenceFreshnessReason[];
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function firstText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const normalized = text(item);
    if (normalized) return normalized;
  }
  return null;
}

function canonicalTeacherId(session: Record<string, unknown>): string | null {
  return text(session.teacherId)
    || text(session.assignedTeacherId)
    || text(session.primaryTeacherId)
    || text(session.teacherUid)
    || text(session.teacher_id)
    || firstText(session.teacherIds);
}

function canonicalKidId(session: Record<string, unknown>): string | null {
  return text(session.kidId)
    || firstText(session.kidIds)
    || text(session.studentId)
    || text(session.childId);
}

function validYmd(value: unknown): string | null {
  const normalized = text(value);
  if (!normalized || !YMD_RE.test(normalized)) return null;
  const parsed = Date.parse(`${normalized}T00:00:00.000Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10) === normalized
    ? normalized
    : null;
}

function dateFromUnknown(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as {
    toDate?: () => Date;
    seconds?: number;
    _seconds?: number;
  };

  if (typeof candidate.toDate === 'function') {
    const date = candidate.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  const seconds = typeof candidate.seconds === 'number'
    ? candidate.seconds
    : candidate._seconds;
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function istYmd(value: Date): string {
  return new Date(value.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function hhmm(value: unknown): { hour: number; minute: number } | null {
  const normalized = text(value);
  const match = normalized ? HHMM_RE.exec(normalized) : null;
  return match
    ? { hour: Number(match[1]), minute: Number(match[2]) }
    : null;
}

function istDateTime(
  ymd: string,
  time: { hour: number; minute: number },
): Date | null {
  const midnight = Date.parse(`${ymd}T00:00:00.000Z`);
  if (!Number.isFinite(midnight)) return null;
  const date = new Date(
    midnight
      + (time.hour * 60 + time.minute) * 60_000
      - IST_OFFSET_MS,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function positiveMinutes(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function operationalServiceDate(
  session: Record<string, unknown>,
): { value: string | null; conflict: boolean } {
  const candidates = new Set<string>();
  const explicitDate = validYmd(session.date);
  const explicitServiceDate = validYmd(session.serviceDateYmd);
  const startAt = dateFromUnknown(session.startAt);

  if (explicitDate) candidates.add(explicitDate);
  if (explicitServiceDate) candidates.add(explicitServiceDate);
  if (startAt) candidates.add(istYmd(startAt));

  return {
    value: candidates.size === 1 ? [...candidates][0] : null,
    conflict: candidates.size > 1,
  };
}

function operationalWindow(
  session: Record<string, unknown>,
  serviceDateYmd: string,
): { start: Date; end: Date } | null {
  let start = dateFromUnknown(session.startAt);
  let end = dateFromUnknown(session.endAt);

  const startParts = hhmm(session.startTime);
  const endParts = hhmm(session.endTime);

  if (!start && startParts) {
    start = istDateTime(serviceDateYmd, startParts);
  }
  if (!end && endParts) {
    end = istDateTime(serviceDateYmd, endParts);
  }

  const durationMinutes =
    positiveMinutes(session.durationMinutes)
    ?? positiveMinutes(session.durationMins);

  if (start && !end && durationMinutes) {
    end = new Date(start.getTime() + durationMinutes * 60_000);
  }
  if (!start && end && durationMinutes) {
    start = new Date(end.getTime() - durationMinutes * 60_000);
  }

  if (
    start
    && end
    && end.getTime() <= start.getTime()
    && startParts
    && endParts
  ) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function evidenceWindow(
  evidence: AttendanceValidationEvidenceDocument,
): { start: Date; end: Date } | null {
  const start = dateFromUnknown(evidence.session.scheduledStartDateTime);
  const end = dateFromUnknown(evidence.session.scheduledEndDateTime);
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function currentJoinUrl(session: Record<string, unknown>): string | null {
  return text(session.joinUrl)
    || text(session.meetingLink)
    || text(session.classLink);
}

export function classifyCachedEvidenceFreshness(params: {
  classSessionId: string;
  session: Record<string, unknown>;
  evidence: AttendanceValidationEvidenceDocument;
}): EvidenceFreshnessResult {
  const unsafeReasons: EvidenceFreshnessReason[] = [];
  const freshReasons: EvidenceFreshnessReason[] = [];
  const { classSessionId, session, evidence } = params;

  if (evidence.session.classSessionId !== classSessionId) {
    unsafeReasons.push('evidence_session_id_mismatch');
  }

  const enrollmentId = text(session.enrollmentId);
  const evidenceEnrollmentId = text(evidence.session.enrollmentId);
  const teacherId = canonicalTeacherId(session);
  const evidenceTeacherId = text(evidence.session.teacherId);
  const kidId = canonicalKidId(session);
  const evidenceKidId = text(evidence.session.kidId);

  if (!enrollmentId) unsafeReasons.push('operational_enrollment_unresolved');
  if (!evidenceEnrollmentId) unsafeReasons.push('evidence_enrollment_unresolved');
  if (!teacherId) unsafeReasons.push('operational_teacher_unresolved');
  if (!evidenceTeacherId) unsafeReasons.push('evidence_teacher_unresolved');
  if (!kidId) unsafeReasons.push('operational_kid_unresolved');
  if (!evidenceKidId) unsafeReasons.push('evidence_kid_unresolved');

  const serviceDate = operationalServiceDate(session);
  if (serviceDate.conflict) {
    unsafeReasons.push('operational_service_date_conflict');
  } else if (!serviceDate.value) {
    unsafeReasons.push('operational_service_date_unresolved');
  }

  const evidenceStart = dateFromUnknown(
    evidence.session.scheduledStartDateTime,
  );
  const evidenceServiceDate = evidenceStart ? istYmd(evidenceStart) : null;
  if (!evidenceServiceDate) {
    unsafeReasons.push('evidence_service_date_unresolved');
  }

  const currentWindow = serviceDate.value
    ? operationalWindow(session, serviceDate.value)
    : null;
  if (!currentWindow) {
    unsafeReasons.push('operational_schedule_window_unresolved');
  }

  const capturedWindow = evidenceWindow(evidence);
  if (!capturedWindow) {
    unsafeReasons.push('evidence_schedule_window_unresolved');
  }

  const capturedJoinHash = text(evidence.session.joinUrlHash)?.toLowerCase()
    ?? null;
  if (capturedJoinHash && !SHA256_HEX.test(capturedJoinHash)) {
    unsafeReasons.push('evidence_join_url_hash_invalid');
  }

  const joinUrl = currentJoinUrl(session);
  if (!joinUrl && capturedJoinHash) {
    unsafeReasons.push('operational_join_url_unresolved');
  }

  if (unsafeReasons.length > 0) {
    return {
      decision: 'unsafe_review',
      reasons: [...new Set(unsafeReasons)],
    };
  }

  if (enrollmentId !== evidenceEnrollmentId) {
    freshReasons.push('enrollment_changed');
  }
  if (teacherId !== evidenceTeacherId) {
    freshReasons.push('teacher_changed');
  }
  if (kidId !== evidenceKidId) {
    freshReasons.push('kid_changed');
  }
  if (serviceDate.value !== evidenceServiceDate) {
    freshReasons.push('service_date_changed');
  }
  // AVS business reconciliation is service-date based. A class may move from
  // its originally scheduled clock time to another time on the same IST date
  // without changing the class identity. Both windows still have to resolve
  // safely above, but an exact same-day clock shift alone does not invalidate
  // cached Teams attendance evidence.
  if (joinUrl) {
    const currentHash = hashAttendanceEvidenceValue(joinUrl);
    if (!capturedJoinHash) {
      freshReasons.push('join_url_added');
    } else if (currentHash !== capturedJoinHash) {
      freshReasons.push('join_url_changed');
    }
  }

  if (freshReasons.length > 0) {
    return {
      decision: 'fresh_required',
      reasons: [...new Set(freshReasons)],
    };
  }

  return {
    decision: 'reuse_cached',
    reasons: ['compatible'],
  };
}
