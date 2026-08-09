import { collection, getDocs } from 'firebase/firestore';

import { db } from '../lib/firebaseConfig';
import callFunction from '../lib/callFunctions';
import type {
  AssessmentCheckpoint,
  AssessmentSummary,
  ReadingDomainScores,
  ReadingLevelDistribution,
  ReviewImplementationRating,
  ReviewMastery,
  ReviewOverallStatus,
  SchoolEvidenceSnapshot,
  SchoolReview,
} from '../types/SchoolProgramme';

const nullableString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const mastery = (value: unknown): ReviewMastery | null => {
  const next = String(value || '');
  if (next === 'emerging' || next === 'developing' || next === 'proficient' || next === 'mastered') return next;
  return null;
};

const reviewStatus = (value: unknown): ReviewOverallStatus => {
  const next = String(value || '');
  if (next === 'needs_attention' || next === 'intervention') return next;
  return 'on_track';
};

const implementation = (value: unknown): ReviewImplementationRating => {
  const next = String(value || '');
  if (next === 'developing' || next === 'needs_support') return next;
  return 'strong';
};

export const toSchoolReview = (id: string, data: Record<string, any>): SchoolReview => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  sectionId: nullableString(data.sectionId),
  gradeId: nullableString(data.gradeId),
  gradeLabel: nullableString(data.gradeLabel),
  sectionName: nullableString(data.sectionName),
  reviewedAt: data.reviewedAt,
  reviewedBy: String(data.reviewedBy || ''),
  reviewedByName: String(data.reviewedByName || 'Tiny Steps'),
  implementationRating: implementation(data.implementationRating),
  blending: mastery(data.blending),
  segmenting: mastery(data.segmenting),
  decoding: mastery(data.decoding),
  overallStatus: reviewStatus(data.overallStatus),
  summary: String(data.summary || ''),
  recommendation: String(data.recommendation || ''),
  nextReviewAt: data.nextReviewAt,
});

const checkpoint = (value: unknown): AssessmentCheckpoint => {
  const next = String(value || 'custom');
  if (next === 'baseline' || next === 'checkpoint_1' || next === 'mid' || next === 'final') return next;
  return 'custom';
};

const domainScores = (value: unknown): ReadingDomainScores => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const score = (key: string) => {
    const raw = data[key];
    return raw === null || raw === undefined ? null : Number(raw);
  };
  return {
    phonologicalAwareness: score('phonologicalAwareness'),
    soundKnowledge: score('soundKnowledge'),
    blendingDecoding: score('blendingDecoding'),
    segmentingEncoding: score('segmentingEncoding'),
    connectedText: score('connectedText'),
    comprehension: score('comprehension'),
  };
};

const distribution = (value: unknown): ReadingLevelDistribution => {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    TS0: Number(data.TS0 || 0),
    TS1: Number(data.TS1 || 0),
    TS2: Number(data.TS2 || 0),
    TS3: Number(data.TS3 || 0),
    TS4: Number(data.TS4 || 0),
    TS5: Number(data.TS5 || 0),
    TS6: Number(data.TS6 || 0),
    TS7: Number(data.TS7 || 0),
    TS8: Number(data.TS8 || 0),
    TS9: Number(data.TS9 || 0),
  };
};

export const toAssessmentSummary = (
  id: string,
  data: Record<string, any>,
): AssessmentSummary => ({
  id,
  schoolId: String(data.schoolId || ''),
  academicYearId: String(data.academicYearId || ''),
  sectionId: String(data.sectionId || ''),
  gradeId: String(data.gradeId || ''),
  gradeKey: String(data.gradeKey || ''),
  gradeLabel: String(data.gradeLabel || ''),
  sectionName: String(data.sectionName || ''),
  checkpoint: checkpoint(data.checkpoint),
  studentsAssessed: Number(data.studentsAssessed || 0),
  sectionStudentCountSnapshot: Number(data.sectionStudentCountSnapshot || 0),
  averageReadingLevel: Number(data.averageReadingLevel || 0),
  levelDistribution: distribution(data.levelDistribution),
  domainScores: domainScores(data.domainScores),
  assessmentVersion: String(data.assessmentVersion || 'TSERB-1.0'),
  notes: nullableString(data.notes),
  assessedAt: data.assessedAt,
  assessedBy: String(data.assessedBy || ''),
  assessedByName: String(data.assessedByName || 'Tiny Steps'),
});

export async function getSchoolEvidence(
  schoolId: string,
  academicYearId: string,
): Promise<SchoolEvidenceSnapshot> {
  const [reviewSnap, assessmentSnap] = await Promise.all([
    getDocs(
      collection(
        db,
        'schools',
        schoolId,
        'academicYears',
        academicYearId,
        'reviews',
      ),
    ),
    getDocs(
      collection(
        db,
        'schools',
        schoolId,
        'academicYears',
        academicYearId,
        'assessmentSummaries',
      ),
    ),
  ]);

  return {
    reviews: reviewSnap.docs.map((item) => toSchoolReview(item.id, item.data())),
    assessments: assessmentSnap.docs.map((item) => toAssessmentSummary(item.id, item.data())),
  };
}

export const createSchoolReview = (input: {
  schoolId: string;
  academicYearId: string;
  sectionId?: string | null;
  implementationRating: ReviewImplementationRating;
  blending?: ReviewMastery | null;
  segmenting?: ReviewMastery | null;
  decoding?: ReviewMastery | null;
  overallStatus: ReviewOverallStatus;
  summary: string;
  recommendation: string;
  nextReviewAt?: string | null;
}) => callFunction<{ ok: true; reviewId: string }>('schoolCreateReview', input);

export const recordAssessmentSummary = (input: {
  schoolId: string;
  academicYearId: string;
  sectionId: string;
  checkpoint: AssessmentCheckpoint;
  studentsAssessed: number;
  averageReadingLevel: number;
  levelDistribution: ReadingLevelDistribution;
  domainScores: ReadingDomainScores;
  assessmentVersion?: string;
  notes?: string;
}) => callFunction<{ ok: true; assessmentId: string }>('schoolRecordAssessmentSummary', input);
