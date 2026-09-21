import type { StaffIdentityRegistryEntry } from './enrollmentIdentityBridge';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import type { AttendanceValidationEvidenceDocument } from './teamsEvidenceCollector';

export const AVS_IDENTITY_ROLLOUT_CASE_LIMIT = 500;

const SHA256_HEX = /^[a-f0-9]{64}$/;

export interface CachedIdentityRolloutCase {
  caseId: string;
  classSessionId: string | null;
  teacherId: string | null;
  evidenceId: string | null;
  resolutionStatus: string | null;
}

export type TeacherIdentityRolloutStatus =
  | 'ready'
  | 'already_mapped'
  | 'teacher_not_registered'
  | 'teacher_email_missing'
  | 'teacher_email_ambiguous'
  | 'no_cached_identity_candidate'
  | 'multiple_cached_identity_candidates'
  | 'existing_identity_differs'
  | 'identity_owned_by_other_staff';

export interface TeacherIdentityRolloutDecision {
  teacherId: string;
  status: TeacherIdentityRolloutStatus;
  supportingCaseCount: number;
  candidateHash: string | null;
}

export interface TeacherIdentityRolloutPlan {
  decisions: TeacherIdentityRolloutDecision[];
  readyMappings: Array<{
    teacherId: string;
    microsoftIdentityIdHash: string;
    supportingCaseCount: number;
  }>;
}

function normalizedHash(value: unknown): string | null {
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
  return SHA256_HEX.test(normalized) ? normalized : null;
}

function emailOwners(
  entries: readonly StaffIdentityRegistryEntry[],
): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  for (const entry of entries) {
    const emailHash = normalizedHash(entry.emailAddressHash);
    if (!emailHash) continue;
    if (!owners.has(emailHash)) owners.set(emailHash, new Set());
    owners.get(emailHash)!.add(entry.staffId);
  }
  return owners;
}

function microsoftIdentityOwners(
  entries: readonly StaffIdentityRegistryEntry[],
): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>();
  for (const entry of entries) {
    for (const rawHash of entry.microsoftIdentityIdHashes) {
      const hash = normalizedHash(rawHash);
      if (!hash) continue;
      if (!owners.has(hash)) owners.set(hash, new Set());
      owners.get(hash)!.add(entry.staffId);
    }
  }
  return owners;
}

function completeSingleAttendanceReport(
  evidence: AttendanceValidationEvidenceDocument,
) {
  if (
    !evidence.completeness.attendanceReportsComplete
    || evidence.completeness.nextAttendanceReportPagePresent
    || !evidence.completeness.attendanceRecordsComplete
    || evidence.attendanceReports.length !== 1
  ) {
    return null;
  }

  const report = evidence.attendanceReports[0];
  if (
    !report.recordsComplete
    || report.nextRecordsPagePresent
    || report.recordsIssue !== null
  ) {
    return null;
  }

  return report;
}

/**
 * Derives privacy-minimized Microsoft identity candidates only from cached AVS evidence.
 *
 * Safety invariants:
 * - the Tiny Steps teacherId must match the evidence session teacherId;
 * - only active registry entries with role=teacher participate;
 * - the teacher email is used only as its existing SHA-256 registry hash;
 * - display names are never used;
 * - only complete attendance-record evidence is eligible;
 * - exactly one stable Microsoft identity hash must be observed for the teacher;
 * - an identity hash already owned by another staff member is never reassigned;
 * - an existing different stable identity is never silently expanded/replaced.
 */
