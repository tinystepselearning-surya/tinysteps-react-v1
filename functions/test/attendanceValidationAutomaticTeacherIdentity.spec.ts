import { describe, expect, it } from 'vitest';
import type { Av3StaffRegistrySnapshot } from '../src/attendanceValidation/staffIdentityRegistry';
import {
  ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION,
  backfillMicrosoftIdentityClaimsFromRegistry,
  bindTeacherIdentityFromFreshEvidence,
  claimAndBindTeacherIdentityMapping,
} from '../src/attendanceValidation/automaticTeacherIdentity';
import {
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

const teacherEmailHash = hashAttendanceEvidenceValue('teacher@tinystepslearning.com');
const microsoftHash = hashAttendanceEvidenceValue('microsoft-teacher-id');

function registry(mapped = false): Av3StaffRegistrySnapshot {
  return {
    schemaVersion: 1,
    loadedAt: '2026-09-23T10:00:00.000Z',
    issues: [],
    entries: [{
      staffId: 'teacher-1',
      role: 'teacher',
      emailAddressHash: teacherEmailHash,
      microsoftIdentityIdHashes: mapped ? [microsoftHash] : [],
    }],
  };
}

function evidence(): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 2,
    id: 'evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-23T10:00:00.000Z',
    organizerUserId: 'organizer',
    session: {
      classSessionId: 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: 'teacher-1',
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-01T10:00:00.000Z',
      scheduledEndDateTime: '2026-09-01T10:35:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: 'present',
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-01T10:00:00.000Z',
      endDateTime: '2026-09-01T10:35:00.000Z',
      creationDateTime: null,
      meetingType: null,
    },
    transcripts: [],
    attendanceReports: [{
      reportId: 'report-1',
      meetingStartDateTime: '2026-09-01T10:00:00.000Z',
      meetingEndDateTime: '2026-09-01T10:35:00.000Z',
      totalParticipantCount: 2,
      recordsComplete: true,
      nextRecordsPagePresent: false,
      recordsIssue: null,
      participantRecords: [{
        participantRecordId: 'record-1',
        role: 'Presenter',
        emailAddressHash: teacherEmailHash,
        identityHints: [{ kind: 'user', idHash: microsoftHash }],
        microsoftTotalAttendanceInSeconds: 2100,
        rawAttendanceIntervals: [],
        metrics: {
          sourceIntervalCount: 1,
          validIntervalCount: 1,
          mergedIntervalCount: 1,
          firstJoinDateTime: '2026-09-01T10:00:00.000Z',
          lastLeaveDateTime: '2026-09-01T10:35:00.000Z',
          totalDwellSeconds: 2100,
          scheduledOverlapSeconds: 2100,
          scheduledDwellPercentage: 100,
        },
      }],
    }],
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
  };
}

function fakeDb(seed: Record<string, Record<string, unknown>> = {}) {
  const docs = new Map(Object.entries(seed));
  const db: any = {
    collection(name: string) {
      return {
        doc(id: string) {
          return { path: `${name}/${id}` };
        },
      };
    },
    async runTransaction(callback: (tx: any) => Promise<any>) {
      const writes: Array<{ path: string; data: Record<string, unknown>; merge: boolean }> = [];
      const tx = {
        async get(ref: { path: string }) {
          const data = docs.get(ref.path);
          return {
            exists: Boolean(data),
            data: () => data,
          };
        },
        set(ref: { path: string }, data: Record<string, unknown>, options?: { merge?: boolean }) {
          writes.push({ path: ref.path, data, merge: Boolean(options?.merge) });
        },
      };
      const result = await callback(tx);
      for (const write of writes) {
        docs.set(
          write.path,
          write.merge
            ? { ...(docs.get(write.path) || {}), ...write.data }
            : { ...write.data },
        );
      }
      return result;
    },
  };
  return { db, docs };
}

describe('AVS automatic teacher identity binding', () => {
  it('binds a unique fresh-evidence identity and creates the ownership claim atomically', async () => {
    const { db, docs } = fakeDb();
    const result = await bindTeacherIdentityFromFreshEvidence({
      db,
      evidence: evidence(),
      staffRegistry: registry(false),
    });

    expect(result.decision?.status).toBe('ready');
    expect(result.bindingStatus).toBe('bound');
    expect(result.overrideWrite).toBe(true);
    expect(result.claimWrite).toBe(true);
    expect(result.staffRegistry.entries[0].microsoftIdentityIdHashes)
      .toEqual([microsoftHash]);
    expect(docs.get(`attendanceValidationStaffIdentities/teacher-1`))
      .toMatchObject({ staffId: 'teacher-1', microsoftIdentityIdHashes: [microsoftHash] });
    expect(docs.get(
      `${ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION}/${microsoftHash}`,
    )).toMatchObject({ staffId: 'teacher-1' });
  });

  it('fails closed when another staff member already owns the transactional claim', async () => {
    const { db } = fakeDb({
      [`${ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION}/${microsoftHash}`]:
        { staffId: 'teacher-2' },
    });
    const result = await bindTeacherIdentityFromFreshEvidence({
      db,
      evidence: evidence(),
      staffRegistry: registry(false),
    });

    expect(result.bindingStatus).toBe('identity_claim_conflict');
    expect(result.overrideWrite).toBe(false);
    expect(result.staffRegistry.entries[0].microsoftIdentityIdHashes).toEqual([]);
  });

  it('never replaces an existing different override identity', async () => {
    const differentHash = hashAttendanceEvidenceValue('different-id');
    const { db } = fakeDb({
      'attendanceValidationStaffIdentities/teacher-1': {
        staffId: 'teacher-1',
        microsoftIdentityIdHashes: [differentHash],
      },
    });
    const result = await claimAndBindTeacherIdentityMapping({
      db,
      teacherId: 'teacher-1',
      microsoftIdentityIdHash: microsoftHash,
      source: 'fresh_avs_evidence_email_bound',
      supportingCaseCount: 1,
    });
    expect(result.status).toBe('override_conflict');
    expect(result.overrideWrite).toBe(false);
    expect(result.claimWrite).toBe(false);
  });

  it('backfills claims for existing verified mappings without Graph or raw identity data', async () => {
    const { db, docs } = fakeDb();
    const result = await backfillMicrosoftIdentityClaimsFromRegistry(
      db,
      registry(true),
    );
    expect(result.claimWrites).toBe(1);
    expect(result.conflictCount).toBe(0);
    expect(docs.get(
      `${ATTENDANCE_VALIDATION_MICROSOFT_IDENTITY_CLAIMS_COLLECTION}/${microsoftHash}`,
    )).toMatchObject({
      staffId: 'teacher-1',
      source: 'registry_backfill',
      operationalMutationAllowed: false,
    });
  });

  it('does not learn from incomplete attendance records', async () => {
    const incomplete = evidence();
    incomplete.completeness.attendanceRecordsComplete = false;
    const { db } = fakeDb();
    const result = await bindTeacherIdentityFromFreshEvidence({
      db,
      evidence: incomplete,
      staffRegistry: registry(false),
    });
    expect(result.bindingStatus).toBe('not_eligible');
    expect(result.overrideWrite).toBe(false);
    expect(result.claimWrite).toBe(false);
    expect(result.transactionReadCount).toBe(0);
  });
});
