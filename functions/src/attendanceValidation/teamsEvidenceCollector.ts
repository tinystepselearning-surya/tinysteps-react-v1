import { createHash } from 'crypto';
import {
  MicrosoftGraphError,
  type GraphAttendanceInterval,
  type GraphAttendanceRecord,
  type GraphCallTranscript,
  type GraphCollection,
  type GraphMeetingAttendanceReport,
  type GraphOnlineMeeting,
  type MicrosoftGraphErrorKind,
} from './microsoftGraphClient';
import {
  calculateParticipantIntervalMetrics,
  type ParticipantIntervalMetrics,
} from './evidenceIntervals';

export const AV2_EVIDENCE_SCHEMA_VERSION = 1;
export const AV2_CALCULATION_VERSION = 2;
export const AV2_EVIDENCE_SOURCE = 'microsoft_teams_graph' as const;

export type CanonicalAttendanceStatus = 'present' | 'absent' | 'rescheduled';
export type EvidenceCollectionStatus =
  | 'complete'
  | 'partial'
  | 'missing_reference'
  | 'meeting_not_found'
  | 'failed';

export type EvidenceCollectionIssueKind =
  | MicrosoftGraphErrorKind
  | 'missing_join_url'
  | 'meeting_not_found'
  | 'unexpected_error';

export type EvidenceCollectionStage =
  | 'session_reference'
  | 'meeting_resolution'
  | 'transcripts'
  | 'attendance_reports'
  | 'attendance_records';

export interface ExpectedClassSessionSnapshot {
  classSessionId: string;
  enrollmentId: string | null;
  teacherId: string | null;
  kidId: string | null;
  courseId: string | null;
  scheduledStartDateTime: string;
  scheduledEndDateTime: string;
  joinUrl: string | null;
  existingAttendanceStatus: CanonicalAttendanceStatus | null;
}

export interface TeamsEvidenceCollectionRequest {
  runId: string;
  organizerUserId: string;
  session: ExpectedClassSessionSnapshot;
}

export interface TeamsEvidenceGraphClient {
  resolveOnlineMeetingByJoinUrl(
    organizerUserId: string,
    joinWebUrl: string,
  ): Promise<GraphOnlineMeeting | null>;
  listTranscripts(
    organizerUserId: string,
    onlineMeetingId: string,
    top?: number,
  ): Promise<GraphCollection<GraphCallTranscript>>;
  listAttendanceReports(
    organizerUserId: string,
    onlineMeetingId: string,
  ): Promise<GraphCollection<GraphMeetingAttendanceReport>>;
  listAttendanceRecords(
    organizerUserId: string,
    onlineMeetingId: string,
    reportId: string,
  ): Promise<GraphCollection<GraphAttendanceRecord>>;
}

export interface StoredEvidenceIssue {
  stage: EvidenceCollectionStage;
  reportId: string | null;
  kind: EvidenceCollectionIssueKind;
  httpStatus: number | null;
  graphCode: string | null;
  innerCode: string | null;
  retryAfterMs: number | null;
}

export interface StoredRawAttendanceInterval {
  joinDateTime: string | null;
  leaveDateTime: string | null;
  durationInSeconds: number | null;
}

export interface StoredIdentityHint {
  kind: string;
  idHash: string;
}

export interface AttendanceParticipantEvidence {
  participantRecordId: string;
  role: string | null;
  emailAddressHash: string | null;
  identityHints: StoredIdentityHint[];
  microsoftTotalAttendanceInSeconds: number | null;
  rawAttendanceIntervals: StoredRawAttendanceInterval[];
  metrics: ParticipantIntervalMetrics;
}

export interface AttendanceReportEvidence {
  reportId: string;
  meetingStartDateTime: string | null;
  meetingEndDateTime: string | null;
  totalParticipantCount: number | null;
  recordsComplete: boolean;
  nextRecordsPagePresent: boolean;
  recordsIssue: StoredEvidenceIssue | null;
  participantRecords: AttendanceParticipantEvidence[];
}

