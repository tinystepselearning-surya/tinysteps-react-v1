export type EnrollmentStatus =
  | 'pending_teacher'
  | 'pending_lp_assignment'
  | 'pending_payment'
  | 'active'
  | 'cancelled';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  teacherId?: string | null;
  lpId?: string | null;
  parentId: string;
  status: EnrollmentStatus;
  ratePerSession: number;
  billingCycle: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  createdAt: any;
  updatedAt: any;
}
