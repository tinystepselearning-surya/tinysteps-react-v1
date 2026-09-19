import { describe, expect, it } from 'vitest';
import {
  AV53_MAX_WORK_ITEMS_PER_RUN,
  AV53_VALIDATION_START_YMD,
  runAv53Shadow,
  type Av53LoadedWorkItem,
  type Av53ShadowStore,
  type Av53ValidationCaseDocument,
} from '../src/attendanceValidation/shadowRunner';
import type { AttendanceValidationEvidenceDocument } from '../src/attendanceValidation/teamsEvidenceCollector';
import type { Av3StaffRegistrySnapshot } from '../src/attendanceValidation/staffIdentityRegistry';
import { hashAttendanceEvidenceValue } from '../src/attendanceValidation/teamsEvidenceCollector';

const registry: Av3StaffRegistrySnapshot = {
  schemaVersion: 1,
  loadedAt: '2026-09-19T07:00:00.000Z',
  entries: [
    {
      staffId: 'teacher-1',
      role: 'teacher',
      emailAddressHash: hashAttendanceEvidenceValue('teacher@example.com'),
      microsoftIdentityIdHashes: [
        hashAttendanceEvidenceValue('teacher-ms-id'),
      ],
    },
  ],
  issues: [],
};

function evidence(
  overrides: Partial<AttendanceValidationEvidenceDocument> = {},
): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 1,
    id: 'evidence-1',
    runId: 'av53-test',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-19T06:00:00.000Z',
    organizerUserId: 'organizer',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-18T10:00:00.000Z',
      scheduledEndDateTime: '2026-09-18T10:35:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: null,
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-18T10:00:00.000Z',
      endDateTime: '2026-09-18T10:35:00.000Z',
      creationDateTime: '2026-09-01T10:00:00.000Z',
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: [
      {
        reportId: 'report-1',
        meetingStartDateTime: '2026-09-18T10:00:00.000Z',
        meetingEndDateTime: '2026-09-18T10:35:00.000Z',
        totalParticipantCount: 2,
        recordsComplete: true,
        nextRecordsPagePresent: false,
        recordsIssue: null,
        participantRecords: [
          {
            participantRecordId: 'teacher-record',
            role: 'Presenter',
            emailAddressHash: hashAttendanceEvidenceValue('teacher@example.com'),
            identityHints: [
              {
                kind: 'user',
                idHash: hashAttendanceEvidenceValue('teacher-ms-id'),
              },
            ],
            microsoftTotalAttendanceInSeconds: 2100,
            rawAttendanceIntervals: [
              {
                joinDateTime: '2026-09-18T10:00:00.000Z',
                leaveDateTime: '2026-09-18T10:35:00.000Z',
                durationInSeconds: 2100,
              },
            ],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-18T10:00:00.000Z',
              lastLeaveDateTime: '2026-09-18T10:35:00.000Z',
              totalDwellSeconds: 2100,
              scheduledOverlapSeconds: 2100,
              scheduledDwellPercentage: 100,
            },
          },
          {
            participantRecordId: 'learner-record',
            role: 'Attendee',
            emailAddressHash: hashAttendanceEvidenceValue('parent@example.com'),
            identityHints: [],
            microsoftTotalAttendanceInSeconds: 1800,
            rawAttendanceIntervals: [
              {
                joinDateTime: '2026-09-18T10:02:00.000Z',
                leaveDateTime: '2026-09-18T10:32:00.000Z',
                durationInSeconds: 1800,
              },
            ],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-18T10:02:00.000Z',
              lastLeaveDateTime: '2026-09-18T10:32:00.000Z',
              totalDwellSeconds: 1800,
              scheduledOverlapSeconds: 1800,
              scheduledDwellPercentage: 85.71,
            },
          },
        ],
      },
    ],
    completeness: {
      transcriptsComplete: true,
      attendanceReportsComplete: true,
      attendanceRecordsComplete: true,
      nextTranscriptPagePresent: false,
      nextAttendanceReportPagePresent: false,
    },
    artifactAvailability: {
      transcriptAvailable: false,
      attendanceReportAvailable: true,
      recordingAvailable: null,
    },
    issues: [],
    ...overrides,
  };
}

function session(
  attendance: unknown = { 'kid-1': { status: 'present' } },
  date = '2026-09-18',
) {
  return {
    date,
    enrollmentId: 'enrollment-1',
    teacherId: 'teacher-1',
    kidId: 'kid-1',
    attendance,
  };
}

class FakeStore implements Av53ShadowStore {
  public saved: Av53ValidationCaseDocument[] = [];
  public loadCalls = 0;
  public saveCalls = 0;

  constructor(private readonly loaded: Av53LoadedWorkItem[]) {}

  async loadWorkItems(): Promise<Av53LoadedWorkItem[]> {
    this.loadCalls += 1;
    return this.loaded;
  }

  async saveCases(cases: readonly Av53ValidationCaseDocument[]): Promise<void> {
    this.saveCalls += 1;
    this.saved = [...cases];
  }
}

