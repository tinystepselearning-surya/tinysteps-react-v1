import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { FieldValue } from 'firebase-admin/firestore';

import {
  CANONICAL_PRIMARY_WRITE_AUTHORITY,
  CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION,
} from './canonicalPrimaryPlanner';
import {
  canonicalIdentityTelemetryToken,
  expectedFieldsMatch,
} from './canonicalPrimaryWriter';

type LooseDoc = admin.firestore.DocumentData;

export const CANONICAL_PRIMARY_LEARNER_UPDATE_EVENT =
  'wave1_canonical_primary_learner_update' as const;

export type CanonicalPrimaryLearnerUpdateErrorCode =
  | 'learner_canonical_person_missing'
  | 'learner_canonical_person_ineligible'
  | 'learner_profile_missing'
  | 'learner_profile_ineligible'
  | 'learner_compatibility_missing'
  | 'archive_requires_lifecycle_workflow'
  | 'archived_reactivation_unsupported';

export class CanonicalPrimaryLearnerUpdateError extends Error {
  readonly code: CanonicalPrimaryLearnerUpdateErrorCode;

  constructor(
    code: CanonicalPrimaryLearnerUpdateErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CanonicalPrimaryLearnerUpdateError';
    this.code = code;
  }
}

export interface CanonicalLearnerUpdateFields {
  displayName: string;
  ageYears: number;
  grade: string;
  status: 'active' | 'suspended' | 'archived' | null;
  countryCode: string | null;
}

export interface ExecuteCanonicalLearnerUpdateInput
  extends CanonicalLearnerUpdateFields {
  db: admin.firestore.Firestore;
  actorId: string;
  personId: string;
}

export interface ExecuteCanonicalLearnerUpdateResult {
  personId: string;
  writeId: string;
  canonicalDocumentsWritten: number;
  compatibilityDocumentsWritten: number;
  postWriteVerified: boolean;
  verificationIssues: string[];
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDisplayName(value: unknown): string {
  const displayName = cleanText(value).replace(/\s+/g, ' ');
  if (displayName.length < 2 || displayName.length > 100) {
    throw new Error('displayName_not_canonical');
  }
  return displayName;
}

function normalizeAgeYears(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 2 ||
    value > 15
  ) {
    throw new Error('ageYears_not_canonical');
  }
  return value;
}

function normalizeGrade(value: unknown): string {
  const grade = cleanText(value).replace(/\s+/g, ' ');
  if (!grade || grade.length > 100) {
    throw new Error('grade_not_canonical');
  }
  return grade;
}

function normalizeStatus(
  value: unknown,
): 'active' | 'suspended' | 'archived' | null {
  if (value == null || value === '') return null;
  const status = cleanText(value).toLowerCase();
  if (
    status === 'active' ||
    status === 'suspended' ||
    status === 'archived'
  ) {
    return status;
  }
  throw new Error('learner_status_not_canonical');
}

function normalizeCountryCode(
  value: unknown,
): string | null {
  if (value == null || value === '') return null;
  const countryCode = cleanText(value).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new Error('countryCode_not_iso_alpha2');
  }
  return countryCode;
}

export function normalizeCanonicalLearnerUpdateFields(
  input: Partial<CanonicalLearnerUpdateFields>,
): CanonicalLearnerUpdateFields {
  return {
    displayName: normalizeDisplayName(input.displayName),
    ageYears: normalizeAgeYears(input.ageYears),
    grade: normalizeGrade(input.grade),
    status: normalizeStatus(input.status),
    countryCode: normalizeCountryCode(input.countryCode),
  };
}

function canonicalAuthority(writeId: string) {
  return {
    schemaVersion: CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION,
    authority: CANONICAL_PRIMARY_WRITE_AUTHORITY,
    command: 'learner_update' as const,
    writeId,
  };
}

function compatibilityMarker(params: {
  personId: string;
  writeId: string;
}) {
  return {
    schemaVersion: CANONICAL_PRIMARY_WRITE_SCHEMA_VERSION,
    authority: CANONICAL_PRIMARY_WRITE_AUTHORITY,
    command: 'learner_update' as const,
    writeId: params.writeId,
    canonicalPersonId: params.personId,
  };
}

function canonicalLearnerStatus(
  data: LooseDoc,
): 'active' | 'suspended' | 'archived' | null {
  const status = cleanText(data.status).toLowerCase();
  if (
    status === 'active' ||
    status === 'suspended' ||
    status === 'archived'
  ) {
    return status;
  }
  return null;
}

function countryCodeIsCleared(
  data: LooseDoc | null,
): boolean {
  return Boolean(data) &&
    !Object.prototype.hasOwnProperty.call(data, 'countryCode');
}

