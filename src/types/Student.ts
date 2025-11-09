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
  dob: string; // YYYY-MM-DD
  grade: string;
  parentIds: string[];
  primaryParentId: string;
  status: StudentStatus;
  summary: StudentSummary;
  createdAt: any;
  updatedAt: any;
}
