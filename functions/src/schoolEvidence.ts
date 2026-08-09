import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { ensureSchoolManager } from './helpers/schoolAuthorization';

if (!admin.apps.length) admin.initializeApp();

const REGION = 'asia-south1';
const LEVEL_KEYS = ['TS0', 'TS1', 'TS2', 'TS3', 'TS4', 'TS5', 'TS6', 'TS7', 'TS8', 'TS9'] as const;
const DOMAIN_KEYS = [
  'phonologicalAwareness',
  'soundKnowledge',
  'blendingDecoding',
  'segmentingEncoding',
  'connectedText',
  'comprehension',
] as const;

const required = (value: unknown, field: string, max = 2000): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpsError('invalid-argument', `${field} is required`);
  }
  const next = value.trim();
  if (next.length > max) throw new HttpsError('invalid-argument', `${field} is too long`);
  return next;
};

const optional = (value: unknown, max = 2000): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Expected a string');
  const next = value.trim();
  if (!next) return null;
  if (next.length > max) throw new HttpsError('invalid-argument', 'Text is too long');
  return next;
};

const integer = (value: unknown, field: string, min: number, max: number): number => {
  const next = Number(value);
  if (!Number.isInteger(next) || next < min || next > max) {
    throw new HttpsError('invalid-argument', `${field} must be an integer between ${min} and ${max}`);
  }
  return next;
};

const boundedNumber = (value: unknown, field: string, min: number, max: number): number => {
  const next = Number(value);
  if (!Number.isFinite(next) || next < min || next > max) {
    throw new HttpsError('invalid-argument', `${field} must be between ${min} and ${max}`);
  }
  return Math.round(next * 100) / 100;
};

const enumValue = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T => {
  const next = String(value || '').trim().toLowerCase() as T;
  if (!allowed.includes(next)) {
    throw new HttpsError('invalid-argument', `Invalid ${field}`);
  }
  return next;
};

const optionalMastery = (
  value: unknown,
): 'emerging' | 'developing' | 'proficient' | 'mastered' | null => {
  if (value === null || value === undefined || value === '') return null;
  return enumValue(value, 'mastery rating', [
    'emerging',
    'developing',
    'proficient',
    'mastered',
  ] as const);
};

const nextReviewTimestamp = (value: unknown): admin.firestore.Timestamp | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', 'nextReviewAt must be an ISO date string');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid next review date');
  }
  return admin.firestore.Timestamp.fromDate(date);
};

async function requireAcademicYear(
  schoolId: string,
  academicYearId: string,
): Promise<admin.firestore.DocumentReference> {
  const ref = admin
    .firestore()
    .collection('schools')
    .doc(schoolId)
    .collection('academicYears')
    .doc(academicYearId);
  if (!(await ref.get()).exists) throw new HttpsError('not-found', 'Academic year not found');
  return ref;
}

async function resolveSection(
  yearRef: admin.firestore.DocumentReference,
  sectionId: string | null,
): Promise<admin.firestore.DocumentData | null> {
  if (!sectionId) return null;
  const snap = await yearRef.collection('sections').doc(sectionId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Section not found');
  return snap.data() || {};
}

function validateDistribution(
  input: unknown,
  studentsAssessed: number,
): Record<(typeof LEVEL_KEYS)[number], number> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpsError('invalid-argument', 'levelDistribution is required');
  }
  const raw = input as Record<string, unknown>;
  const output = {} as Record<(typeof LEVEL_KEYS)[number], number>;
  let total = 0;
  for (const key of LEVEL_KEYS) {
    const count = integer(raw[key] ?? 0, `levelDistribution.${key}`, 0, studentsAssessed);
    output[key] = count;
    total += count;
  }
  if (total !== studentsAssessed) {
    throw new HttpsError(
      'invalid-argument',
      `Reading-level distribution must total studentsAssessed (${studentsAssessed})`,
    );
  }
  return output;
}

function validateDomainScores(input: unknown): Record<string, number | null> {
  const raw = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const output: Record<string, number | null> = {};
  for (const key of DOMAIN_KEYS) {
    const value = raw[key];
    output[key] = value === null || value === undefined || value === ''
      ? null
      : boundedNumber(value, `domainScores.${key}`, 0, 100);
  }
  return output;
}

