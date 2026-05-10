// src/types/Student.ts

export interface StudentSummary {
  phonicsMastery: number;
  grammarMastery: number;
  speakingMastery: number;
  attendanceRate30d: number;
  creditsRemaining: number;
}

export type StudentStatus = 'active' | 'suspended' | 'archived';

export interface Student {
  id: string;
  fullName: string;

  // ✅ NEW: store age (years) instead of DOB
  ageYears: number;

  grade: string;
  countryCode?: string;

  parentIds: string[];
  primaryParentId: string;

  lpId?: string;

  status: StudentStatus;
  summary: StudentSummary;

  createdAt: any;
  updatedAt: any;

  /**
   * Optional legacy fields that might exist in old docs.
   * Keep optional so old Firestore data doesn't break TS.
   */
  dob?: string; // legacy (YYYY-MM-DD) - do not use going forward
  birthdate?: string; // legacy
}
