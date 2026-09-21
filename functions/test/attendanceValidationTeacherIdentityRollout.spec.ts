import { describe, expect, it } from 'vitest';
import type { StaffIdentityRegistryEntry } from '../src/attendanceValidation/enrollmentIdentityBridge';
import type { Av3StaffRegistrySnapshot } from '../src/attendanceValidation/staffIdentityRegistry';
import {
  planCachedTeacherIdentityRollout,
  registryWithAppliedIdentityMappings,
  type CachedIdentityRolloutCase,
} from '../src/attendanceValidation/teacherIdentityRollout';
import {
  hashAttendanceEvidenceValue,
  type AttendanceValidationEvidenceDocument,
} from '../src/attendanceValidation/teamsEvidenceCollector';

const teacherEmailHash = hashAttendanceEvidenceValue(
  'teacher.one@tinystepslearning.com',
);
const teacherMicrosoftHash = hashAttendanceEvidenceValue(
  'teacher-one-microsoft-id',
);

function registry(
  entries: StaffIdentityRegistryEntry[] = [
    {
      staffId: 'teacher-1',
      role: 'teacher',
      emailAddressHash: teacherEmailHash,
      microsoftIdentityIdHashes: [],
    },
  ],
): Av3StaffRegistrySnapshot {
  return {
    schemaVersion: 1,
    loadedAt: '2026-09-21T10:00:00.000Z',
    entries,
    issues: [],
  };
}

function cachedCase(
  overrides: Partial<CachedIdentityRolloutCase> = {},
): CachedIdentityRolloutCase {
  return {
    caseId: 'session-1',
    classSessionId: 'session-1',
    teacherId: 'teacher-1',
    evidenceId: 'evidence-1',
    resolutionStatus: 'needs_review',
    ...overrides,
  };
}

