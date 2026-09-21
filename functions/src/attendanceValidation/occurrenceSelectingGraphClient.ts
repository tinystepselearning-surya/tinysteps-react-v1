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

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

function serviceDayWindow(session: SessionWindow): { startMs: number; endMs: number } {
  const scheduled = normalizeWindow(session);
  const istDate = new Date(scheduled.startMs + IST_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
  const utcMidnightMs = Date.parse(`${istDate}T00:00:00.000Z`);
  const startMs = utcMidnightMs - IST_OFFSET_MS;
  return { startMs, endMs: startMs + DAY_MS };
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
 * Selects all attendance reports belonging to the Tiny Steps service date in IST.
 *
 * Tiny Steps permits same-day reschedules, so the scheduled clock time is not an
 * occurrence discriminator. A class scheduled at 3pm may legitimately run at 5pm
 * or 6pm on the same service date. Multiple same-day reports are retained because
 * one student may take more than one class on the same day.
 *
 * Pagination and malformed timing metadata still fail closed because another page
 * or an un-timed report could contain additional same-day attendance.
 */
export function selectAttendanceReportForSession(
  page: GraphCollection<GraphMeetingAttendanceReport>,
  session: SessionWindow,
): GraphCollection<GraphMeetingAttendanceReport> {
  if (page['@odata.nextLink']) {
    throw ambiguous(
      'Attendance-report pagination prevents deterministic same-day occurrence selection.',
    );
  }

  const { startMs, endMs } = serviceDayWindow(session);
  const selected = page.value.filter((report) => {
    const reportStartMs = parseOptionalInstant(report.meetingStartDateTime);
    const reportEndMs = parseOptionalInstant(report.meetingEndDateTime);
    if (reportStartMs === null || reportEndMs === null || !(reportEndMs > reportStartMs)) {
      throw ambiguous(
        'Attendance-report timing metadata is incomplete; same-day occurrence selection would require guessing.',
      );
    }
    return overlapMs(startMs, endMs, reportStartMs, reportEndMs) > 0;
  });

  return { ...page, value: selected };
}

/**
 * Keeps transcript metadata from the same IST service date as the Tiny Steps class.
 *
 * Transcript pagination is preserved so evidence remains partial whenever another
 * page may contain additional same-day artifacts.
 */
export function selectTranscriptsForSession(
  page: GraphCollection<GraphCallTranscript>,
  session: SessionWindow,
): GraphCollection<GraphCallTranscript> {
  const { startMs, endMs } = serviceDayWindow(session);

  const value = page.value.filter((transcript) => {
    const createdMs = parseOptionalInstant(transcript.createdDateTime);
    const transcriptEndMs = parseOptionalInstant(transcript.endDateTime);

    if (createdMs !== null && transcriptEndMs !== null && transcriptEndMs >= createdMs) {
      return overlapMs(startMs, endMs, createdMs, transcriptEndMs) > 0;
    }
    if (createdMs !== null) {
      return createdMs >= startMs && createdMs < endMs;
    }
    if (transcriptEndMs !== null) {
      return transcriptEndMs > startMs && transcriptEndMs <= endMs;
    }
    return false;
  });

  return { ...page, value };
}

/**
 * Decorates the AV1 Graph client with AV2.1 occurrence selection while preserving the
 * existing collector contract. Every selected same-day attendance report reaches
 * the attendance-record fetch path.
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