export function planCachedTeacherIdentityRollout(
  cases: readonly CachedIdentityRolloutCase[],
  evidenceById: ReadonlyMap<string, AttendanceValidationEvidenceDocument>,
  registry: Av3StaffRegistrySnapshot,
): TeacherIdentityRolloutPlan {
  const teacherEntries = new Map(
    registry.entries
      .filter((entry) => entry.role.trim().toLowerCase() === 'teacher')
      .map((entry) => [entry.staffId, entry]),
  );
  const emailOwnerMap = emailOwners(registry.entries);
  const identityOwnerMap = microsoftIdentityOwners(registry.entries);

  const observedTeacherIds = [...new Set(
    cases
      .map((item) => item.teacherId?.trim() || '')
      .filter(Boolean),
  )].sort();

  const candidatesByTeacher = new Map<string, Set<string>>();
  const supportingCasesByTeacher = new Map<string, Set<string>>();
  const ambiguousEvidenceTeachers = new Set<string>();

  for (const item of cases) {
    const teacherId = item.teacherId?.trim() || '';
    const evidenceId = item.evidenceId?.trim() || '';
    const classSessionId = item.classSessionId?.trim() || item.caseId.trim();
    if (!teacherId || !evidenceId || !classSessionId) continue;

    const teacher = teacherEntries.get(teacherId);
    const teacherEmailHash = normalizedHash(teacher?.emailAddressHash);
    if (!teacher || !teacherEmailHash) continue;

    const evidence = evidenceById.get(evidenceId);
    if (
      !evidence
      || evidence.session.teacherId !== teacherId
      || evidence.session.classSessionId !== classSessionId
    ) {
      continue;
    }

    const report = completeSingleAttendanceReport(evidence);
    if (!report) continue;

    for (const participant of report.participantRecords) {
      const participantEmailHash = normalizedHash(participant.emailAddressHash);
      if (!participantEmailHash || participantEmailHash !== teacherEmailHash) {
        continue;
      }

      const stableHashes = [...new Set(
        participant.identityHints
          .map((hint) => normalizedHash(hint.idHash))
          .filter((value): value is string => Boolean(value)),
      )];

      if (stableHashes.length > 1) {
        ambiguousEvidenceTeachers.add(teacherId);
        continue;
      }
      if (stableHashes.length !== 1) continue;

      if (!candidatesByTeacher.has(teacherId)) {
        candidatesByTeacher.set(teacherId, new Set());
      }
      candidatesByTeacher.get(teacherId)!.add(stableHashes[0]);

      if (!supportingCasesByTeacher.has(teacherId)) {
        supportingCasesByTeacher.set(teacherId, new Set());
      }
      supportingCasesByTeacher.get(teacherId)!.add(item.caseId);
    }
  }

  const decisions: TeacherIdentityRolloutDecision[] = [];

  for (const teacherId of observedTeacherIds) {
    const teacher = teacherEntries.get(teacherId);
    const candidates = [...(candidatesByTeacher.get(teacherId) ?? new Set())];
    const supportingCaseCount =
      supportingCasesByTeacher.get(teacherId)?.size ?? 0;

    if (!teacher) {
      decisions.push({
        teacherId,
        status: 'teacher_not_registered',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    const teacherEmailHash = normalizedHash(teacher.emailAddressHash);
    if (!teacherEmailHash) {
      decisions.push({
        teacherId,
        status: 'teacher_email_missing',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    const emailStaffIds = emailOwnerMap.get(teacherEmailHash) ?? new Set();
    if (emailStaffIds.size !== 1 || !emailStaffIds.has(teacherId)) {
      decisions.push({
        teacherId,
        status: 'teacher_email_ambiguous',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    if (ambiguousEvidenceTeachers.has(teacherId) || candidates.length > 1) {
      decisions.push({
        teacherId,
        status: 'multiple_cached_identity_candidates',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    if (candidates.length === 0) {
      decisions.push({
        teacherId,
        status: 'no_cached_identity_candidate',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    const candidateHash = candidates[0];
    const existingHashes = new Set(
      teacher.microsoftIdentityIdHashes
        .map((value) => normalizedHash(value))
        .filter((value): value is string => Boolean(value)),
    );

    if (existingHashes.has(candidateHash)) {
      decisions.push({
        teacherId,
        status: 'already_mapped',
        supportingCaseCount,
        candidateHash,
      });
      continue;
    }

    if (existingHashes.size > 0) {
      decisions.push({
        teacherId,
        status: 'existing_identity_differs',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    const identityStaffIds = identityOwnerMap.get(candidateHash) ?? new Set();
    if (
      identityStaffIds.size > 0
      && !(identityStaffIds.size === 1 && identityStaffIds.has(teacherId))
    ) {
      decisions.push({
        teacherId,
        status: 'identity_owned_by_other_staff',
        supportingCaseCount,
        candidateHash: null,
      });
      continue;
    }

    decisions.push({
      teacherId,
      status: 'ready',
      supportingCaseCount,
      candidateHash,
    });
  }

  return {
    decisions,
    readyMappings: decisions
      .filter(
        (decision): decision is TeacherIdentityRolloutDecision & {
          candidateHash: string;
        } =>
          decision.status === 'ready' && Boolean(decision.candidateHash),
      )
      .map((decision) => ({
        teacherId: decision.teacherId,
        microsoftIdentityIdHash: decision.candidateHash,
        supportingCaseCount: decision.supportingCaseCount,
      })),
  };
}

export function registryWithAppliedIdentityMappings(
  registry: Av3StaffRegistrySnapshot,
  mappings: readonly {
    teacherId: string;
    microsoftIdentityIdHash: string;
  }[],
): Av3StaffRegistrySnapshot {
  const byTeacher = new Map(
    mappings.map((item) => [
      item.teacherId,
      normalizedHash(item.microsoftIdentityIdHash),
    ]),
  );

  return {
    ...registry,
    entries: registry.entries.map((entry) => {
      const identityHash = byTeacher.get(entry.staffId);
      if (!identityHash) return entry;
      return {
        ...entry,
        microsoftIdentityIdHashes: [identityHash],
      };
    }),
  };
}