export interface TranscriptEvidenceMetadata {
  transcriptId: string;
  createdDateTime: string | null;
  endDateTime: string | null;
  contentUrlAvailable: boolean;
}

export interface AttendanceValidationEvidenceDocument {
  schemaVersion: number;
  calculationVersion: number;
  id: string;
  runId: string;
  source: typeof AV2_EVIDENCE_SOURCE;
  collectionStatus: EvidenceCollectionStatus;
  collectedAt: string;
  organizerUserId: string;
  session: {
    classSessionId: string;
    enrollmentId: string | null;
    teacherId: string | null;
    kidId: string | null;
    courseId: string | null;
    scheduledStartDateTime: string;
    scheduledEndDateTime: string;
    scheduledDurationSeconds: number;
    joinUrlHash: string | null;
    existingAttendanceStatus: CanonicalAttendanceStatus | null;
  };
  meeting: {
    onlineMeetingId: string;
    startDateTime: string | null;
    endDateTime: string | null;
    creationDateTime: string | null;
    meetingType: string | null;
  } | null;
  transcripts: TranscriptEvidenceMetadata[];
  attendanceReports: AttendanceReportEvidence[];
  completeness: {
    transcriptsComplete: boolean;
    attendanceReportsComplete: boolean;
    attendanceRecordsComplete: boolean;
    nextTranscriptPagePresent: boolean;
    nextAttendanceReportPagePresent: boolean;
  };
  artifactAvailability: {
    transcriptAvailable: boolean;
    attendanceReportAvailable: boolean;
    recordingAvailable: null;
  };
  issues: StoredEvidenceIssue[];
}

export interface AttendanceValidationRunDocument {
  schemaVersion: number;
  id: string;
  brick: 'AV2';
  source: typeof AV2_EVIDENCE_SOURCE;
  startedAt: string;
  completedAt: string;
  status: EvidenceCollectionStatus;
  classSessionIds: string[];
  evidenceIds: string[];
  operationalMutationAllowed: false;
}

export interface AttendanceValidationEvidenceStore {
  saveCollectionResult(
    run: AttendanceValidationRunDocument,
    evidence: AttendanceValidationEvidenceDocument,
  ): Promise<void>;
}

export interface CollectTeamsEvidenceDependencies {
  graphClient: TeamsEvidenceGraphClient;
  store: AttendanceValidationEvidenceStore;
  now?: () => Date;
}

export interface TeamsEvidenceCollectionResult {
  run: AttendanceValidationRunDocument;
  evidence: AttendanceValidationEvidenceDocument;
}

function requireText(value: string, name: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new TypeError(`${name} is required.`);
  return normalized;
}

function requireRunId(value: string): string {
  const normalized = requireText(value, 'runId');
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(normalized)) {
    throw new TypeError('runId must contain only letters, numbers, underscores, or hyphens.');
  }
  return normalized;
}