export const schoolCreateReview = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const schoolId = required(request.data?.schoolId, 'schoolId', 128);
    const academicYearId = required(request.data?.academicYearId, 'academicYearId', 128);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const yearRef = await requireAcademicYear(schoolId, academicYearId);
    const sectionId = optional(request.data?.sectionId, 128);
    const section = await resolveSection(yearRef, sectionId);

    const implementationRating = enumValue(
      request.data?.implementationRating,
      'implementationRating',
      ['strong', 'developing', 'needs_support'] as const,
    );
    const overallStatus = enumValue(
      request.data?.overallStatus,
      'overallStatus',
      ['on_track', 'needs_attention', 'intervention'] as const,
    );
    const blending = optionalMastery(request.data?.blending);
    const segmenting = optionalMastery(request.data?.segmenting);
    const decoding = optionalMastery(request.data?.decoding);
    const summary = required(request.data?.summary, 'summary', 2000);
    const recommendation = required(request.data?.recommendation, 'recommendation', 2000);
    const nextReviewAt = nextReviewTimestamp(request.data?.nextReviewAt);
    const reviewerName = String(
      manager.user.displayName || manager.user.name || manager.user.email || 'Tiny Steps',
    ).trim();

    const now = admin.firestore.FieldValue.serverTimestamp();
    const ref = yearRef.collection('reviews').doc();
    await ref.set({
      schemaVersion: 1,
      schoolId,
      academicYearId,
      sectionId,
      gradeId: section ? String(section.gradeId || '') : null,
      gradeLabel: section ? String(section.gradeLabel || '') : null,
      sectionName: section ? String(section.sectionName || '') : null,
      reviewedAt: now,
      reviewedBy: manager.uid,
      reviewedByName: reviewerName,
      implementationRating,
      blending,
      segmenting,
      decoding,
      overallStatus,
      summary,
      recommendation,
      nextReviewAt,
      createdAt: now,
      createdBy: manager.uid,
    });

    return { ok: true, schoolId, academicYearId, reviewId: ref.id };
  },
);

export const schoolRecordAssessmentSummary = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    const schoolId = required(request.data?.schoolId, 'schoolId', 128);
    const academicYearId = required(request.data?.academicYearId, 'academicYearId', 128);
    const sectionId = required(request.data?.sectionId, 'sectionId', 128);
    const manager = await ensureSchoolManager(request.auth, schoolId);
    const yearRef = await requireAcademicYear(schoolId, academicYearId);
    const section = await resolveSection(yearRef, sectionId);
    if (!section) throw new HttpsError('not-found', 'Section not found');

    const sectionStudentCount = integer(section.studentCount ?? 0, 'section.studentCount', 0, 500);
    if (sectionStudentCount < 1) {
      throw new HttpsError('failed-precondition', 'Section student count must be greater than zero before assessment');
    }
    const studentsAssessed = integer(
      request.data?.studentsAssessed,
      'studentsAssessed',
      1,
      sectionStudentCount,
    );
    const checkpoint = enumValue(
      request.data?.checkpoint,
      'checkpoint',
      ['baseline', 'checkpoint_1', 'mid', 'final', 'custom'] as const,
    );
    const averageReadingLevel = boundedNumber(
      request.data?.averageReadingLevel,
      'averageReadingLevel',
      0,
      9,
    );
    const levelDistribution = validateDistribution(
      request.data?.levelDistribution,
      studentsAssessed,
    );
    const domainScores = validateDomainScores(request.data?.domainScores);
    const assessmentVersion =
      optional(request.data?.assessmentVersion, 80) || 'TSERB-1.0';
    const notes = optional(request.data?.notes, 2000);
    const assessorName = String(
      manager.user.displayName || manager.user.name || manager.user.email || 'Tiny Steps',
    ).trim();

    const now = admin.firestore.FieldValue.serverTimestamp();
    const ref = yearRef.collection('assessmentSummaries').doc();
    await ref.set({
      schemaVersion: 1,
      schoolId,
      academicYearId,
      sectionId,
      gradeId: String(section.gradeId || ''),
      gradeKey: String(section.gradeKey || ''),
      gradeLabel: String(section.gradeLabel || ''),
      sectionName: String(section.sectionName || sectionId),
      checkpoint,
      studentsAssessed,
      sectionStudentCountSnapshot: sectionStudentCount,
      averageReadingLevel,
      levelDistribution,
      domainScores,
      assessmentVersion,
      notes,
      assessedAt: now,
      assessedBy: manager.uid,
      assessedByName: assessorName,
      createdAt: now,
      createdBy: manager.uid,
    });

    return {
      ok: true,
      schoolId,
      academicYearId,
      sectionId,
      assessmentId: ref.id,
      checkpoint,
      studentsAssessed,
    };
  },
);
