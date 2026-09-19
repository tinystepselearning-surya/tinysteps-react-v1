import { describe, expect, it } from 'vitest';
import {
  buildStaffIdentityRegistrySnapshot,
} from '../src/attendanceValidation/staffIdentityRegistry';
import { hashAttendanceEvidenceValue } from '../src/attendanceValidation/teamsEvidenceCollector';

describe('AV3 production staff identity registry', () => {
  it('builds active staff entries from canonical Tiny Steps users with hashed email only', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'teacher-1',
          uid: 'teacher-1',
          email: ' Teacher.One@TinyStepsLearning.com ',
          role: 'teacher',
          status: 'active',
        },
        {
          docId: 'parent-1',
          uid: 'parent-1',
          email: 'parent@example.com',
          role: 'parent',
          status: 'active',
        },
      ],
      [],
      '2026-09-19T06:00:00.000Z',
    );

    expect(snapshot.entries).toEqual([
      {
        staffId: 'teacher-1',
        role: 'teacher',
        emailAddressHash: hashAttendanceEvidenceValue(
          'teacher.one@tinystepslearning.com',
        ),
        microsoftIdentityIdHashes: [],
      },
    ]);
    expect(JSON.stringify(snapshot)).not.toContain('Teacher.One@TinyStepsLearning.com');
    expect(JSON.stringify(snapshot)).not.toContain('parent@example.com');
  });

  it('excludes suspended, archived, deleted and inactive staff accounts', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        { docId: 'active', role: 'teacher', status: 'active', email: 'a@example.com' },
        { docId: 'suspended', role: 'teacher', status: 'suspended', email: 'b@example.com' },
        { docId: 'archived', role: 'admin', status: 'archived', email: 'c@example.com' },
        { docId: 'deleted', role: 'teacher', isDeleted: true, email: 'd@example.com' },
        { docId: 'inactive', role: 'teacher', status: 'inactive', email: 'e@example.com' },
      ],
      [],
    );

    expect(snapshot.entries.map((entry) => entry.staffId)).toEqual(['active']);
  });

  it('uses the canonical Firebase uid as staffId when available', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'legacy-document-id',
          uid: 'canonical-teacher-uid',
          email: 'teacher@example.com',
          role: 'teacher',
          status: 'active',
        },
      ],
      [],
    );

    expect(snapshot.entries[0].staffId).toBe('canonical-teacher-uid');
  });

  it('adds verified Microsoft identity hashes from validation-owned overrides', () => {
    const msHash = hashAttendanceEvidenceValue('stable-ms-object-id');
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'teacher-1',
          uid: 'teacher-1',
          email: 'teacher@example.com',
          role: 'teacher',
          status: 'active',
        },
      ],
      [
        {
          docId: 'teacher-1',
          microsoftIdentityIdHashes: [msHash, msHash],
        },
      ],
    );

    expect(snapshot.entries[0].microsoftIdentityIdHashes).toEqual([msHash]);
    expect(snapshot.issues).toEqual([]);
  });

  it('never lets an override promote a non-staff or missing operational user into staff', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'parent-1',
          uid: 'parent-1',
          email: 'parent@example.com',
          role: 'parent',
          status: 'active',
        },
      ],
      [
        {
          docId: 'parent-1',
          microsoftIdentityIdHashes: [
            hashAttendanceEvidenceValue('parent-ms-object-id'),
          ],
        },
        {
          docId: 'missing-staff',
          microsoftIdentityIdHashes: [
            hashAttendanceEvidenceValue('missing-ms-object-id'),
          ],
        },
      ],
    );

    expect(snapshot.entries).toEqual([]);
    expect(snapshot.issues.filter((issue) =>
      issue.kind === 'override_without_active_staff')).toHaveLength(2);
  });

  it('flags malformed override hashes instead of accepting raw identifiers', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'teacher-1',
          email: 'teacher@example.com',
          role: 'teacher',
          status: 'active',
        },
      ],
      [
        {
          docId: 'teacher-1',
          emailAddressHash: 'teacher@example.com',
          microsoftIdentityIdHashes: ['raw-object-id'],
        },
      ],
    );

    expect(snapshot.issues.map((issue) => issue.kind)).toEqual([
      'invalid_email_hash',
      'invalid_microsoft_identity_hash',
    ]);
    expect(snapshot.entries[0].emailAddressHash).toBe(
      hashAttendanceEvidenceValue('teacher@example.com'),
    );
    expect(snapshot.entries[0].microsoftIdentityIdHashes).toEqual([]);
  });

  it('flags duplicate staff identity ownership so AV3 will not silently trust it', () => {
    const sharedEmailHash = hashAttendanceEvidenceValue('shared@example.com');
    const sharedMicrosoftHash = hashAttendanceEvidenceValue('shared-ms-id');
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        { docId: 'teacher-a', role: 'teacher', status: 'active' },
        { docId: 'teacher-b', role: 'teacher', status: 'active' },
      ],
      [
        {
          docId: 'teacher-a',
          emailAddressHash: sharedEmailHash,
          microsoftIdentityIdHashes: [sharedMicrosoftHash],
        },
        {
          docId: 'teacher-b',
          emailAddressHash: sharedEmailHash,
          microsoftIdentityIdHashes: [sharedMicrosoftHash],
        },
      ],
    );

    expect(snapshot.issues).toEqual(expect.arrayContaining([
      {
        kind: 'duplicate_email_hash',
        staffIds: ['teacher-a', 'teacher-b'],
      },
      {
        kind: 'duplicate_microsoft_identity_hash',
        staffIds: ['teacher-a', 'teacher-b'],
      },
    ]));
  });

  it('reports active staff with no usable identity signal', () => {
    const snapshot = buildStaffIdentityRegistrySnapshot(
      [
        {
          docId: 'teacher-no-identity',
          role: 'teacher',
          status: 'active',
        },
      ],
      [],
    );

    expect(snapshot.issues).toContainEqual({
      kind: 'staff_identity_missing',
      staffIds: ['teacher-no-identity'],
    });
  });
});
