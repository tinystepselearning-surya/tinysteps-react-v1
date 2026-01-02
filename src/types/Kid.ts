// src/types/kid.ts

export interface Kid {
  id: string; // Unique identifier for the kid document

  // ✅ Prefer one consistent field name going forward
  fullName: string; // Full name of the child

  // ✅ NEW: store age (years) instead of DOB/birthdate
  ageYears: number;

  // ✅ Your newer schema uses parentIds + primaryParentId.
  // Keep parentId optional only for legacy docs.
  parentIds: string[];
  primaryParentId: string;

  teacherId?: string; // UID of the assigned teacher (optional)
  lpId?: string; // UID of assigned learning partner (optional)

  sessionId?: string; // optional (legacy/feature-specific)
  progressSummary?: string; // optional

  status?: 'active' | 'suspended' | 'archived';

  summary?: {
    phonicsMastery: number;
    grammarMastery: number;
    speakingMastery: number;
    attendanceRate30d: number;
    creditsRemaining: number;
  };

  createdAt: any;
  updatedAt: any;

  /**
   * Optional legacy fields (old docs may still have these).
   * Keep optional so TypeScript doesn’t break while you migrate.
   */
  name?: string; // legacy alias of fullName
  parentId?: string; // legacy single parent id
  birthdate?: string; // legacy DOB
  dob?: string; // legacy DOB
}
