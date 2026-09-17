import type {
  AttendanceParticipantEvidence,
  AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';

export const AV3_IDENTITY_SCHEMA_VERSION = 1;

export type Av3IdentityConfidence = 'verified' | 'review';
export type Av3ParticipantClassification =
  | 'expected_teacher'
  | 'other_staff'
  | 'learner_side'
  | 'ambiguous_staff';

export type Av3IdentityIssueKind =
  | 'missing_enrollment_id'
  | 'missing_kid_id'
  | 'missing_teacher_id'
  | 'expected_teacher_not_registered'
  | 'expected_teacher_identity_missing'
  | 'ambiguous_staff_match'
  | 'multiple_unexpected_staff';

export interface StaffIdentityRegistryEntry {
  staffId: string;
  role: string;
  emailAddressHash: string | null;
  microsoftIdentityIdHashes: string[];
}

export interface Av3ParticipantIdentityResult {
  participantRecordId: string;
  classification: Av3ParticipantClassification;
  matchedStaffIds: string[];
}

export interface Av3EnrollmentIdentityResult {
  schemaVersion: typeof AV3_IDENTITY_SCHEMA_VERSION;
  brick: 'AV3';
  classSessionId: string;
  enrollmentId: string | null;
  kidId: string | null;
  teacherId: string | null;
  expectedTeacherPresent: boolean;
  learnerSidePresent: boolean;
  unexpectedStaffPresent: boolean;
  unexpectedStaffCount: number;
  learnerSideParticipantCount: number;
  identityConfidence: Av3IdentityConfidence;
  issues: Av3IdentityIssueKind[];
  participantClassifications: Av3ParticipantIdentityResult[];
}

function normalizeHash(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function registryIdentityHashes(entry: StaffIdentityRegistryEntry): Set<string> {
  const hashes = new Set<string>();
  const emailHash = normalizeHash(entry.emailAddressHash);
  if (emailHash) hashes.add(emailHash);
  for (const value of entry.microsoftIdentityIdHashes) {
    const normalized = normalizeHash(value);
    if (normalized) hashes.add(normalized);
  }
  return hashes;
}

function participantIdentityHashes(participant: AttendanceParticipantEvidence): Set<string> {
  const hashes = new Set<string>();
  const emailHash = normalizeHash(participant.emailAddressHash);
  if (emailHash) hashes.add(emailHash);
  for (const hint of participant.identityHints) {
    const normalized = normalizeHash(hint.idHash);
    if (normalized) hashes.add(normalized);
  }
  return hashes;
}

function intersects(left: Set<string>, right: Set<string>): boolean {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

function uniqueIssueList(issues: Av3IdentityIssueKind[]): Av3IdentityIssueKind[] {
  return [...new Set(issues)];
}

/**
 * Deterministic AV3 identity bridge.
 *
 * Official Tiny Steps model:
 * - the class session already identifies enrollment + kid + assigned teacher;
 * - recognized Tiny Steps Microsoft identities are STAFF SIDE;
 * - every attendance participant that does not match the staff registry is LEARNER SIDE;
 * - display names are never used for the primary identity decision;
 * - AV3 does not decide Present/Absent and does not mutate operational attendance/finance.
 */
export function bridgeEnrollmentIdentity(
  evidence: AttendanceValidationEvidenceDocument,
  staffRegistry: readonly StaffIdentityRegistryEntry[],
): Av3EnrollmentIdentityResult {
  const issues: Av3IdentityIssueKind[] = [];
  const teacherId = evidence.session.teacherId;

  if (!evidence.session.enrollmentId) issues.push('missing_enrollment_id');
  if (!evidence.session.kidId) issues.push('missing_kid_id');
  if (!teacherId) issues.push('missing_teacher_id');

  const normalizedRegistry = staffRegistry.map((entry) => ({
    entry,
    hashes: registryIdentityHashes(entry),
  }));

  const expectedTeacherEntries = teacherId
    ? normalizedRegistry.filter(({ entry }) => entry.staffId === teacherId)
    : [];

  if (teacherId && expectedTeacherEntries.length === 0) {
    issues.push('expected_teacher_not_registered');
  }
  if (
    expectedTeacherEntries.length === 1
    && expectedTeacherEntries[0].hashes.size === 0
  ) {
    issues.push('expected_teacher_identity_missing');
  }
  if (expectedTeacherEntries.length > 1) {
    issues.push('ambiguous_staff_match');
  }

  const participants = evidence.attendanceReports.flatMap(
    (report) => report.participantRecords,
  );

  const participantClassifications: Av3ParticipantIdentityResult[] = participants.map(
    (participant) => {
      const participantHashes = participantIdentityHashes(participant);
      const matches = normalizedRegistry.filter(({ hashes }) =>
        intersects(participantHashes, hashes),
      );
      const matchedStaffIds = [...new Set(matches.map(({ entry }) => entry.staffId))];

      if (matchedStaffIds.length > 1) {
        issues.push('ambiguous_staff_match');
        return {
          participantRecordId: participant.participantRecordId,
          classification: 'ambiguous_staff' as const,
          matchedStaffIds,
        };
      }

      if (matchedStaffIds.length === 1) {
        const matchedStaffId = matchedStaffIds[0];
        return {
          participantRecordId: participant.participantRecordId,
          classification: matchedStaffId === teacherId
            ? 'expected_teacher' as const
            : 'other_staff' as const,
          matchedStaffIds,
        };
      }

      return {
        participantRecordId: participant.participantRecordId,
        classification: 'learner_side' as const,
        matchedStaffIds: [],
      };
    },
  );

  const expectedTeacherPresent = participantClassifications.some(
    (participant) => participant.classification === 'expected_teacher',
  );
  const learnerSideParticipantCount = participantClassifications.filter(
    (participant) => participant.classification === 'learner_side',
  ).length;
  const unexpectedStaffIds = new Set(
    participantClassifications
      .filter((participant) => participant.classification === 'other_staff')
      .flatMap((participant) => participant.matchedStaffIds),
  );

  if (unexpectedStaffIds.size > 1) {
    issues.push('multiple_unexpected_staff');
  }

  const finalIssues = uniqueIssueList(issues);
  return {
    schemaVersion: AV3_IDENTITY_SCHEMA_VERSION,
    brick: 'AV3',
    classSessionId: evidence.session.classSessionId,
    enrollmentId: evidence.session.enrollmentId,
    kidId: evidence.session.kidId,
    teacherId,
    expectedTeacherPresent,
    learnerSidePresent: learnerSideParticipantCount > 0,
    unexpectedStaffPresent: unexpectedStaffIds.size > 0,
    unexpectedStaffCount: unexpectedStaffIds.size,
    learnerSideParticipantCount,
    identityConfidence: finalIssues.length === 0 ? 'verified' : 'review',
    issues: finalIssues,
    participantClassifications,
  };
}
