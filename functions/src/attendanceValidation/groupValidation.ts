import { ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION } from './dirtySessionMarker';
import { isDeepStrictEqual } from 'util';
import { createHash } from 'crypto';
import type { Firestore, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { FieldPath } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { classifyCachedEvidenceFreshness } from './evidenceFreshness';
import { bridgeEnrollmentIdentity } from './enrollmentIdentityBridge';
import { aggregateSameDayCoverage, buildSameDayCoverageObservation } from './sameDayCoverageEngine';
import { supportedPresentCountFromOverlap } from './businessOutcomeEngine';
import { normalizeTinyStepsAttendance } from './reconciliationEngine';
import {
  attendanceEntryForKid, sameDayGroupDescriptor, isAvsPresentCapEligibleSession,
  runAv53Shadow, assertAvsBusinessPersistenceInvariant, type Av53LoadedWorkItem,
  type Av53ValidationCaseDocument,
} from './shadowRunner';
import type { AttendanceValidationEvidenceDocument } from './teamsEvidenceCollector';
import type { Av3StaffRegistrySnapshot } from './staffIdentityRegistry';
import { getAvsScopedDocuments } from './parentScope';

export interface AvsRangeCursor { date: string; sessionId: string }
export interface GroupSession { id: string; data: Record<string, unknown> }

/** Resolve one exact session to its bounded canonical same-day business group. */
export async function loadAvsBusinessGroupForSession(db: Firestore, classSessionId: string, kidId?: string): Promise<GroupSession[]> {
  const session = await db.collection('classSessions').doc(classSessionId).get();
  if (!session.exists) throw new HttpsError('not-found', 'Class session not found.');
  const data = session.data() as Record<string, unknown>;
  const date = String(data.date ?? '');
  const descriptor = sameDayGroupDescriptor(date, data, null);
  if (!descriptor || (kidId && descriptor.kidId !== kidId)) {
    throw new HttpsError('failed-precondition', 'Session does not match a canonical AVS student and teacher group.');
  }
  const byId = new Map<string, GroupSession>([[classSessionId, { id: classSessionId, data }]]);
  // Canonical Tiny Steps sessions identify learners with kidId/kidIds. Legacy
  // studentId/childId aliases are intentionally excluded from live AVS grouping
  // because they can fan out to unrelated historical rows and falsely mark a
  // normal one-class day as incomplete.
  for (const [field, op] of [['kidId', '=='], ['kidIds', 'array-contains']] as const) {
    const found = await db.collection('classSessions').where('date', '==', date)
      .where(field, op, descriptor.kidId).limit(101).get();
    if (found.size >= 101) throw new HttpsError('failed-precondition', 'Same-day canonical learner context exceeds the 100-session safety bound.');
    for (const doc of found.docs) {
      if (sameDayGroupDescriptor(date, doc.data(), null)?.key === descriptor.key) {
        byId.set(doc.id, { id: doc.id, data: doc.data() });
      }
    }
  }
  if (byId.size > 100) throw new HttpsError('failed-precondition', 'Business group exceeds the 100-session safety bound.');
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}
export function normalizeAvsRangeCursor(value: unknown, from: string, to: string): AvsRangeCursor | null {
  if (value == null) return null;
  const cursor = value as AvsRangeCursor;
  if (typeof cursor.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(cursor.date)
    || cursor.date < from || cursor.date > to || typeof cursor.sessionId !== 'string'
    || !cursor.sessionId || cursor.sessionId.length > 240 || (cursor.sessionId.includes('/') || [...cursor.sessionId].some((char) => char.charCodeAt(0) < 32))) {
    throw new HttpsError('invalid-argument', 'Invalid validation cursor.');
  }
  return { date: cursor.date, sessionId: cursor.sessionId };
}

export async function discoverAvsRangeGroups(
  db: Firestore, range: { fromDate: string; toDate: string },
  enrollmentIds: readonly string[] | null, cursor: AvsRangeCursor | null,
) {
  let query = db.collection('classSessions').where('date', '>=', range.fromDate)
    .where('date', '<=', range.toDate).orderBy('date', 'asc').orderBy(FieldPath.documentId(), 'asc');
  if (cursor) query = query.startAfter(cursor.date, cursor.sessionId);
  const candidates = await getAvsScopedDocuments(query, enrollmentIds, 101);
  const compare = (a: QueryDocumentSnapshot, b: QueryDocumentSnapshot) =>
    String(a.data().date).localeCompare(String(b.data().date)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  candidates.sort(compare);
  const groups = new Map<string, GroupSession[]>();
  let processedSessionCount = 0;
  let nextCursor = cursor;
  let consumed = 0;
  let contextReads = 0;
  for (const candidate of candidates.slice(0, 100)) {
    const data = candidate.data();
    const date = String(data.date);
    const descriptor = sameDayGroupDescriptor(date, data, null);
    const key = descriptor?.key ?? candidate.id;
    if (!groups.has(key)) {
      let members = [candidate];
      if (descriptor) {
        const byId = new Map<string, QueryDocumentSnapshot>();
        // Live AVS grouping uses only canonical learner identifiers. Legacy
        // aliases remain available to historical migration tooling, not business
        // reconciliation.
        for (const [field, op] of [['kidId', '=='], ['kidIds', 'array-contains']] as const) {
          const found = await getAvsScopedDocuments(db.collection('classSessions')
            .where('date', '==', date).where(field, op, descriptor.kidId), enrollmentIds, 101);
          contextReads += found.length;
          if (found.length >= 101) throw new HttpsError('failed-precondition', 'Same-day canonical learner context exceeds the 100-session safety bound.');
          for (const doc of found) byId.set(doc.id, doc);
        }
        byId.set(candidate.id, candidate);
        members = [...byId.values()].filter((doc) =>
          sameDayGroupDescriptor(date, doc.data(), null)?.key === key);
      }
      if (members.length > 100) throw new HttpsError('failed-precondition', 'Business group exceeds the 100-session safety bound.');
      if (processedSessionCount + members.length > 100) break;
      groups.set(key, members.map((doc) => ({ id: doc.id, data: doc.data() })));
      processedSessionCount += members.length;
    }
    consumed += 1;
    nextCursor = { date, sessionId: candidate.id };
  }
  return { groups: [...groups.values()], processedSessionCount, nextCursor,
    hasMore: consumed < candidates.length, readBudget: { discovery: candidates.length, context: contextReads } };
}

/** Group business reconciliation runs before any decision to call Microsoft Graph. */
export async function validateAvsBusinessGroup(params: {
  rows: GroupSession[];
  evidenceBySession: ReadonlyMap<string, AttendanceValidationEvidenceDocument>;
  registry: Av3StaffRegistrySnapshot;
  runId: string;
  collectFresh: (row: GroupSession) => Promise<AttendanceValidationEvidenceDocument>;
  saveCases: (cases: readonly Av53ValidationCaseDocument[]) => Promise<void>;
}) {
  const { rows, registry } = params;
  const first = rows[0];
  if (!first) return { cases: [], freshCount: 0, failures: [] as unknown[], unsafeCount: 0 };
  const date = String(first.data.date);
  const descriptor = sameDayGroupDescriptor(date, first.data, null);
  if (rows.some((row) => sameDayGroupDescriptor(String(row.data.date), row.data, null)?.key !== descriptor?.key)) {
    throw new Error('Mixed AVS business groups.');
  }
  // Present-capacity and Teams-evidence collection are deliberately separate.
  // Cancelled/rescheduled/unmarked rows must not manufacture a Tiny Steps Present,
  // but their same-day Teams reference can still prove either a genuine 0/0 match
  // or a class that happened later on the same service date.
  const presentCapEligible = rows.filter((row) =>
    isAvsPresentCapEligibleSession(row.data, descriptor?.kidId ?? null));
  const present = presentCapEligible.filter((row) => normalizeTinyStepsAttendance(
    attendanceEntryForKid(row.data, descriptor?.kidId ?? null)) === 'present');
  const tinyStepsPresentCount = present.length;
  const evidenceCandidates = tinyStepsPresentCount > 0
    ? [...present, ...rows.filter((row) => !present.some((item) => item.id === row.id))]
    : rows;
  const compatible = new Map<string, AttendanceValidationEvidenceDocument>();
  const unsafe = new Set<string>();
  for (const row of rows) {
    const evidence = params.evidenceBySession.get(row.id);
    if (!evidence) continue;
    const freshness = classifyCachedEvidenceFreshness({ classSessionId: row.id, session: row.data, evidence });
    if (freshness.decision === 'reuse_cached' && evidence.calculationVersion >= 2) compatible.set(row.id, evidence);
    if (freshness.decision === 'unsafe_review') unsafe.add(row.id);
  }
  const observation = (evidence: AttendanceValidationEvidenceDocument) =>
    buildSameDayCoverageObservation(
      evidence,
      bridgeEnrollmentIdentity(evidence, registry.entries),
      date,
      rows.length <= 1
        ? 'single_session_learner_attendance'
        : 'teacher_learner_overlap',
    );
  const sufficient = () => {
    const aggregate = aggregateSameDayCoverage([...compatible.values()].map(observation));
    return tinyStepsPresentCount > 0 && aggregate.status === 'measured'
      && supportedPresentCountFromOverlap(aggregate.totalOverlapSeconds) >= tinyStepsPresentCount;
  };
  const failures: unknown[] = [];
  let freshCount = 0;
  let requiredMissing = false;
  for (const row of evidenceCandidates) {
    if (sufficient()) break;
    const cached = compatible.get(row.id);
    if (cached && cached.calculationVersion >= 2 && observation(cached).status !== 'review') continue;
    if (unsafe.has(row.id)) { requiredMissing = true; continue; }
    try {
      const evidence = await params.collectFresh(row);
      freshCount += 1;
      if (classifyCachedEvidenceFreshness({ classSessionId: row.id, session: row.data, evidence }).decision !== 'reuse_cached') {
        throw new Error('Fresh evidence is incompatible with the current business group.');
      }
      compatible.set(row.id, evidence);
      if (observation(evidence).status === 'review') requiredMissing = true;
    } catch (error) {
      failures.push(error);
      requiredMissing = true;
    }
  }
  // A later occurrence may prove all T Presents despite another row's failure.
  const incomplete = requiredMissing && !sufficient();
  const loaded: Av53LoadedWorkItem[] = rows.map((row) => ({
    item: { classSessionId: row.id, evidenceId: compatible.get(row.id)?.id ?? `missing_${createHash('sha256').update(row.id).digest('hex').slice(0, 40)}` },
    session: row.data, evidence: compatible.get(row.id) ?? null,
  }));
  let generated: Av53ValidationCaseDocument[] = [];
  await runAv53Shadow({ runId: params.runId, workItems: loaded.map((item) => item.item) }, {
    store: { loadWorkItems: async () => loaded, saveCases: async (cases) => { generated = [...cases]; } },
    staffRegistry: registry,
    // When Tiny Steps has zero Presents, all same-day candidate rows remain
    // available for the duration-based Teams Present count. This is what lets a
    // genuine >50 minute day support Teams Present = 2 while the admin chooses
    // the exact two Tiny Steps rows to correct.
    sameDaySessionCountByGroup: descriptor
      ? new Map([[descriptor.key, rows.length]])
      : undefined,
    sameDayPresentCountByGroup: descriptor
      ? new Map([[descriptor.key, tinyStepsPresentCount]])
      : undefined,
    sameDayContextIncompleteGroups: incomplete && descriptor ? new Set([descriptor.key]) : new Set(),
  });
  const representative = generated.find((item) => compatible.has(item.id));
  // All saved rows carry the same persisted group outcome, including stale/raw rows.
  const cases = generated.map((item): Av53ValidationCaseDocument => ({
    ...item,
    evidenceId: compatible.get(item.id)?.id ?? params.evidenceBySession.get(item.id)?.id ?? null,
    ...(representative ? {
      businessOutcome: representative.businessOutcome,
      teamsSupportedPresentCount: representative.teamsSupportedPresentCount,
      tinyStepsPresentCount,
      businessDifferenceCount: representative.businessDifferenceCount,
      sameDayEvidenceEvaluable: representative.sameDayEvidenceEvaluable,
      sameDayCoverageSeconds: representative.sameDayCoverageSeconds,
      sameDayPresentSessionCount: tinyStepsPresentCount,
      sameDayRequiredOverlapSeconds: representative.sameDayRequiredOverlapSeconds,
      sameDayOccurrenceCount: representative.sameDayOccurrenceCount,
      classification: representative.classification,
      validationDecision: representative.validationDecision,
      resolutionStatus: representative.resolutionStatus,
      recommendedAction: representative.recommendedAction,
      reasons: representative.reasons,
    } : { tinyStepsPresentCount }),
  }));
  for (const item of cases) {
    item.groupEvidenceIds = [...compatible.values()].map((evidence) => evidence.id).sort();
    item.inputFingerprint = createHash('sha256').update(JSON.stringify({
      prior: item.inputFingerprint, businessOutcome: item.businessOutcome,
      tinyStepsPresentCount, teamsSupportedPresentCount: item.teamsSupportedPresentCount,
      groupEvidenceIds: item.groupEvidenceIds,
    })).digest('hex');
  }
  await params.saveCases(cases);
  return { cases, freshCount, failures, unsafeCount: unsafe.size };
}

export async function loadAvsGroupEvidence(db: Firestore, rows: GroupSession[]) {
  const snapshots = await db.getAll(...rows.map((row) => db.collection('attendanceValidationCases').doc(row.id)));
  const ids = [...new Set(snapshots.filter((doc) => doc.exists).map((doc) => doc.data()?.evidenceId)
    .filter((id): id is string => typeof id === 'string' && Boolean(id) && !id.includes('/')))];
  const evidenceDocs = ids.length ? await db.getAll(...ids.map((id) => db.collection('attendanceValidationEvidence').doc(id))) : [];
  const evidenceBySession = new Map<string, AttendanceValidationEvidenceDocument>();
  for (const doc of evidenceDocs) {
    if (doc.exists) {
      const evidence = doc.data() as AttendanceValidationEvidenceDocument;
      evidenceBySession.set(evidence.session.classSessionId, evidence);
    }
  }
  return { evidenceBySession, existingCount: snapshots.filter((doc) => doc.exists).length,
    readCount: snapshots.length + evidenceDocs.length };
}

export async function persistAvsGroupCases(db: Firestore, rows: GroupSession[], cases: readonly Av53ValidationCaseDocument[]) {
  cases.forEach(assertAvsBusinessPersistenceInvariant);
  await db.runTransaction(async (transaction) => {
    const sessionRefs = rows.map((row) => db.collection('classSessions').doc(row.id));
    const markerRefs = rows.map((row) => db.collection(ATTENDANCE_VALIDATION_DIRTY_SESSIONS_COLLECTION).doc(row.id));
    const caseRefs = rows.map((row) => db.collection('attendanceValidationCases').doc(row.id));
    const snapshots = await transaction.getAll(...sessionRefs, ...markerRefs, ...caseRefs);
    const current = snapshots.slice(0, rows.length);
    if (current.some((doc, index) => !doc.exists || !isDeepStrictEqual(doc.data(), rows[index].data))) {
      throw new HttpsError('aborted', 'Attendance changed during validation. Run Validation again.');
    }
    const priorCases = snapshots.slice(rows.length * 2).map((doc) => doc.data() as Record<string, unknown> | undefined);
    const keepManualDecision = cases.length === rows.length && cases.every((item, index) =>
      priorCases[index]?.resolutionDecision === 'manual_verified'
      && priorCases[index]?.inputFingerprint === item.inputFingerprint
      && priorCases[index]?.sourceBusinessOutcome === item.businessOutcome);
    for (const [index, item] of cases.entries()) {
      const prior = priorCases[index];
      transaction.set(caseRefs[index], keepManualDecision && prior ? {
        ...item, businessOutcome: 'verified', businessDifferenceCount: 0,
        resolutionStatus: 'resolved', resolutionDecision: 'manual_verified',
        resolutionId: prior.resolutionId, manualVerificationReason: prior.manualVerificationReason,
        sourceBusinessOutcome: prior.sourceBusinessOutcome,
        sourceTeamsSupportedPresentCount: prior.sourceTeamsSupportedPresentCount,
        sourceTinyStepsPresentCount: prior.sourceTinyStepsPresentCount,
        resolvedByUid: prior.resolvedByUid, resolvedByName: prior.resolvedByName,
        resolvedByEmail: prior.resolvedByEmail, resolvedAt: prior.resolvedAt,
      } : item);
    }
    if (cases.length === rows.length && cases.every((item) => item.businessOutcome && item.businessOutcome !== 'not_evaluable')) {
      snapshots.slice(rows.length, rows.length * 2).forEach((marker, index) => {
        if (marker.exists) transaction.delete(markerRefs[index]);
      });
    }
  });
}