async function verifyCanonicalLearnerUpdate(params: {
  db: admin.firestore.Firestore;
  personId: string;
  actorId: string;
  writeId: string;
  fields: CanonicalLearnerUpdateFields;
  finalStatus: 'active' | 'suspended' | 'archived';
}): Promise<string[]> {
  const {
    db,
    personId,
    actorId,
    writeId,
    fields,
    finalStatus,
  } = params;
  const issues: string[] = [];
  const authority = canonicalAuthority(writeId);
  const marker = compatibilityMarker({
    personId,
    writeId,
  });

  const [personSnap, profileSnap, detailsSnap, kidSnap] =
    await Promise.all([
      db.collection('people').doc(personId).get(),
      db.collection('learnerProfiles').doc(personId).get(),
      db.collection('learnerDetails').doc(personId).get(),
      db.collection('kids').doc(personId).get(),
    ]);

  const person = personSnap.exists
    ? personSnap.data() || {}
    : null;
  const profile = profileSnap.exists
    ? profileSnap.data() || {}
    : null;
  const details = detailsSnap.exists
    ? detailsSnap.data() || {}
    : null;
  const kid = kidSnap.exists
    ? kidSnap.data() || {}
    : null;

  if (
    !expectedFieldsMatch(person, {
      personId,
      kind: 'learner',
      displayName: fields.displayName,
      status: finalStatus,
      updatedBy: actorId,
      canonicalAuthority: authority,
    })
  ) {
    issues.push('canonical_mismatch:people');
  }

  if (
    !expectedFieldsMatch(profile, {
      learnerProfileId: personId,
      personId,
      ageYears: fields.ageYears,
      status: finalStatus,
      updatedBy: actorId,
      canonicalAuthority: authority,
    })
  ) {
    issues.push('canonical_mismatch:learnerProfiles');
  }

  if (
    !expectedFieldsMatch(details, {
      learnerDetailsId: personId,
      personId,
      grade: fields.grade,
      updatedBy: actorId,
      canonicalAuthority: authority,
    })
  ) {
    issues.push('canonical_mismatch:learnerDetails');
  }

  if (
    !expectedFieldsMatch(kid, {
      fullName: fields.displayName,
      name: fields.displayName,
      displayName: fields.displayName,
      age: fields.ageYears,
      ageYears: fields.ageYears,
      grade: fields.grade,
      status: finalStatus,
      updatedBy: actorId,
      _wave1CanonicalProjection: marker,
    })
  ) {
    issues.push('compatibility_mismatch:kids');
  }

  if (fields.countryCode) {
    if (
      !expectedFieldsMatch(person, {
        countryCode: fields.countryCode,
      })
    ) {
      issues.push('canonical_mismatch:people.countryCode');
    }
    if (
      !expectedFieldsMatch(profile, {
        countryCode: fields.countryCode,
      })
    ) {
      issues.push('canonical_mismatch:learnerProfiles.countryCode');
    }
    if (
      !expectedFieldsMatch(kid, {
        countryCode: fields.countryCode,
      })
    ) {
      issues.push('compatibility_mismatch:kids.countryCode');
    }
  } else {
    if (!countryCodeIsCleared(person)) {
      issues.push('canonical_mismatch:people.countryCode');
    }
    if (!countryCodeIsCleared(profile)) {
      issues.push('canonical_mismatch:learnerProfiles.countryCode');
    }
    if (!countryCodeIsCleared(kid)) {
      issues.push('compatibility_mismatch:kids.countryCode');
    }
  }

  if (
    kid &&
    ['dob', 'birthdate', 'dateOfBirth'].some((field) =>
      Object.prototype.hasOwnProperty.call(kid, field))
  ) {
    issues.push('compatibility_mismatch:kids.dob_fields');
  }

  return issues;
}

