import {
  MicrosoftGraphError,
  type GraphCallTranscript,
  type GraphCollection,
  type GraphMeetingAttendanceReport,
} from './microsoftGraphClient';
import type {
  ExpectedClassSessionSnapshot,
  TeamsEvidenceGraphClient,
} from './teamsEvidenceCollector';

const TRANSCRIPT_BOUNDARY_TOLERANCE_MS = 15 * 60 * 1000;

type SessionWindow = Pick<
  ExpectedClassSessionSnapshot,
  'scheduledStartDateTime' | 'scheduledEndDateTime'
>;

function parseRequiredInstant(value: string, name: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`${name} must be a valid date-time.`);
  }
  return parsed;
}

function parseOptionalInstant(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeWindow(session: SessionWindow): { startMs: number; endMs: number } {
  const startMs = parseRequiredInstant(session.scheduledStartDateTime, 'scheduledStartDateTime');
  const endMs = parseRequiredInstant(session.scheduledEndDateTime, 'scheduledEndDateTime');
  if (!(endMs > startMs)) {
    throw new RangeError('scheduledEndDateTime must be after scheduledStartDateTime.');
  }
  return { startMs, endMs };
}

function overlapMs(
  leftStartMs: number,
  leftEndMs: number,
  rightStartMs: number,
  rightEndMs: number,
): number {
  return Math.max(0, Math.min(leftEndMs, rightEndMs) - Math.max(leftStartMs, rightStartMs));
}

function ambiguous(message: string): MicrosoftGraphError {
  return new MicrosoftGraphError({
    kind: 'ambiguous_result',
    status: 409,
    message,
  });
}

/**
 * Selects exactly one attendance report for the scheduled Tiny Steps class.
 *
 * Attendance reports are the authoritative occurrence discriminator because they expose
 * meetingStartDateTime/meetingEndDateTime for each recurring-meeting occurrence.
 * The selector never guesses when pagination, malformed timing metadata, or an exact
 * overlap tie means another occurrence could be authoritative.
 */
export function selectAttendanceReportForSession(
  page: GraphCollection<GraphMeetingAttendanceReport>,
  session: SessionWindow,
): GraphCollection<GraphMeetingAttendanceReport> {
  if (page['@odata.nextLink']) {
    throw ambiguous(
      'Attendance-report pagination prevents deterministic recurring-meeting occurrence selection.',
    );
  }

  const { startMs, endMs } = normalizeWindow(session);
  const scored = page.value.map((report) => {
    const reportStartMs = parseOptionalInstant(report.meetingStartDateTime);
    const reportEndMs = parseOptionalInstant(report.meetingEndDateTime);
    if (reportStartMs === null || reportEndMs === null || !(reportEndMs > reportStartMs)) {
      throw ambiguous(
        'Attendance-report timing metadata is incomplete; recurring-meeting occurrence selection would require guessing.',
      );
    }
    return {
      report,
      overlapMs: overlapMs(startMs, endMs, reportStartMs, reportEndMs),
    };
  });

  const overlapping = scored.filter((candidate) => candidate.overlapMs > 0);
  if (overlapping.length === 0) {
    return { ...page, value: [] };
  }

  const maxOverlapMs = Math.max(...overlapping.map((candidate) => candidate.overlapMs));
  const winners = overlapping.filter((candidate) => candidate.overlapMs === maxOverlapMs);
  if (winners.length !== 1) {
    throw ambiguous(
      'Multiple attendance reports overlap the scheduled Tiny Steps class equally; the authoritative occurrence is ambiguous.',
    );
  }

  return { ...page, value: [winners[0].report] };
}

/**
 * Keeps only transcript artifacts whose timing metadata belongs to the scheduled class.
 * A small boundary tolerance covers Graph artifact finalization immediately after class end.
 * Invalid/missing transcript timestamps are not guessed; pagination is preserved so AV2
 * continues to mark the evidence partial when another page may contain relevant artifacts.
 */
export function selectTranscriptsForSession(
  page: GraphCollection<GraphCallTranscript>,
  session: SessionWindow,
): GraphCollection<GraphCallTranscript> {
  const { startMs, endMs } = normalizeWindow(session);
  const expandedStartMs = startMs - TRANSCRIPT_BOUNDARY_TOLERANCE_MS;
  const expandedEndMs = endMs + TRANSCRIPT_BOUNDARY_TOLERANCE_MS;

  const value = page.value.filter((transcript) => {
    const createdMs = parseOptionalInstant(transcript.createdDateTime);
    const transcriptEndMs = parseOptionalInstant(transcript.endDateTime);

    if (createdMs !== null && transcriptEndMs !== null && transcriptEndMs >= createdMs) {
      return overlapMs(expandedStartMs, expandedEndMs, createdMs, transcriptEndMs) > 0;
    }
    if (createdMs !== null) {
      return createdMs >= expandedStartMs && createdMs <= expandedEndMs;
    }
    if (transcriptEndMs !== null) {
      return transcriptEndMs >= expandedStartMs && transcriptEndMs <= expandedEndMs;
    }
    return false;
  });

  return { ...page, value };
}

/**
 * Decorates the AV1 Graph client with AV2.1 occurrence selection while preserving the
 * existing collector contract. Only the selected attendance report can reach the
 * attendance-record fetch path.
 */
export function createOccurrenceSelectingTeamsEvidenceGraphClient(
  baseClient: TeamsEvidenceGraphClient,
  session: SessionWindow,
): TeamsEvidenceGraphClient {
  return {
    resolveOnlineMeetingByJoinUrl: (organizerUserId, joinWebUrl) =>
      baseClient.resolveOnlineMeetingByJoinUrl(organizerUserId, joinWebUrl),

    async listTranscripts(organizerUserId, onlineMeetingId, top) {
      const page = await baseClient.listTranscripts(organizerUserId, onlineMeetingId, top);
      return selectTranscriptsForSession(page, session);
    },

    async listAttendanceReports(organizerUserId, onlineMeetingId) {
      const page = await baseClient.listAttendanceReports(organizerUserId, onlineMeetingId);
      return selectAttendanceReportForSession(page, session);
    },

    listAttendanceRecords: (organizerUserId, onlineMeetingId, reportId) =>
      baseClient.listAttendanceRecords(organizerUserId, onlineMeetingId, reportId),
  };
}
