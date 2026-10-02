import type { Av3EnrollmentIdentityResult } from './enrollmentIdentityBridge';
import {
  clipNormalizedIntervalsToWindow,
  intersectNormalizedIntervals,
  normalizeAttendanceIntervals,
  sumNormalizedIntervalSeconds,
  type NormalizedEvidenceInterval,
} from './evidenceIntervals';
import type {
  AttendanceParticipantEvidence,
  AttendanceValidationEvidenceDocument,
} from './teamsEvidenceCollector';

export const AVS_SAME_DAY_EVIDENCE_CALCULATION_VERSION = 2;
export const AVS_SAME_DAY_IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SameDayCoverageStatus =
  | 'measured'
  | 'no_occurrence'
  | 'review';

export interface SameDayReportCoverage {
  reportKey: string;
  overlapIntervals: NormalizedEvidenceInterval[];
}

export interface SameDayCoverageObservation {
  status: SameDayCoverageStatus;
  evidenceId: string;
  calculationVersion: number;
  attendanceEvidenceComplete: boolean;
  identityVerified: boolean;
  sameDayOccurrenceCount: number;
  reportCoverages: SameDayReportCoverage[];
  issues: string[];
}

export interface SameDayCoverageAggregate {
  status: SameDayCoverageStatus;
  totalOverlapSeconds: number;
  occurrenceCount: number;
  completeObservationCount: number;
  measuredObservationCount: number;
  reportKeys: string[];
  issues: string[];
}

export type SameDayCoverageMode =
  | 'teacher_learner_overlap'
  | 'single_session_learner_attendance';

function parseYmd(value: string): number {
  if (!YMD_RE.test(value)) {
    throw new TypeError('serviceDateYmd must use YYYY-MM-DD.');
  }
  const utcMidnightMs = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(utcMidnightMs)) {
    throw new TypeError('serviceDateYmd must be a valid calendar date.');
  }
  return utcMidnightMs;
}

export function serviceDayWindowUtc(
  serviceDateYmd: string,
): { startDateTime: string; endDateTime: string } {
  const utcMidnightMs = parseYmd(serviceDateYmd);
  const startMs = utcMidnightMs - AVS_SAME_DAY_IST_OFFSET_MS;
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return {
    startDateTime: new Date(startMs).toISOString(),
    endDateTime: new Date(endMs).toISOString(),
  };
}

function participantIntervals(
  participant: AttendanceParticipantEvidence,
): NormalizedEvidenceInterval[] {
  return normalizeAttendanceIntervals(
    participant.rawAttendanceIntervals.map((interval) => ({
      joinDateTime: interval.joinDateTime ?? undefined,
      leaveDateTime: interval.leaveDateTime ?? undefined,
      durationInSeconds: interval.durationInSeconds ?? undefined,
    })),
  ).intervals;
}

function mergeNormalizedIntervals(
  intervals: readonly NormalizedEvidenceInterval[],
): NormalizedEvidenceInterval[] {
  return normalizeAttendanceIntervals(
    intervals.map((interval) => ({
      joinDateTime: interval.startDateTime,
      leaveDateTime: interval.endDateTime,
      durationInSeconds: interval.durationInSeconds,
    })),
  ).intervals;
}

type ParticipantBusinessClassification =
  Av3EnrollmentIdentityResult['participantClassifications'][number]['classification'];

interface ParticipantCoverageGroup {
  key: string;
  classifications: Set<ParticipantBusinessClassification>;
  intervals: NormalizedEvidenceInterval[];
  seconds: number;
}

function participantReconnectKey(
  participant: AttendanceParticipantEvidence,
  classification: ParticipantBusinessClassification,
): string {
  // For learner-side Teams guests, reconnects can receive different transient
  // guest ids while keeping the same display name. In a canonical one-learner
  // session, use the privacy-safe normalized name hash first so those reconnect
  // rows are correlated. Staff-side identities never use this shortcut.
  if (
    classification === 'learner_side'
    && participant.displayNameHash
  ) {
    return `learner-name:${participant.displayNameHash}`;
  }
  if (participant.emailAddressHash) {
    return `email:${participant.emailAddressHash}`;
  }
  const stableIdentityHashes = participant.identityHints
    .map((hint) => hint.idHash)
    .filter(Boolean)
    .sort();
  if (stableIdentityHashes.length > 0) {
    return `identity:${stableIdentityHashes.join(',')}`;
  }
  if (participant.displayNameHash) {
    return `participant-name:${participant.displayNameHash}`;
  }
  return `record:${participant.participantRecordId}`;
}