function evidence(
  overrides: {
    teacherId?: string | null;
    classSessionId?: string;
    emailHash?: string | null;
    identityHashes?: string[];
    recordsComplete?: boolean;
    attendanceRecordsComplete?: boolean;
  } = {},
): AttendanceValidationEvidenceDocument {
  return {
    schemaVersion: 1,
    calculationVersion: 1,
    id: 'evidence-1',
    runId: 'run-1',
    source: 'microsoft_teams_graph',
    collectionStatus: 'complete',
    collectedAt: '2026-09-21T10:00:00.000Z',
    organizerUserId: 'organizer-hash-safe-id',
    session: {
      classSessionId: overrides.classSessionId ?? 'session-1',
      enrollmentId: 'enrollment-1',
      teacherId: overrides.teacherId === undefined
        ? 'teacher-1'
        : overrides.teacherId,
      kidId: 'kid-1',
      courseId: 'course-1',
      scheduledStartDateTime: '2026-09-01T04:30:00.000Z',
      scheduledEndDateTime: '2026-09-01T05:05:00.000Z',
      scheduledDurationSeconds: 2100,
      joinUrlHash: 'join-hash',
      existingAttendanceStatus: 'present',
    },
    meeting: {
      onlineMeetingId: 'meeting-1',
      startDateTime: '2026-09-01T04:30:00.000Z',
      endDateTime: '2026-09-01T05:05:00.000Z',
      creationDateTime: '2026-08-20T04:00:00.000Z',
      meetingType: 'recurring',
    },
    transcripts: [],
    attendanceReports: [
      {
        reportId: 'report-1',
        meetingStartDateTime: '2026-09-01T04:30:00.000Z',
        meetingEndDateTime: '2026-09-01T05:05:00.000Z',
        totalParticipantCount: 2,
        recordsComplete: overrides.recordsComplete ?? true,
        nextRecordsPagePresent: false,
        recordsIssue: null,
        participantRecords: [
          {
            participantRecordId: 'teacher-record',
            role: 'Presenter',
            emailAddressHash:
              overrides.emailHash === undefined
                ? teacherEmailHash
                : overrides.emailHash,
            identityHints: (
              overrides.identityHashes ?? [teacherMicrosoftHash]
            ).map((idHash) => ({ kind: 'user', idHash })),
            microsoftTotalAttendanceInSeconds: 2100,
            rawAttendanceIntervals: [],
            metrics: {
              sourceIntervalCount: 1,
              validIntervalCount: 1,
              mergedIntervalCount: 1,
              firstJoinDateTime: '2026-09-01T04:30:00.000Z',
              lastLeaveDateTime: '2026-09-01T05:05:00.000Z',
              totalDwellSeconds: 2100,
              scheduledOverlapSeconds: 2100,
              scheduledDwellPercentage: 100,
            },
          },
        ],
      },
    ],
    completeness: {
      transcriptsComplete: true,
      attendanceReportsComplete: true,
      attendanceRecordsComplete:
        overrides.attendanceRecordsComplete ?? true,
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

describe('AVS multi-teacher cached identity rollout', () => {
  it('derives one safe teacher mapping from complete cached evidence using hashed email plus one stable identity', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([['evidence-1', evidence()]]),
      registry(),
    );

    expect(plan.decisions).toEqual([
      {
        teacherId: 'teacher-1',
        status: 'ready',
        supportingCaseCount: 1,
        candidateHash: teacherMicrosoftHash,
      },
    ]);
    expect(plan.readyMappings).toEqual([
      {
        teacherId: 'teacher-1',
        microsoftIdentityIdHash: teacherMicrosoftHash,
        supportingCaseCount: 1,
      },
    ]);
  });

  it('never uses display names or mismatched session teacher references as identity evidence', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([
        [
          'evidence-1',
          evidence({ teacherId: 'different-teacher' }),
        ],
      ]),
      registry(),
    );

    expect(plan.decisions[0].status).toBe('no_cached_identity_candidate');
    expect(plan.readyMappings).toEqual([]);
  });

  it('fails closed when the same teacher email is associated with multiple stable identities', () => {
    const second = evidence();
    second.id = 'evidence-2';
    second.session.classSessionId = 'session-2';
    second.attendanceReports[0].participantRecords[0].identityHints = [
      {
        kind: 'user',
        idHash: hashAttendanceEvidenceValue('second-microsoft-id'),
      },
    ];

    const plan = planCachedTeacherIdentityRollout(
      [
        cachedCase(),
        cachedCase({
          caseId: 'session-2',
          classSessionId: 'session-2',
          evidenceId: 'evidence-2',
        }),
      ],
      new Map([
        ['evidence-1', evidence()],
        ['evidence-2', second],
      ]),
      registry(),
    );

    expect(plan.decisions[0].status).toBe(
      'multiple_cached_identity_candidates',
    );
    expect(plan.readyMappings).toEqual([]);
  });

  it('fails closed when one cached attendance participant exposes multiple stable identity hashes', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([
        [
          'evidence-1',
          evidence({
            identityHashes: [
              teacherMicrosoftHash,
              hashAttendanceEvidenceValue('unexpected-second-id'),
            ],
          }),
        ],
      ]),
      registry(),
    );

    expect(plan.decisions[0].status).toBe(
      'multiple_cached_identity_candidates',
    );
    expect(plan.readyMappings).toEqual([]);
  });

  it('requires complete attendance records before learning an identity', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([
        [
          'evidence-1',
          evidence({
            recordsComplete: false,
            attendanceRecordsComplete: false,
          }),
        ],
      ]),
      registry(),
    );

    expect(plan.decisions[0].status).toBe('no_cached_identity_candidate');
    expect(plan.readyMappings).toEqual([]);
  });

  it('does not reassign a stable identity already owned by another staff member', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([['evidence-1', evidence()]]),
      registry([
        {
          staffId: 'teacher-1',
          role: 'teacher',
          emailAddressHash: teacherEmailHash,
          microsoftIdentityIdHashes: [],
        },
        {
          staffId: 'admin-1',
          role: 'admin',
          emailAddressHash: hashAttendanceEvidenceValue(
            'admin@tinystepslearning.com',
          ),
          microsoftIdentityIdHashes: [teacherMicrosoftHash],
        },
      ]),
    );

    expect(plan.decisions[0].status).toBe(
      'identity_owned_by_other_staff',
    );
    expect(plan.readyMappings).toEqual([]);
  });

  it('does not replace an existing different teacher identity', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([['evidence-1', evidence()]]),
      registry([
        {
          staffId: 'teacher-1',
          role: 'teacher',
          emailAddressHash: teacherEmailHash,
          microsoftIdentityIdHashes: [
            hashAttendanceEvidenceValue('existing-different-id'),
          ],
        },
      ]),
    );

    expect(plan.decisions[0].status).toBe('existing_identity_differs');
    expect(plan.readyMappings).toEqual([]);
  });

  it('recognizes an already-mapped teacher without writing another mapping', () => {
    const plan = planCachedTeacherIdentityRollout(
      [cachedCase()],
      new Map([['evidence-1', evidence()]]),
      registry([
        {
          staffId: 'teacher-1',
          role: 'teacher',
          emailAddressHash: teacherEmailHash,
          microsoftIdentityIdHashes: [teacherMicrosoftHash],
        },
      ]),
    );

    expect(plan.decisions[0].status).toBe('already_mapped');
    expect(plan.readyMappings).toEqual([]);
  });

  it('applies accepted mappings only to the intended teacher in the in-memory registry used for cached revalidation', () => {
    const initial = registry([
      {
        staffId: 'teacher-1',
        role: 'teacher',
        emailAddressHash: teacherEmailHash,
        microsoftIdentityIdHashes: [],
      },
      {
        staffId: 'teacher-2',
        role: 'teacher',
        emailAddressHash: hashAttendanceEvidenceValue(
          'teacher.two@tinystepslearning.com',
        ),
        microsoftIdentityIdHashes: [],
      },
    ]);

    const updated = registryWithAppliedIdentityMappings(initial, [
      {
        teacherId: 'teacher-1',
        microsoftIdentityIdHash: teacherMicrosoftHash,
      },
    ]);

    expect(updated.entries[0].microsoftIdentityIdHashes).toEqual([
      teacherMicrosoftHash,
    ]);
    expect(updated.entries[1].microsoftIdentityIdHashes).toEqual([]);
  });
});
