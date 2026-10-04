import { describe, expect, it } from 'vitest';

import {
  CANONICAL_PRIMARY_WRITE_AUTHORITY,
  canonicalProjectionWriteId,
  isCanonicalProjectionTransition,
  planCanonicalLearnerCreate,
} from '../src/schoolOS/identity/canonicalPrimaryPlanner';
import {
  buildGuardianRelationshipId,
} from '../src/schoolOS/identity/idStrategy';

describe('Wave 1 R4 canonical-primary learner contract', () => {
  it('plans canonical learner identity/profile state before compatibility projections', () => {
    const plan = planCanonicalLearnerCreate({
      personId: 'kid-ts-001',
      parentId: 'parent-legacy-uid',
      displayName: '  Learner   One ',
      ageYears: 8,
      grade: ' Grade 2 ',
      status: 'active',
      countryCode: 'in',
      summary: {
        phonicsMastery: 0,
        grammarMastery: 0,
      },
      actorId: 'admin-person-1',
      writeId: 'write-001',
    });

    const guardianId = buildGuardianRelationshipId({
      guardianPersonId: 'parent-legacy-uid',
      learnerPersonId: 'kid-ts-001',
      relationshipType: 'parent',
    });

    expect(plan.command).toBe('learner_create');
    expect(plan.personId).toBe('kid-ts-001');
    expect(
      plan.canonicalDocuments.map(
        (document) =>
          `${document.collection}/${document.documentId}`,
      ),
    ).toEqual([
      'people/kid-ts-001',
      'learnerProfiles/kid-ts-001',
      `guardianRelationships/${guardianId}`,
      'learnerDetails/kid-ts-001',
      'learnerReadModels/kid-ts-001',
    ]);

    const person = plan.canonicalDocuments[0];
    expect(person.data).toMatchObject({
      schemaVersion: 1,
      personId: 'kid-ts-001',
      kind: 'learner',
      status: 'active',
      displayName: 'Learner One',
      countryCode: 'IN',
      createdBy: 'admin-person-1',
      updatedBy: 'admin-person-1',
      canonicalAuthority: {
        schemaVersion: 1,
        authority: CANONICAL_PRIMARY_WRITE_AUTHORITY,
        command: 'learner_create',
        writeId: 'write-001',
      },
    });

    expect(person.data).not.toHaveProperty('migration');

    expect(
      plan.compatibilityDocuments,
    ).toHaveLength(1);
    expect(plan.compatibilityDocuments[0]).toMatchObject({
      collection: 'kids',
      documentId: 'kid-ts-001',
      data: {
        fullName: 'Learner One',
        name: 'Learner One',
        displayName: 'Learner One',
        age: 8,
        ageYears: 8,
        grade: 'Grade 2',
        parentId: 'parent-legacy-uid',
        parentIds: ['parent-legacy-uid'],
        primaryParentId: 'parent-legacy-uid',
        _wave1CanonicalProjection: {
          authority: 'canonical-primary',
          command: 'learner_create',
          writeId: 'write-001',
          canonicalPersonId: 'kid-ts-001',
        },
      },
    });

    expect(plan.compatibilityArrayUnions).toEqual([
      {
        collection: 'users',
        documentId: 'parent-legacy-uid',
        field: 'childIds',
        value: 'kid-ts-001',
      },
    ]);
  });

  it('does not create a learner read model when no source summary is supplied', () => {
    const plan = planCanonicalLearnerCreate({
      personId: 'kid-ts-002',
      parentId: 'parent-1',
      displayName: 'Learner Two',
      ageYears: 7,
      grade: '1',
      actorId: 'admin-1',
      writeId: 'write-002',
    });

    expect(
      plan.canonicalDocuments.some(
        (document) =>
          document.collection === 'learnerReadModels',
      ),
    ).toBe(false);
  });

  it('accepts a Tiny Steps learner ID independently of any Firebase UID', () => {
    const plan = planCanonicalLearnerCreate({
      personId: 'person_01JTSLEARNERXYZ',
      parentId: 'firebase-parent-uid',
      displayName: 'Learner',
      ageYears: 6,
      grade: 'UKG',
      actorId: 'admin-person',
      writeId: 'write-003',
    });

    expect(plan.personId).toBe('person_01JTSLEARNERXYZ');
    expect(plan.personId).not.toBe('firebase-parent-uid');
  });

  it('marks canonical-origin compatibility transitions without suppressing later unchanged-marker legacy edits', () => {
    const marker = {
      _wave1CanonicalProjection: {
        schemaVersion: 1,
        authority: 'canonical-primary',
        command: 'learner_create',
        writeId: 'write-004',
        canonicalPersonId: 'kid-4',
      },
    };

    expect(
      canonicalProjectionWriteId(marker),
    ).toBe('write-004');

    expect(
      isCanonicalProjectionTransition({
        beforeData: null,
        afterData: marker,
      }),
    ).toBe(true);

    expect(
      isCanonicalProjectionTransition({
        beforeData: marker,
        afterData: {
          ...marker,
          displayName: 'Legacy-side edit',
        },
      }),
    ).toBe(false);

    expect(
      isCanonicalProjectionTransition({
        beforeData: marker,
        afterData: {
          _wave1CanonicalProjection: {
            ...marker._wave1CanonicalProjection,
            writeId: 'write-005',
          },
        },
      }),
    ).toBe(true);
  });

  it('fails closed on invalid canonical learner inputs', () => {
    expect(() =>
      planCanonicalLearnerCreate({
        personId: '',
        parentId: 'parent-1',
        displayName: 'Learner',
        ageYears: 7,
        grade: '1',
        actorId: 'admin-1',
        writeId: 'write-1',
      }),
    ).toThrow('personId_required');

    expect(() =>
      planCanonicalLearnerCreate({
        personId: 'kid-1',
        parentId: 'parent-1',
        displayName: 'Learner',
        ageYears: 7.5,
        grade: '1',
        actorId: 'admin-1',
        writeId: 'write-1',
      }),
    ).toThrow('ageYears_not_canonical');

    expect(() =>
      planCanonicalLearnerCreate({
        personId: 'kid-1',
        parentId: 'parent-1',
        displayName: 'Learner',
        ageYears: 7,
        grade: '1',
        countryCode: 'IND',
        actorId: 'admin-1',
        writeId: 'write-1',
      }),
    ).toThrow('countryCode_not_iso_alpha2');
  });

  it('routes rich learner fields to canonical detail/private targets and same-ID nested compatibility', () => {
    const plan = planCanonicalLearnerCreate({
      personId: 'kid-rich-1',
      parentId: 'parent-1',
      displayName: 'Learner Rich',
      ageYears: 9,
      status: 'active',
      details: {
        preferredName: 'Rich',
        grade: 'Grade 3',
        board: 'CBSE',
        gender: 'female',
        profilePhotoUrl: 'https://example.com/photo.jpg',
      },
      privateProfile: {
        notes: 'Private admin note',
        emergencyContact: '+91 9000000000',
        medicalNotes: 'Allergy note',
      },
      nestedParentStudentCompatibility: {
        enabled: true,
        courses: ['phonics-foundation', 'basic-grammar'],
        createdByRole: 'admin',
      },
      actorId: 'admin-1',
      writeId: 'write-rich-1',
    });

    const details = plan.canonicalDocuments.find(
      (document) => document.collection === 'learnerDetails',
    );
    const privateProfile = plan.canonicalDocuments.find(
      (document) => document.collection === 'learnerPrivateProfiles',
    );
    const kid = plan.compatibilityDocuments.find(
      (document) => document.collection === 'kids',
    );
    const nested = plan.compatibilityNestedDocuments[0];

    expect(details?.data).toMatchObject({
      learnerDetailsId: 'kid-rich-1',
      personId: 'kid-rich-1',
      preferredName: 'Rich',
      grade: 'Grade 3',
      board: 'CBSE',
      gender: 'female',
      profilePhotoUrl: 'https://example.com/photo.jpg',
    });

    expect(privateProfile?.data).toMatchObject({
      learnerPrivateProfileId: 'kid-rich-1',
      personId: 'kid-rich-1',
      notes: 'Private admin note',
      emergencyContact: '+91 9000000000',
      medicalNotes: 'Allergy note',
    });

    expect(kid?.data).toMatchObject({
      fullName: 'Learner Rich',
      grade: 'Grade 3',
      gender: 'female',
      parentId: 'parent-1',
    });
    expect(kid?.data).not.toHaveProperty('medicalNotes');
    expect(kid?.data).not.toHaveProperty('emergencyContact');
    expect(kid?.data).not.toHaveProperty('notes');
    expect(kid?.data).not.toHaveProperty('courses');

    expect(nested).toMatchObject({
      parentCollection: 'parents',
      parentId: 'parent-1',
      collection: 'students',
      documentId: 'kid-rich-1',
      serverTimestampFields: ['enrollmentDate'],
      data: {
        studentId: 'kid-rich-1',
        parentId: 'parent-1',
        fullName: 'Learner Rich',
        preferredName: 'Rich',
        board: 'CBSE',
        gender: 'female',
        courses: ['phonics-foundation', 'basic-grammar'],
        notes: 'Private admin note',
        emergencyContact: '+91 9000000000',
        medicalNotes: 'Allergy note',
        _wave1CanonicalProjection: {
          canonicalPersonId: 'kid-rich-1',
          authority: 'canonical-primary',
          command: 'learner_create',
          writeId: 'write-rich-1',
        },
      },
    });
  });

  it('does not invent a canonical mapping for legacy trial or inactive learner status', () => {
    for (const status of ['trial', 'inactive']) {
      expect(() =>
        planCanonicalLearnerCreate({
          personId: 'kid-status-1',
          parentId: 'parent-1',
          displayName: 'Learner',
          ageYears: 7,
          grade: '1',
          status: status as any,
          actorId: 'admin-1',
          writeId: 'write-status-1',
        }),
      ).toThrow('learner_status_not_canonical');
    }
  });

});