function singleSessionLearnerCoverage(
  participants: readonly AttendanceParticipantEvidence[],
  identity: Av3EnrollmentIdentityResult,
  day: { startDateTime: string; endDateTime: string },
): { intervals: NormalizedEvidenceInterval[]; ambiguous: boolean } {
  const classificationById = new Map(
    identity.participantClassifications.map((item) => [
      item.participantRecordId,
      item.classification,
    ] as const),
  );
  const groups = new Map<string, ParticipantCoverageGroup>();

  for (const participant of participants) {
    const classification =
      classificationById.get(participant.participantRecordId) ?? 'learner_side';
    const intervals = mergeNormalizedIntervals(
      clipNormalizedIntervalsToWindow(
        participantIntervals(participant),
        day.startDateTime,
        day.endDateTime,
      ),
    );
    const seconds = sumNormalizedIntervalSeconds(intervals);
    if (!(seconds > 0)) continue;

    const key = participantReconnectKey(participant, classification);
    const existing = groups.get(key);
    if (existing) {
      existing.classifications.add(classification);
      existing.intervals = mergeNormalizedIntervals([
        ...existing.intervals,
        ...intervals,
      ]);
      existing.seconds = sumNormalizedIntervalSeconds(existing.intervals);
    } else {
      groups.set(key, {
        key,
        classifications: new Set([classification]),
        intervals,
        seconds,
      });
    }
  }

  const ordered = [...groups.values()].sort((left, right) =>
    right.seconds - left.seconds || left.key.localeCompare(right.key));

  const staffGroups = ordered.filter((group) =>
    [...group.classifications].some((classification) =>
      classification === 'expected_teacher'
      || classification === 'other_staff'
      || classification === 'ambiguous_staff'));
  const learnerGroups = ordered.filter((group) =>
    group.classifications.size === 1
    && group.classifications.has('learner_side'));

  if (staffGroups.length > 0) {
    if (learnerGroups.length === 0) return { intervals: [], ambiguous: false };
    if (learnerGroups.length === 1) {
      return { intervals: learnerGroups[0].intervals, ambiguous: false };
    }
    return { intervals: [], ambiguous: true };
  }

  // If teacher mapping is unavailable, preserve the Tiny Steps operational
  // invariant that the authorised teacher conducts the meeting. One participant
  // is teacher-only; two correlated participant groups are teacher + learner.
  // More than two unresolved people cannot be attributed safely.
  if (ordered.length <= 1) return { intervals: [], ambiguous: false };
  if (ordered.length === 2) {
    return { intervals: ordered[1].intervals, ambiguous: false };
  }
  return { intervals: [], ambiguous: true };
}

function attendanceEvidenceComplete(
  evidence: AttendanceValidationEvidenceDocument,
): boolean {
  const attendanceIssue = evidence.issues.some((issue) =>
    issue.stage === 'meeting_resolution'
      || issue.stage === 'attendance_reports'
      || issue.stage === 'attendance_records');

  return evidence.calculationVersion >= AVS_SAME_DAY_EVIDENCE_CALCULATION_VERSION
    && evidence.meeting !== null
    && evidence.completeness.attendanceReportsComplete
    && !evidence.completeness.nextAttendanceReportPagePresent
    && evidence.completeness.attendanceRecordsComplete
    && evidence.attendanceReports.every((report) =>
      report.recordsComplete
      && !report.nextRecordsPagePresent
      && report.recordsIssue === null)
    && !attendanceIssue;
}

