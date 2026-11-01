/**
 * AVS virtual-calendar gap detector.
 *
 * Since the October 2026 virtual-calendar cutover, reading/joining class does
 * not create a classSession. An unmarked real Teams class may therefore have
 * no operational session. This parent-scoped, on-demand detector creates ONLY
 * AVS sidecar evidence/cases. It never materializes or edits operational classes.
 */
import { createHash } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { bridgeEnrollmentIdentity } from './enrollmentIdentityBridge';
import { aggregateSameDayCoverage, buildSameDayCoverageObservation } from './sameDayCoverageEngine';
import { supportedPresentCountFromOverlap, AVS_BUSINESS_PRESENT_OVERLAP_SECONDS } from './businessOutcomeEngine';
import { createOccurrenceSelectingTeamsEvidenceGraphClient } from './occurrenceSelectingGraphClient';
import { collectTeamsEvidence, type AttendanceValidationEvidenceDocument, type ExpectedClassSessionSnapshot, type TeamsEvidenceGraphClient } from './teamsEvidenceCollector';
import { FirestoreAttendanceValidationEvidenceStore } from './evidenceStore';
import { resolveJoinUrlFromRecord } from './sessionJoinUrlFallback';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import type { MicrosoftGraphClient, GraphMeetingAttendanceReport } from './microsoftGraphClient';
import type { Av53ValidationCaseDocument } from './shadowRunner';

const IST_OFFSET_MS = 330 * 60_000;
const MAX_PARENT_ENROLLMENTS = 8;
const VIRTUAL_CUTOVER = '2026-10-12';
const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