export async function executeCanonicalLearnerUpdate(
  input: ExecuteCanonicalLearnerUpdateInput,
): Promise<ExecuteCanonicalLearnerUpdateResult> {
  const personId = cleanText(input.personId);
  const actorId = cleanText(input.actorId);
  if (!personId) throw new Error('personId_required');
  if (!actorId) throw new Error('actorId_required');

  const fields = normalizeCanonicalLearnerUpdateFields(input);
  const nonce = input.db.collection('people').doc().id;
  const writeId = `learner_update:${personId}:${nonce}`;
  let finalStatus: 'active' | 'suspended' | 'archived' = 'active';

  await input.db.runTransaction(async (transaction) => {
    const personRef = input.db.collection('people').doc(personId);
    const profileRef = input.db
      .collection('learnerProfiles')
      .doc(personId);
    const detailsRef = input.db
      .collection('learnerDetails')
      .doc(personId);
    const kidRef = input.db.collection('kids').doc(personId);

    const [personSnap, profileSnap, detailsSnap, kidSnap] =
      await Promise.all([
        transaction.get(personRef),
        transaction.get(profileRef),
        transaction.get(detailsRef),
        transaction.get(kidRef),
      ]);

    if (!personSnap.exists) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_canonical_person_missing',
        'Canonical learner Person was not found',
      );
    }
    const personData = personSnap.data() || {};
    if (
      cleanText(personData.personId) !== personId ||
      cleanText(personData.kind) !== 'learner'
    ) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_canonical_person_ineligible',
        'Canonical Person is not an eligible learner',
      );
    }

    if (!profileSnap.exists) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_profile_missing',
        'Canonical learner profile was not found',
      );
    }
    const profileData = profileSnap.data() || {};
    if (
      cleanText(profileData.personId) !== personId ||
      cleanText(profileData.learnerProfileId) !== personId
    ) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_profile_ineligible',
        'Canonical learner profile is not eligible for update',
      );
    }

    if (!kidSnap.exists) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_compatibility_missing',
        'Learner compatibility projection was not found',
      );
    }

    const currentStatus = canonicalLearnerStatus(personData);
    if (!currentStatus) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'learner_canonical_person_ineligible',
        'Canonical learner status is invalid',
      );
    }

    if (
      fields.status === 'archived' &&
      currentStatus !== 'archived'
    ) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'archive_requires_lifecycle_workflow',
        'Archiving must use the learner lifecycle workflow',
      );
    }

    if (
      currentStatus === 'archived' &&
      fields.status &&
      fields.status !== 'archived'
    ) {
      throw new CanonicalPrimaryLearnerUpdateError(
        'archived_reactivation_unsupported',
        'Archived learner reactivation is not supported by this profile writer',
      );
    }

    finalStatus = fields.status || currentStatus;

    const now = FieldValue.serverTimestamp();
    const authority = canonicalAuthority(writeId);
    const countryCode =
      fields.countryCode || FieldValue.delete();

    transaction.set(
      personRef,
      {
        displayName: fields.displayName,
        status: finalStatus,
        countryCode,
        updatedBy: actorId,
        updatedAt: now,
        canonicalAuthority: authority,
      },
      { merge: true },
    );

    transaction.set(
      profileRef,
      {
        ageYears: fields.ageYears,
        status: finalStatus,
        countryCode,
        updatedBy: actorId,
        updatedAt: now,
        canonicalAuthority: authority,
      },
      { merge: true },
    );

    transaction.set(
      detailsRef,
      {
        ...(detailsSnap.exists
          ? {}
          : {
              schemaVersion: 1,
              learnerDetailsId: personId,
              personId,
              createdBy: actorId,
              createdAt: now,
            }),
        grade: fields.grade,
        updatedBy: actorId,
        updatedAt: now,
        canonicalAuthority: authority,
      },
      { merge: true },
    );

    transaction.set(
      kidRef,
      {
        fullName: fields.displayName,
        name: fields.displayName,
        displayName: fields.displayName,
        age: fields.ageYears,
        ageYears: fields.ageYears,
        grade: fields.grade,
        status: finalStatus,
        countryCode,
        dob: FieldValue.delete(),
        birthdate: FieldValue.delete(),
        dateOfBirth: FieldValue.delete(),
        updatedBy: actorId,
        updatedAt: now,
        _wave1CanonicalProjection:
          compatibilityMarker({
            personId,
            writeId,
          }),
      },
      { merge: true },
    );
  });

  const verificationIssues =
    await verifyCanonicalLearnerUpdate({
      db: input.db,
      personId,
      actorId,
      writeId,
      fields,
      finalStatus,
    });

  const result: ExecuteCanonicalLearnerUpdateResult = {
    personId,
    writeId,
    canonicalDocumentsWritten: 3,
    compatibilityDocumentsWritten: 1,
    postWriteVerified: verificationIssues.length === 0,
    verificationIssues,
  };

  const telemetry = {
    event: CANONICAL_PRIMARY_LEARNER_UPDATE_EVENT,
    subjectToken: canonicalIdentityTelemetryToken(
      'learner',
      personId,
    ),
    actorToken: canonicalIdentityTelemetryToken(
      'actor',
      actorId,
    ),
    writeToken: canonicalIdentityTelemetryToken(
      'write',
      writeId,
    ),
    canonicalDocumentsWritten:
      result.canonicalDocumentsWritten,
    compatibilityDocumentsWritten:
      result.compatibilityDocumentsWritten,
    postWriteVerified: result.postWriteVerified,
    verificationIssues: result.verificationIssues,
  };

  if (result.postWriteVerified) {
    logger.info(
      CANONICAL_PRIMARY_LEARNER_UPDATE_EVENT,
      telemetry,
    );
  } else {
    logger.error(
      CANONICAL_PRIMARY_LEARNER_UPDATE_EVENT,
      telemetry,
    );
  }

  return result;
}