export function buildSameDayCoverageObservation(
  evidence: AttendanceValidationEvidenceDocument,
  identity: Av3EnrollmentIdentityResult,
  serviceDateYmd: string,
  mode: SameDayCoverageMode = 'teacher_learner_overlap',
): SameDayCoverageObservation {
  const complete = attendanceEvidenceComplete(evidence);

  if (!complete) {
    return {
      status: 'review',
      evidenceId: evidence.id,
      calculationVersion: evidence.calculationVersion,
      attendanceEvidenceComplete: false,
      identityVerified: false,
      sameDayOccurrenceCount: evidence.attendanceReports.length,
      reportCoverages: [],
      issues: ['same_day_attendance_evidence_incomplete'],
    };
  }

  if (evidence.attendanceReports.length === 0) {
    return {
      status: 'no_occurrence',
      evidenceId: evidence.id,
      calculationVersion: evidence.calculationVersion,
      attendanceEvidenceComplete: true,
      identityVerified: identity.identityConfidence === 'verified',
      sameDayOccurrenceCount: 0,
      reportCoverages: [],
      issues: [],
    };
  }

  // Multi-session reconciliation keeps the strict historical teacher + learner
  // overlap proof. For a normal single-session day, Tiny Steps' operational
  // invariant is that the class link is conducted by the authorised teacher, so
  // teacher identity mapping is diagnostic rather than a classification gate.
  // In that single-session mode we measure learner-side attendance directly.
  const identityVerified =
    identity.identityConfidence === 'verified'
    && identity.expectedTeacherPresent;

  if (mode === 'teacher_learner_overlap' && !identityVerified) {
    return {
      status: 'review',
      evidenceId: evidence.id,
      calculationVersion: evidence.calculationVersion,
      attendanceEvidenceComplete: true,
      identityVerified: false,
      sameDayOccurrenceCount: evidence.attendanceReports.length,
      reportCoverages: [],
      issues: ['same_day_identity_not_verified'],
    };
  }

  const teacherIds = new Set(
    identity.participantClassifications
      .filter((item) => item.classification === 'expected_teacher')
      .map((item) => item.participantRecordId),
  );
  const learnerIds = new Set(
    identity.participantClassifications
      .filter((item) => item.classification === 'learner_side')
      .map((item) => item.participantRecordId),
  );
  const day = serviceDayWindowUtc(serviceDateYmd);
  const meetingId = evidence.meeting?.onlineMeetingId ?? 'unknown-meeting';

  let singleSessionLearnerAmbiguous = false;
  const reportCoverages: SameDayReportCoverage[] = evidence.attendanceReports.map(
    (report) => {
      const learners = report.participantRecords.filter((participant) =>
        learnerIds.has(participant.participantRecordId));

      if (mode === 'single_session_learner_attendance') {
        const learnerCoverage = singleSessionLearnerCoverage(
          report.participantRecords,
          identity,
          day,
        );
        if (learnerCoverage.ambiguous) singleSessionLearnerAmbiguous = true;
        return {
          reportKey: `${meetingId}:${report.reportId}`,
          overlapIntervals: learnerCoverage.intervals,
        };
      }

      const teachers = report.participantRecords.filter((participant) =>
        teacherIds.has(participant.participantRecordId));
      const pairIntervals: NormalizedEvidenceInterval[] = [];
      for (const teacher of teachers) {
        const teacherIntervals = participantIntervals(teacher);
        for (const learner of learners) {
          const overlap = intersectNormalizedIntervals(
            teacherIntervals,
            participantIntervals(learner),
          );
          pairIntervals.push(...clipNormalizedIntervalsToWindow(
            overlap,
            day.startDateTime,
            day.endDateTime,
          ));
        }
      }

      return {
        reportKey: `${meetingId}:${report.reportId}`,
        overlapIntervals: mergeNormalizedIntervals(pairIntervals),
      };
    },
  );

  if (
    mode === 'single_session_learner_attendance'
    && singleSessionLearnerAmbiguous
  ) {
    return {
      status: 'review',
      evidenceId: evidence.id,
      calculationVersion: evidence.calculationVersion,
      attendanceEvidenceComplete: true,
      identityVerified,
      sameDayOccurrenceCount: evidence.attendanceReports.length,
      reportCoverages: [],
      issues: ['single_session_learner_reconnect_ambiguous'],
    };
  }

  return {
    status: 'measured',
    evidenceId: evidence.id,
    calculationVersion: evidence.calculationVersion,
    attendanceEvidenceComplete: true,
    identityVerified,
    sameDayOccurrenceCount: evidence.attendanceReports.length,
    reportCoverages,
    issues: [],
  };
}

export function aggregateSameDayCoverage(
  observations: readonly SameDayCoverageObservation[],
): SameDayCoverageAggregate {
  const completeObservations = observations.filter(
    (observation) => observation.attendanceEvidenceComplete,
  );
  const measured = completeObservations.filter(
    (observation) => observation.status === 'measured',
  );
  const reportIntervals = new Map<string, NormalizedEvidenceInterval[]>();

  for (const observation of measured) {
    for (const report of observation.reportCoverages) {
      const existing = reportIntervals.get(report.reportKey) ?? [];
      reportIntervals.set(
        report.reportKey,
        mergeNormalizedIntervals([
          ...existing,
          ...report.overlapIntervals,
        ]),
      );
    }
  }

  const mergedAcrossReports = mergeNormalizedIntervals(
    [...reportIntervals.values()].flat(),
  );
  const issues = [...new Set(observations.flatMap((item) => item.issues))];

  if (measured.length > 0) {
    return {
      status: 'measured',
      totalOverlapSeconds: sumNormalizedIntervalSeconds(mergedAcrossReports),
      occurrenceCount: reportIntervals.size,
      completeObservationCount: completeObservations.length,
      measuredObservationCount: measured.length,
      reportKeys: [...reportIntervals.keys()].sort(),
      issues,
    };
  }

  if (
    completeObservations.length > 0
    && completeObservations.every((item) => item.status === 'no_occurrence')
  ) {
    return {
      status: 'no_occurrence',
      totalOverlapSeconds: 0,
      occurrenceCount: 0,
      completeObservationCount: completeObservations.length,
      measuredObservationCount: 0,
      reportKeys: [],
      issues,
    };
  }

  return {
    status: 'review',
    totalOverlapSeconds: 0,
    occurrenceCount: 0,
    completeObservationCount: completeObservations.length,
    measuredObservationCount: 0,
    reportKeys: [],
    issues,
  };
}