export function teamsReportServiceDay(report: GraphMeetingAttendanceReport): string {
  const start = Date.parse(text(report.meetingStartDateTime));
  const end = Date.parse(text(report.meetingEndDateTime));
  if (!text(report.id) || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new HttpsError('failed-precondition', 'Teams report has incomplete time data; manual review required.');
  }
  return new Date(start + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function virtualCaseId(enrollmentId: string, day: string): string {
  return 'avs_virtual_' + createHash('sha256').update(enrollmentId + '|' + day).digest('hex').slice(0, 40);
}

function canonicalChildId(enrollment: Record<string, unknown>): string | null {
  const ids = new Set([
    text(enrollment.kidId),
    ...(Array.isArray(enrollment.kidIds) ? enrollment.kidIds.map(text) : []),
  ].filter(Boolean));
  return ids.size === 1 ? [...ids][0] : null;
}

function canonicalTeacherId(enrollment: Record<string, unknown>): string | null {
  const ids = new Set([
    text(enrollment.teacherId),
    ...(Array.isArray(enrollment.teacherIds) ? enrollment.teacherIds.map(text) : []),
  ].filter(Boolean));
  return ids.size === 1 ? [...ids][0] : null;
}

function learnerIdentityKeys(evidence: AttendanceValidationEvidenceDocument, learnerIds: Set<string>): Set<string> {
  const keys = new Set<string>();
  for (const report of evidence.attendanceReports) {
    for (const participant of report.participantRecords) {
      if (!learnerIds.has(participant.participantRecordId)) continue;
      // A reconnect may get a new guest id. The normalized guest display-name
      // hash is correlation only; it is never proof of identity on its own.
      const key = participant.displayNameHash
        || participant.emailAddressHash
        || participant.identityHints[0]?.idHash
        || participant.participantRecordId;
      keys.add(key);
    }
  }
  return keys;
}

export function classifyVirtualTeamsOccurrence(
  evidence: AttendanceValidationEvidenceDocument,
  registry: Av3StaffRegistrySnapshot,
  day: string,
): { businessOutcome: 'false_absent' | 'not_evaluable' | null; teamsPresent: number | null; seconds: number; reasons: string[]; identityIssues: string[]; occurrenceCount: number } {
  const identity = bridgeEnrollmentIdentity(evidence, registry.entries);
  const observed = buildSameDayCoverageObservation(evidence, identity, day, 'teacher_learner_overlap');
  const aggregate = aggregateSameDayCoverage([observed]);
  const learnerIds = new Set(identity.participantClassifications.filter(
    (item) => item.classification === 'learner_side',
  ).map((item) => item.participantRecordId));
  const oneLearner = learnerIdentityKeys(evidence, learnerIds).size === 1;
  const oneOccurrence = aggregate.occurrenceCount === 1;
  if (aggregate.status !== 'measured' || identity.identityConfidence !== 'verified'
    || !identity.expectedTeacherPresent || !oneLearner || !oneOccurrence) {
    return {
      businessOutcome: 'not_evaluable', teamsPresent: null, seconds: 0,
      reasons: ['virtual_teams_occurrence_requires_review', ...aggregate.issues,
        ...(!oneLearner ? ['learner_identity_ambiguous'] : []),
        ...(!oneOccurrence ? ['multiple_or_missing_teams_occurrences'] : [])],
      identityIssues: identity.issues, occurrenceCount: aggregate.occurrenceCount,
    };
  }
  const teamsPresent = Math.min(1, supportedPresentCountFromOverlap(aggregate.totalOverlapSeconds));
  return {
    businessOutcome: teamsPresent > 0 ? 'false_absent' : null,
    teamsPresent, seconds: aggregate.totalOverlapSeconds,
    reasons: teamsPresent > 0 ? ['virtual_calendar_teams_present_without_tiny_steps_attendance'] : [],
    identityIssues: [], occurrenceCount: 1,
  };
}

function makeVirtualCase(args: {
  id: string; day: string; enrollmentId: string; kidId: string; teacherId: string;
  evidence: AttendanceValidationEvidenceDocument;
  classified: ReturnType<typeof classifyVirtualTeamsOccurrence>;
}): Av53ValidationCaseDocument {
  const { id, day, enrollmentId, kidId, teacherId, evidence, classified } = args;
  const confirmed = classified.businessOutcome === 'false_absent';
  return {
    schemaVersion: 2, brick: 'AV5.3', id,
    runId: evidence.runId, evidenceId: evidence.id,
    observedAt: new Date().toISOString(), serviceDateYmd: day,
    classSessionId: null, enrollmentId, kidId, teacherId,
    studentName: null, teacherName: null, tinyStepsAttendance: null,
    validationDecision: confirmed ? 'present' : 'review',
    classification: confirmed ? 'MISSING_ATTENDANCE' : 'AMBIGUOUS',
    recommendedAction: 'review', resolutionStatus: 'needs_review',
    reasons: classified.reasons as Av53ValidationCaseDocument['reasons'],
    sourceClassificationReasons: [], proofIssues: [],
    identityIssues: classified.identityIssues as Av53ValidationCaseDocument['identityIssues'],
    staffRegistryIssues: [],
    sameDayCoverageSeconds: confirmed ? classified.seconds : null,
    sameDayPresentSessionCount: 0, sameDayRequiredOverlapSeconds: AVS_BUSINESS_PRESENT_OVERLAP_SECONDS,
    sameDayOccurrenceCount: classified.occurrenceCount,
    sameDayEvidenceEvaluable: confirmed,
    businessOutcome: classified.businessOutcome,
    teamsSupportedPresentCount: confirmed ? 1 : null,
    tinyStepsPresentCount: 0,
    businessDifferenceCount: confirmed ? 1 : 0,
    groupEvidenceIds: [evidence.id],
    inputFingerprint: createHash('sha256').update(JSON.stringify({
      evidenceId: evidence.id, day, enrollmentId, kidId, teacherId,
      businessOutcome: classified.businessOutcome, seconds: classified.seconds,
    })).digest('hex'),
    operationalMutationAllowed: false,
  };
}

/** All writes are restricted to validation-owned sidecars. */
export async function discoverTeamsOnlyParentMonth(params: {
  db: Firestore; enrollmentIds: readonly string[];
  range: { fromDate: string; toDate: string };
  registry: Av3StaffRegistrySnapshot;
  graph: MicrosoftGraphClient;
  organizerUserId: string;
}): Promise<{ checkedEnrollmentCount: number; teamsOnlyCaseCount: number; ambiguousCount: number; graphCalls: number }> {
  const { db, enrollmentIds, registry, graph, organizerUserId } = params;
  if (enrollmentIds.length > MAX_PARENT_ENROLLMENTS) {
    throw new HttpsError('failed-precondition', 'More than eight enrollments require a bounded AVS review; month not fully checked.');
  }
  if (!enrollmentIds.length || params.range.toDate < VIRTUAL_CUTOVER) {
    return { checkedEnrollmentCount: 0, teamsOnlyCaseCount: 0, ambiguousCount: 0, graphCalls: 0 };
  }
  const snapshots = await db.getAll(...enrollmentIds.map((id) => db.collection('enrollments').doc(id)));
  const candidates: Array<{ id: string; row: Record<string, unknown>; kidId: string; teacherId: string; url: string }> = [];
  for (const snap of snapshots) {
    if (!snap.exists) continue;
    const row = (snap.data() || {}) as Record<string, unknown>;
    const kidId = canonicalChildId(row);
    const teacherId = canonicalTeacherId(row);
    const url = resolveJoinUrlFromRecord(row);
    if (!kidId || !teacherId || !url) {
      throw new HttpsError('failed-precondition', 'Enrollment Teams identity or link is incomplete; month needs technical review.');
    }
    candidates.push({ id: snap.id, row, kidId, teacherId, url });
  }
  // Shared links are safe for expected class validation, but not for
  // attributing an otherwise orphaned occurrence to one particular learner.
  if (new Set(candidates.map((c) => c.url)).size !== candidates.length) {
    throw new HttpsError('failed-precondition', 'Shared parent Teams links require review before missing-session classification.');
  }

  let teamsOnlyCaseCount = 0;
  let ambiguousCount = 0;
  let graphCalls = 0;
  for (const candidate of candidates) {
    graphCalls += 1;
    const meeting = await graph.resolveOnlineMeetingByJoinUrl(organizerUserId, candidate.url);
    if (!meeting) throw new HttpsError('failed-precondition', 'Enrollment Teams meeting could not be resolved.');
    graphCalls += 1;
    const reports = await graph.listAttendanceReportsBounded(organizerUserId, meeting.id);
    const byDay = new Map<string, GraphMeetingAttendanceReport[]>();
    for (const report of reports.value) {
      const day = teamsReportServiceDay(report);
      if (day < params.range.fromDate || day > params.range.toDate || day < VIRTUAL_CUTOVER) continue;
      const matching = byDay.get(day) ?? [];
      matching.push(report);
      byDay.set(day, matching);
    }

    // Existing operational sessions are handled by the normal group-first AVS
    // path. Do not emit a second case for the same enrollment and date.
    const existing = await db.collection('classSessions')
      .where('enrollmentId', '==', candidate.id)
      .where('date', '>=', params.range.fromDate)
      .where('date', '<=', params.range.toDate).limit(101).get();
    if (existing.size > 100) {
      throw new HttpsError('failed-precondition', 'Enrollment class-session check exceeded AVS bound.');
    }
    const coveredDays = new Set(existing.docs.map((doc) => text(doc.data().date)));
    const evidenceStore = new FirestoreAttendanceValidationEvidenceStore(db);
    const eligibleIds = new Set<string>();

    for (const [day, dayReports] of byDay) {
      if (coveredDays.has(day)) continue;
      const id = virtualCaseId(candidate.id, day);
      eligibleIds.add(id);
      const first = dayReports[0];
      const session: ExpectedClassSessionSnapshot = {
        classSessionId: id, enrollmentId: candidate.id,
        kidId: candidate.kidId, teacherId: candidate.teacherId,
        courseId: text(candidate.row.courseId) || null,
        scheduledStartDateTime: first.meetingStartDateTime!,
        scheduledEndDateTime: first.meetingEndDateTime!,
        joinUrl: candidate.url, existingAttendanceStatus: null,
      };
      const client: TeamsEvidenceGraphClient = {
        resolveOnlineMeetingByJoinUrl: async () => meeting,
        listAttendanceReports: async () => ({ value: reports.value }),
        listAttendanceRecords: (...args) => { graphCalls += 1; return graph.listAttendanceRecords(...args); },
        listTranscripts: (...args) => { graphCalls += 1; return graph.listTranscripts(...args); },
      };
      const collected = await collectTeamsEvidence({
        runId: 'virtual_' + createHash('sha256').update(id + Date.now()).digest('hex').slice(0, 32),
        organizerUserId, session,
      }, {
        graphClient: createOccurrenceSelectingTeamsEvidenceGraphClient(client, session),
        store: evidenceStore,
      });
      const classified = classifyVirtualTeamsOccurrence(collected.evidence, registry, day);
      const caseRef = db.collection('attendanceValidationCases').doc(id);
      if (classified.businessOutcome === null) {
        eligibleIds.delete(id);
        continue;
      }
      const output = makeVirtualCase({ id, day, enrollmentId: candidate.id,
        kidId: candidate.kidId, teacherId: candidate.teacherId,
        evidence: collected.evidence, classified });
      await db.runTransaction(async (tx) => {
        const nowSessions = await tx.get(db.collection('classSessions')
          .where('enrollmentId', '==', candidate.id).where('date', '==', day).limit(1));
        if (nowSessions.empty) tx.set(caseRef, output);
        else tx.delete(caseRef);
      });
      if (classified.businessOutcome === 'false_absent') teamsOnlyCaseCount += 1;
      else ambiguousCount += 1;
    }

    // Safe reruns: remove stale synthetic evidence cases only after all Graph
    // report pages were read successfully. Never touch real class-session cases.
    const from = params.range.fromDate > VIRTUAL_CUTOVER ? params.range.fromDate : VIRTUAL_CUTOVER;
    const staleCandidateRefs = [];
    for (let ms = Date.parse(from + 'T00:00:00Z'); ms <= Date.parse(params.range.toDate + 'T00:00:00Z'); ms += 86_400_000) {
      const day = new Date(ms).toISOString().slice(0, 10);
      const id = virtualCaseId(candidate.id, day);
      if (!eligibleIds.has(id) || coveredDays.has(day)) {
        staleCandidateRefs.push(db.collection('attendanceValidationCases').doc(id));
      }
    }
    if (staleCandidateRefs.length) {
      const prior = await db.getAll(...staleCandidateRefs);
      const stale = prior.filter((snap) => snap.exists);
      if (stale.length) {
        const batch = db.batch();
        for (const snap of stale) batch.delete(snap.ref);
        await batch.commit();
      }
    }
  }
  return { checkedEnrollmentCount: candidates.length, teamsOnlyCaseCount, ambiguousCount, graphCalls };
}
