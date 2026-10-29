/**
 * Only publish teacher details verified by Tiny Steps and individually approved for
 * public display. Do not import private teacher/auth/HR collections into this file.
 * Keep names, qualifications, specialties and credentials out of page schema until
 * written publication permission is recorded.
 */
export type PublicTeacherProfile = {
  publicName: string;
  position: string;
  qualifications: readonly string[];
  specialisms: readonly string[];
  experienceSummary?: string;
  publicationApproved: true;
};

// Public roster pending verification and publication consent; never invent credentials.
export const APPROVED_PUBLIC_TEACHER_PROFILES: readonly PublicTeacherProfile[] = [];
