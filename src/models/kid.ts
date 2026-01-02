// src/models/kid.ts

export interface KidSummary {
  phonicsMastery: number;
  grammarMastery: number;
  speakingMastery: number;
  attendanceRate30d: number;
  creditsRemaining: number;
}

export type KidStatus = 'active' | 'suspended' | 'archived';

export interface Kid {
  id?: string;

  fullName: string;

  /**
   * ✅ New policy: store only age (years).
   * Use a whole number like 3, 5, 7.
   */
  age?: number | null;

  /**
   * ⚠️ Legacy (do not write going forward).
   * Kept optional so older data doesn't break UI.
   */
  dob?: string; // YYYY-MM-DD

  grade: string;

  parentIds: string[];
  primaryParentId?: string;

  status: KidStatus;

  summary: KidSummary;

  createdAt?: any;
  updatedAt?: any;
}

// NewKidInput = what createKid expects
export type NewKidInput = Omit<Kid, 'id' | 'createdAt' | 'updatedAt'>;

export interface KidQueryFilters {
  parentId?: string;
}