describe('AV5.3 bounded shadow runner', () => {
  it('processes an explicit work item and persists a deterministic VERIFIED case', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: evidence(),
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-1',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
      },
      {
        store,
        staffRegistry: registry,
        now: () => new Date('2026-09-19T07:30:00.000Z'),
      },
    );

    expect(store.loadCalls).toBe(1);
    expect(store.saveCalls).toBe(1);
    expect(store.saved).toHaveLength(1);
    expect(store.saved[0]).toMatchObject({
      id: 'session-1',
      classSessionId: 'session-1',
      classification: 'VERIFIED',
      validationDecision: 'present',
      tinyStepsAttendance: 'present',
      recommendedAction: 'none',
      operationalMutationAllowed: false,
    });
    expect(result).toMatchObject({
      requestedCount: 1,
      processedCount: 1,
      persistedCaseCount: 1,
      pointReadDocumentBudget: 2,
      staffRegistryLoadedOnce: true,
      casePreReads: 0,
      unboundedOperationalScans: false,
      operationalMutationAllowed: false,
    });
  });

  it('uses the contract-v2 strict 25-minute threshold when production input omits an override', async () => {
    const exactTwentyFiveEvidence = evidence();
    exactTwentyFiveEvidence.attendanceReports[0].participantRecords[1].rawAttendanceIntervals = [
      {
        joinDateTime: '2026-09-18T10:07:00.000Z',
        leaveDateTime: '2026-09-18T10:32:00.000Z',
        durationInSeconds: 1500,
      },
    ];

    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: exactTwentyFiveEvidence,
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-contract-v2-boundary',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0]).toMatchObject({
      validationDecision: 'review',
      classification: 'POSSIBLE_FALSE_PRESENT',
      recommendedAction: 'review',
    });
    expect(store.saved[0].sourceClassificationReasons).toContain(
      'meaningful_overlap_not_met',
    );
  });

  it('hard-skips July/August sessions before the permanent September 2026 start date', async () => {
    const augustEvidence = evidence();
    augustEvidence.session.scheduledStartDateTime = '2026-08-31T10:00:00.000Z';
    augustEvidence.session.scheduledEndDateTime = '2026-08-31T10:35:00.000Z';

    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(undefined, '2026-08-31'),
        evidence: augustEvidence,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-before-start',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved).toEqual([]);
    expect(result.validationStartYmd).toBe(AV53_VALIDATION_START_YMD);
    expect(result.preScopeSkippedCount).toBe(1);
    expect(result.skipped).toEqual([
      {
        classSessionId: 'session-1',
        evidenceId: 'evidence-1',
        reason: 'before_validation_start',
      },
    ]);
  });

  it('applies the September cutoff to session-only missing-evidence work items', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'missing-evidence' },
        session: session(undefined, '2026-08-15'),
        evidence: null,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-old-missing-evidence',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'missing-evidence' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved).toEqual([]);
    expect(result.preScopeSkippedCount).toBe(1);
    expect(result.skipped[0].reason).toBe('before_validation_start');
  });

  it('applies the September cutoff to evidence-only orphan work items', async () => {
    const augustEvidence = evidence();
    augustEvidence.session.scheduledStartDateTime = '2026-08-20T10:00:00.000Z';
    augustEvidence.session.scheduledEndDateTime = '2026-08-20T10:35:00.000Z';

    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: null,
        evidence: augustEvidence,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-old-orphan',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved).toEqual([]);
    expect(result.preScopeSkippedCount).toBe(1);
    expect(result.skipped[0].reason).toBe('before_validation_start');
  });

  it('treats the exact September 1 Tiny Steps service date as in scope', async () => {
    const septemberEvidence = evidence();
    septemberEvidence.session.scheduledStartDateTime = '2026-08-31T18:30:00.000Z';
    septemberEvidence.session.scheduledEndDateTime = '2026-08-31T19:05:00.000Z';
    septemberEvidence.attendanceReports[0].meetingStartDateTime =
      '2026-08-31T18:30:00.000Z';
    septemberEvidence.attendanceReports[0].meetingEndDateTime =
      '2026-08-31T19:05:00.000Z';

    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(undefined, '2026-09-01'),
        evidence: septemberEvidence,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-september-first',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(result.preScopeSkippedCount).toBe(0);
    expect(result.persistedCaseCount).toBe(1);
  });

  it('fails closed when the service date cannot be resolved', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'missing-evidence' },
        session: {
          enrollmentId: 'enrollment-1',
          teacherId: 'teacher-1',
          kidId: 'kid-1',
          attendance: { 'kid-1': { status: 'present' } },
        },
        evidence: null,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-date-unresolved',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'missing-evidence' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved).toEqual([]);
    expect(result.skipped[0].reason).toBe('validation_scope_date_unresolved');
  });

  it('uses Tiny Steps nested attendance for the expected kid rather than session lifecycle status', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: {
          ...session({ 'kid-1': { status: 'absent' } }),
          status: 'completed',
        },
        evidence: evidence(),
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-2',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0].tinyStepsAttendance).toBe('absent');
    expect(store.saved[0].classification).toBe('ATTENDANCE_CONFLICT');
    expect(store.saved[0].recommendedAction).toBe('correct_to_present');
  });

  it('creates MISSING_TEAMS_EVIDENCE when an explicitly requested session has no evidence document', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'missing-evidence' },
        session: session(),
        evidence: null,
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-3',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'missing-evidence' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0]).toMatchObject({
      id: 'session-1',
      classification: 'MISSING_TEAMS_EVIDENCE',
      recommendedAction: 'review',
      reasons: ['evidence_document_missing'],
    });
  });

  it('creates ORPHAN_TEAMS_CLASS only when explicit evidence exists and the expected Tiny Steps session is missing', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: null,
        evidence: evidence(),
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-4',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0]).toMatchObject({
      id: 'orphan_evidence-1',
      classification: 'ORPHAN_TEAMS_CLASS',
      recommendedAction: 'review',
      reasons: ['operational_session_missing'],
    });
  });

  it('routes evidence/session reference mismatch to AMBIGUOUS instead of trusting either side', async () => {
    const mismatchedEvidence = evidence();
    mismatchedEvidence.session.teacherId = 'different-teacher';

    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: mismatchedEvidence,
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-5',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0]).toMatchObject({
      classification: 'AMBIGUOUS',
      recommendedAction: 'review',
      reasons: ['operational_session_reference_mismatch'],
      operationalMutationAllowed: false,
    });
  });

  it('skips when both explicitly requested documents are missing and performs no phantom case write', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: null,
        evidence: null,
      },
    ]);

    const result = await runAv53Shadow(
      {
        runId: 'shadow-6',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved).toEqual([]);
    expect(result.persistedCaseCount).toBe(0);
    expect(result.skipped).toEqual([
      {
        classSessionId: 'session-1',
        evidenceId: 'evidence-1',
        reason: 'both_session_and_evidence_missing',
      },
    ]);
  });

  it('keeps a null overlap threshold fail-closed as an AMBIGUOUS review case', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: evidence(),
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-7',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: null,
      },
      { store, staffRegistry: registry },
    );

    expect(store.saved[0]).toMatchObject({
      validationDecision: 'review',
      classification: 'AMBIGUOUS',
      recommendedAction: 'review',
    });
    expect(store.saved[0].sourceClassificationReasons).toContain(
      'overlap_threshold_not_configured',
    );
  });

  it('propagates staff-registry integrity issues into every persisted case for audit visibility', async () => {
    const store = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: evidence(),
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-8',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      {
        store,
        staffRegistry: {
          ...registry,
          issues: [
            {
              kind: 'duplicate_email_hash',
              staffIds: ['teacher-1', 'teacher-2'],
            },
          ],
        },
      },
    );

    expect(store.saved[0].staffRegistryIssues).toEqual([
      'duplicate_email_hash',
    ]);
  });

  it('enforces a hard bounded work-list size before any store read', async () => {
    const store = new FakeStore([]);
    const workItems = Array.from(
      { length: AV53_MAX_WORK_ITEMS_PER_RUN + 1 },
      (_, index) => ({
        classSessionId: `session-${index}`,
        evidenceId: `evidence-${index}`,
      }),
    );

    await expect(runAv53Shadow(
      {
        runId: 'shadow-too-large',
        workItems,
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    )).rejects.toThrow('at most');

    expect(store.loadCalls).toBe(0);
    expect(store.saveCalls).toBe(0);
  });

  it('rejects duplicate session work items to prevent duplicate reads and ambiguous writes', async () => {
    const store = new FakeStore([]);

    await expect(runAv53Shadow(
      {
        runId: 'shadow-duplicate',
        workItems: [
          { classSessionId: 'session-1', evidenceId: 'evidence-1' },
          { classSessionId: 'session-1', evidenceId: 'evidence-2' },
        ],
        meaningfulOverlapSeconds: 600,
      },
      { store, staffRegistry: registry },
    )).rejects.toThrow('Duplicate classSessionId');

    expect(store.loadCalls).toBe(0);
  });

  it('keeps deterministic case identity stable across reruns while allowing fingerprints to reflect changed state', async () => {
    const firstStore = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session(),
        evidence: evidence(),
      },
    ]);
    const secondStore = new FakeStore([
      {
        item: { classSessionId: 'session-1', evidenceId: 'evidence-1' },
        session: session({ 'kid-1': { status: 'absent' } }),
        evidence: evidence(),
      },
    ]);

    await runAv53Shadow(
      {
        runId: 'shadow-rerun-1',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store: firstStore, staffRegistry: registry },
    );
    await runAv53Shadow(
      {
        runId: 'shadow-rerun-2',
        workItems: [{ classSessionId: 'session-1', evidenceId: 'evidence-1' }],
        meaningfulOverlapSeconds: 600,
      },
      { store: secondStore, staffRegistry: registry },
    );

    expect(firstStore.saved[0].id).toBe('session-1');
    expect(secondStore.saved[0].id).toBe('session-1');
    expect(firstStore.saved[0].inputFingerprint).not.toBe(
      secondStore.saved[0].inputFingerprint,
    );
  });
});