function optionalText(value: string | undefined | null): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function finiteNumber(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeIsoDateTime(value: string, name: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new TypeError(`${name} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

function secondsBetween(startDateTime: string, endDateTime: string): number {
  return Math.round(((Date.parse(endDateTime) - Date.parse(startDateTime)) / 1000) * 1000) / 1000;
}

export function hashAttendanceEvidenceValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function buildEvidenceId(runId: string, classSessionId: string, onlineMeetingId: string | null): string {
  const digest = hashAttendanceEvidenceValue(
    `${runId}\n${classSessionId}\n${onlineMeetingId ?? 'no-meeting'}`,
  );
  return `av2_${digest.slice(0, 40)}`;
}

function normalizeSession(session: ExpectedClassSessionSnapshot): AttendanceValidationEvidenceDocument['session'] {
  const classSessionId = requireText(session.classSessionId, 'classSessionId');
  const scheduledStartDateTime = normalizeIsoDateTime(
    session.scheduledStartDateTime,
    'scheduledStartDateTime',
  );
  const scheduledEndDateTime = normalizeIsoDateTime(
    session.scheduledEndDateTime,
    'scheduledEndDateTime',
  );
  const scheduledDurationSeconds = secondsBetween(scheduledStartDateTime, scheduledEndDateTime);
  if (!(scheduledDurationSeconds > 0)) {
    throw new RangeError('scheduledEndDateTime must be after scheduledStartDateTime.');
  }

  const joinUrl = optionalText(session.joinUrl);
  return {
    classSessionId,
    enrollmentId: optionalText(session.enrollmentId),
    teacherId: optionalText(session.teacherId),
    kidId: optionalText(session.kidId),
    courseId: optionalText(session.courseId),
    scheduledStartDateTime,
    scheduledEndDateTime,
    scheduledDurationSeconds,
    joinUrlHash: joinUrl ? hashAttendanceEvidenceValue(joinUrl) : null,
    existingAttendanceStatus: session.existingAttendanceStatus,
  };
}

function storedIssue(
  stage: EvidenceCollectionStage,
  error: unknown,
  reportId: string | null = null,
): StoredEvidenceIssue {
  if (error instanceof MicrosoftGraphError) {
    return {
      stage,
      reportId,
      kind: error.kind,
      httpStatus: error.status,
      graphCode: error.graphCode,
      innerCode: error.innerCode,
      retryAfterMs: error.retryAfterMs,
    };
  }

  return {
    stage,
    reportId,
    kind: 'unexpected_error',
    httpStatus: null,
    graphCode: null,
    innerCode: null,
    retryAfterMs: null,
  };
}

function syntheticIssue(
  stage: EvidenceCollectionStage,
  kind: 'missing_join_url' | 'meeting_not_found',
): StoredEvidenceIssue {
  return {
    stage,
    reportId: null,
    kind,
    httpStatus: null,
    graphCode: null,
    innerCode: null,
    retryAfterMs: null,
  };
}

function sanitizeRawIntervals(
  intervals: readonly GraphAttendanceInterval[] | undefined,
): StoredRawAttendanceInterval[] {
  return (intervals ?? []).map((interval) => ({
    joinDateTime: optionalText(interval.joinDateTime),
    leaveDateTime: optionalText(interval.leaveDateTime),
    durationInSeconds: finiteNumber(interval.durationInSeconds),
  }));
}

function identityHints(identity: unknown): StoredIdentityHint[] {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return [];
  const record = identity as Record<string, unknown>;
  const hints: StoredIdentityHint[] = [];

  const directId = typeof record.id === 'string' ? record.id.trim() : '';
  if (directId) {
    hints.push({ kind: 'identity', idHash: hashAttendanceEvidenceValue(directId) });
  }

  for (const kind of Object.keys(record).sort()) {
    const candidate = record[kind];
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const nested = candidate as Record<string, unknown>;
    const id = typeof nested.id === 'string' ? nested.id.trim() : '';
    if (!id) continue;
    hints.push({ kind, idHash: hashAttendanceEvidenceValue(id) });
  }

  return hints;
}

function participantEvidence(
  record: GraphAttendanceRecord,
  scheduledStartDateTime: string,
  scheduledEndDateTime: string,
): AttendanceParticipantEvidence {
  const normalizedEmail = optionalText(record.emailAddress)?.toLowerCase() ?? null;
  return {
    participantRecordId: requireText(record.id, 'participantRecordId'),
    role: optionalText(record.role),
    emailAddressHash: normalizedEmail
      ? hashAttendanceEvidenceValue(normalizedEmail)
      : null,
    identityHints: identityHints(record.identity),
    microsoftTotalAttendanceInSeconds: finiteNumber(record.totalAttendanceInSeconds),
    rawAttendanceIntervals: sanitizeRawIntervals(record.attendanceIntervals),
    metrics: calculateParticipantIntervalMetrics(
      record.attendanceIntervals,
      scheduledStartDateTime,
      scheduledEndDateTime,
    ),
  };
}

function meetingMetadata(meeting: GraphOnlineMeeting): NonNullable<AttendanceValidationEvidenceDocument['meeting']> {
  return {
    onlineMeetingId: requireText(meeting.id, 'onlineMeetingId'),
    startDateTime: optionalText(meeting.startDateTime),
    endDateTime: optionalText(meeting.endDateTime),
    creationDateTime: optionalText(meeting.creationDateTime),
    meetingType: optionalText(meeting.meetingType),
  };
}

function currentIso(now: () => Date): string {
  return now().toISOString();
}

async function persist(
  request: TeamsEvidenceCollectionRequest,
  session: AttendanceValidationEvidenceDocument['session'],
  startedAt: string,
  status: EvidenceCollectionStatus,
  organizerUserId: string,
  meeting: AttendanceValidationEvidenceDocument['meeting'],
  transcripts: TranscriptEvidenceMetadata[],
  attendanceReports: AttendanceReportEvidence[],
  completeness: AttendanceValidationEvidenceDocument['completeness'],
  issues: StoredEvidenceIssue[],
  deps: CollectTeamsEvidenceDependencies,
): Promise<TeamsEvidenceCollectionResult> {
  const completedAt = currentIso(deps.now ?? (() => new Date()));
  const evidenceId = buildEvidenceId(
    request.runId,
    session.classSessionId,
    meeting?.onlineMeetingId ?? null,
  );
  const evidence: AttendanceValidationEvidenceDocument = {
    schemaVersion: AV2_EVIDENCE_SCHEMA_VERSION,
    calculationVersion: AV2_CALCULATION_VERSION,
    id: evidenceId,
    runId: request.runId,
    source: AV2_EVIDENCE_SOURCE,
    collectionStatus: status,
    collectedAt: completedAt,
    organizerUserId,
    session,
    meeting,
    transcripts,
    attendanceReports,
    completeness,
    artifactAvailability: {
      transcriptAvailable: transcripts.length > 0,
      attendanceReportAvailable: attendanceReports.length > 0,
      recordingAvailable: null,
    },
    issues,
  };
  const run: AttendanceValidationRunDocument = {
    schemaVersion: AV2_EVIDENCE_SCHEMA_VERSION,
    id: request.runId,
    brick: 'AV2',
    source: AV2_EVIDENCE_SOURCE,
    startedAt,
    completedAt,
    status,
    classSessionIds: [session.classSessionId],
    evidenceIds: [evidenceId],
    operationalMutationAllowed: false,
  };

  await deps.store.saveCollectionResult(run, evidence);
  return { run, evidence };
}

export async function collectTeamsEvidence(
  input: TeamsEvidenceCollectionRequest,
  deps: CollectTeamsEvidenceDependencies,
): Promise<TeamsEvidenceCollectionResult> {
  const runId = requireRunId(input.runId);
  const request: TeamsEvidenceCollectionRequest = { ...input, runId };
  const organizerUserId = requireText(input.organizerUserId, 'organizerUserId');
  const session = normalizeSession(input.session);
  const now = deps.now ?? (() => new Date());
  const startedAt = currentIso(now);
  const joinUrl = optionalText(input.session.joinUrl);

  if (!joinUrl) {
    const issue = syntheticIssue('session_reference', 'missing_join_url');
    return persist(
      request,
      session,
      startedAt,
      'missing_reference',
      organizerUserId,
      null,
      [],
      [],
      {
        transcriptsComplete: false,
        attendanceReportsComplete: false,
        attendanceRecordsComplete: false,
        nextTranscriptPagePresent: false,
        nextAttendanceReportPagePresent: false,
      },
      [issue],
      { ...deps, now },
    );
  }

  let meeting: GraphOnlineMeeting | null;
  try {
    meeting = await deps.graphClient.resolveOnlineMeetingByJoinUrl(organizerUserId, joinUrl);
  } catch (error) {
    return persist(
      request,
      session,
      startedAt,
      'failed',
      organizerUserId,
      null,
      [],
      [],
      {
        transcriptsComplete: false,
        attendanceReportsComplete: false,
        attendanceRecordsComplete: false,
        nextTranscriptPagePresent: false,
        nextAttendanceReportPagePresent: false,
      },
      [storedIssue('meeting_resolution', error)],
      { ...deps, now },
    );
  }

  if (!meeting) {
    const issue = syntheticIssue('meeting_resolution', 'meeting_not_found');
    return persist(
      request,
      session,
      startedAt,
      'meeting_not_found',
      organizerUserId,
      null,
      [],
      [],
      {
        transcriptsComplete: true,
        attendanceReportsComplete: true,
        attendanceRecordsComplete: true,
        nextTranscriptPagePresent: false,
        nextAttendanceReportPagePresent: false,
      },
      [issue],
      { ...deps, now },
    );
  }

  const storedMeeting = meetingMetadata(meeting);
  const issues: StoredEvidenceIssue[] = [];

  // AVS business reconciliation uses Teams attendance only. Transcript metadata
  // does not affect Verified / False Present / False Absent, so normal AVS
  // validation deliberately makes no transcript Graph request.
  const transcripts: TranscriptEvidenceMetadata[] = [];
  const transcriptsComplete = true;
  const nextTranscriptPagePresent = false;

  let reportPage: GraphCollection<GraphMeetingAttendanceReport> | null = null;
  let attendanceReportsComplete = false;
  let nextAttendanceReportPagePresent = false;

  try {
    reportPage = await deps.graphClient.listAttendanceReports(
      organizerUserId,
      storedMeeting.onlineMeetingId,
    );
    nextAttendanceReportPagePresent = Boolean(reportPage['@odata.nextLink']);
    attendanceReportsComplete = !nextAttendanceReportPagePresent;
  } catch (error) {
    issues.push(storedIssue('attendance_reports', error));
  }

  const attendanceReports: AttendanceReportEvidence[] = [];
  if (reportPage) {
    for (const report of reportPage.value) {
      const reportId = requireText(report.id, 'attendanceReportId');
      let recordsComplete = false;
      let nextRecordsPagePresent = false;
      let recordsIssue: StoredEvidenceIssue | null = null;
      let participantRecords: AttendanceParticipantEvidence[] = [];

      try {
        const recordsPage = await deps.graphClient.listAttendanceRecords(
          organizerUserId,
          storedMeeting.onlineMeetingId,
          reportId,
        );
        nextRecordsPagePresent = Boolean(recordsPage['@odata.nextLink']);
        recordsComplete = !nextRecordsPagePresent;
        participantRecords = recordsPage.value.map((record) => participantEvidence(
          record,
          session.scheduledStartDateTime,
          session.scheduledEndDateTime,
        ));
      } catch (error) {
        recordsIssue = storedIssue('attendance_records', error, reportId);
        issues.push(recordsIssue);
      }

      attendanceReports.push({
        reportId,
        meetingStartDateTime: optionalText(report.meetingStartDateTime),
        meetingEndDateTime: optionalText(report.meetingEndDateTime),
        totalParticipantCount: finiteNumber(report.totalParticipantCount),
        recordsComplete,
        nextRecordsPagePresent,
        recordsIssue,
        participantRecords,
      });
    }
  }

  const attendanceRecordsComplete = reportPage !== null
    && attendanceReports.every((report) => report.recordsComplete);
  const hasIncompletePage =
    !attendanceReportsComplete
    || !attendanceRecordsComplete;
  const status: EvidenceCollectionStatus = issues.length > 0 || hasIncompletePage
    ? 'partial'
    : 'complete';

  return persist(
    request,
    session,
    startedAt,
    status,
    organizerUserId,
    storedMeeting,
    transcripts,
    attendanceReports,
    {
      transcriptsComplete,
      attendanceReportsComplete,
      attendanceRecordsComplete,
      nextTranscriptPagePresent,
      nextAttendanceReportPagePresent,
    },
    issues,
    { ...deps, now },
  );
}
