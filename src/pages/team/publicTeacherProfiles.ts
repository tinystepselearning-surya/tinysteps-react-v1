/**
 * Public, manually curated academic faculty directory.
 *
 * Do NOT import authenticated teacher records, Firestore user profiles or HR data.
 * A person's public name, qualifications, profile photo and description require
 * verification and their explicit written permission before adding a record.
 * Any internal certification claim must reflect a completed, documented assessment.
 * Images belong in public/images/team/ (see the team-photo-upload-guide).
 */
export type TeachingSpecialism = 'phonics' | 'grammar' | 'public-speaking';
export type TrainerFocusArea =
  | 'phonics-reading'
  | 'grammar-speaking'
  | 'child-pedagogy'
  | 'teaching-quality';

export type PublicAcademicProfile = {
  /** Stable key, independent of the person's display name. */
  id: string;
  publicName: string;
  position: string;
  qualifications: readonly string[];
  experienceSummary?: string;
  photoPath?: string;
  /** Publication approval is granted per person, never inherited from employment. */
  publicationApproved: true;
};

export type PublicTeacherProfile = PublicAcademicProfile & {
  specialisms: readonly TeachingSpecialism[];
  expertise?: readonly string[];
  /** Use only when a completion/assessment record exists. */
  internalTrainingStatus?: 'completed' | 'assessed-and-certified';
};

export type PublicTrainerProfile = PublicAcademicProfile & {
  focusAreas: readonly TrainerFocusArea[];
};

export type TrainingFocus = {
  id: TrainerFocusArea;
  title: string;
  description: string;
};

export const TRAINING_FOCUS_AREAS: readonly TrainingFocus[] = [
  {
    id: 'phonics-reading',
    title: 'Phonics & Reading',
    description: 'Sound awareness, blending, decoding, spelling patterns and guided reading practice.',
  },
  {
    id: 'grammar-speaking',
    title: 'Grammar & Public Speaking',
    description: 'Sentence building, grammatical accuracy, storytelling and purposeful communication.',
  },
  {
    id: 'child-pedagogy',
    title: 'Child Pedagogy & Learning Methods',
    description: 'Child development, engagement, age-appropriate teaching strategies and independent thinking.',
  },
  {
    id: 'teaching-quality',
    title: 'Teaching Techniques & Classroom Quality',
    description: 'Lesson delivery, modelling, participation, feedback and reflective classroom improvement.',
  },
];

/**
 * A founder biography and existing approved portrait are already published in
 * TeamPageSections. This roster is for the *additional* academic leader.
 */
export const APPROVED_ACADEMIC_LEADERSHIP_PROFILES: readonly PublicAcademicProfile[] = [];

/** Add three or four trainers here when their identity and focus areas are confirmed. */
export const APPROVED_PUBLIC_TRAINER_PROFILES: readonly PublicTrainerProfile[] = [];

/** Add each teacher once; specialisms determine which public category links find them. */
export const APPROVED_PUBLIC_TEACHER_PROFILES: readonly PublicTeacherProfile[] = [];

/** The publishability check is intentionally redundant with the TypeScript consent type. */
export function isApprovedPublicProfile<T extends PublicAcademicProfile>(profile: T): boolean {
  return profile.publicationApproved === true
    && profile.publicName.trim().length > 0
    && profile.position.trim().length > 0
    && profile.qualifications.length > 0;
}
