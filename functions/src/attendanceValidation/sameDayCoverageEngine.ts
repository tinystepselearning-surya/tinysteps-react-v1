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

  // For the three-outcome business reconciliation, verified teacher identity
  // plus complete attendance records are sufficient to measure the learner side.
  // If no learner-side participant exists, that is a measurable zero Present
  // overlap rather than an ambiguous business outcome.
  const identityVerified =
    identity.identityConfidence === 'verified'
    && identity.expectedTeacherPresent;

  if (!identityVerified) {
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

  const reportCoverages: SameDayReportCoverage[] = evidence.attendanceReports.map(
    (report) => {
      const teachers = report.participantRecords.filter((participant) =>
        teacherIds.has(participant.participantRecordId));
      const learners = report.participantRecords.filter((participant) =>
        learnerIds.has(participant.participantRecordId));

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

  return {
    status: 'measured',
    evidenceId: evidence.id,
    calculationVersion: evidence.calculationVersion,
    attendanceEvidenceComplete: true,
    identityVerified: true,
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
