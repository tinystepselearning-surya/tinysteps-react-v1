import { Timestamp } from 'firebase/firestore';

export interface ProgressItem {
  id?: string;
  kidId?: string;
  studentId?: string;
  courseId?: string;
  area?: string;
  score?: number;
}

export interface Session {
  id?: string;
  courseId?: string;
  teacherId?: string;
  kidIds?: string[];
  date?: string; // YYYY-MM-DD
  status?: string;
}

export interface AttendanceRecord {
  kidId: string;
  status: 'present' | 'absent' | 'late';
  markedAt?: Timestamp | any;
  markedBy?: string;
}

export interface Enrollment {
  id?: string;
  kidIds?: string[];
  parentId?: string;
  teacherId?: string;
  courseId?: string;
  status?: string;
  creditsRemaining?: number;
  creditsUsed?: number;
}

export interface Invoice {
  id?: string;
  parentId?: string;
  enrollmentId?: string;
  amount?: number;
  dueDate?: string;
  status?: string;
}

export interface Course {
  id?: string;
  name: string;
  area: 'Phonics' | 'Grammar' | 'Speaking';
  level: number;
  description: string;
  durationMinutes: number;
  sessionFrequency: 'weekly' | 'biweekly' | 'monthly';
  ratePerSession: number;
  topics: string[];
  prerequisites?: string[];
  targetAge: number[];
  targetGrade: string[];
  maxStudentsPerSession: number;
  status: 'active' | 'inactive' | 'draft';
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Topic {
  id?: string;
  courseId: string;
  name: string;
  description: string;
  sequenceNumber: number;
  practiceExercises: string[];
  worksheets: string[];
  games: string[];
  estimatedMinutes: number;
  targetMastery: number;
  createdAt: Timestamp;
}

export type DemoSessionStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export type DemoOutcome =
  | 'completed'
  | 'parent_no_show'
  | 'teacher_no_show'
  | 'reschedule_requested'
  | 'not_interested'
  | 'follow_up_needed';

export type DemoConversionStatus =
  | 'interested'
  | 'enrolled'
  | 'not_interested'
  | 'follow_up_later'
  | 'wrong_fit'
  | 'no_response';

export type DemoClassType = 'one_to_one' | 'group';

export type DemoChildLevelObserved =
  | 'below_grade_level'
  | 'near_grade_level'
  | 'at_grade_level'
  | 'above_grade_level';

export type DemoReadingLevel =
  | 'non_reader'
  | 'beginner_reader'
  | 'developing_reader'
  | 'fluent_reader';

export type DemoPhonicsAwareness = 'needs_support' | 'basic' | 'good' | 'strong';

export type DemoSpeakingConfidence = 'very_low' | 'low' | 'medium' | 'high';

export type DemoAttentionSpan = 'short' | 'moderate' | 'good' | 'strong';

export type DemoParentExpectation =
  | 'school_support'
  | 'reading_improvement'
  | 'speaking_confidence'
  | 'exam_preparation'
  | 'mixed_goals';

export type DemoRecommendedNextStep =
  | 'start_trial_classes'
  | 'start_weekly_program'
  | 'one_to_one_plan'
  | 'group_batch_plan'
  | 'reassess_later';

export type DemoHistoryAction =
  | 'created'
  | 'claimed'
  | 'schedule_updated'
  | 'completed'
  | 'reassigned'
  | 'cancelled'
  | 'released'
  | 'reopened'
  | 'follow_up_updated';

export interface DemoSessionHistoryEntry {
  action: DemoHistoryAction;
  actorId?: string | null;
  actorName?: string | null;
  atMs: number;
  note?: string | null;
}

export interface DemoSession {
  id: string;
  parentName: string;
  childName: string;
  childGrade: string;
  childAge?: number | null;
  courseInterested: string;
  source?: string | null;
  demoMode?: string | null;
  preferredDateTimeText: string;
  timezone?: string | null;
  adminNotes?: string | null;
  status: DemoSessionStatus;
  assignedTeacherId?: string | null;
  assignedTeacherName?: string | null;
  assignedAt?: Timestamp | null;
  teacherConfirmedDate?: string | null;
  teacherConfirmedTime?: string | null;
  teacherPreDemoNote?: string | null;
  outcome?: DemoOutcome | null;
  teacherRemarks?: string | null;
  teacherRecommendation?: string | null;
  childLevelObserved?: DemoChildLevelObserved | null;
  readingLevel?: DemoReadingLevel | null;
  phonicsAwareness?: DemoPhonicsAwareness | null;
  speakingConfidence?: DemoSpeakingConfidence | null;
  attentionSpan?: DemoAttentionSpan | null;
  parentExpectation?: DemoParentExpectation | null;
  recommendedNextStep?: DemoRecommendedNextStep | null;
  releasedAt?: Timestamp | null;
  reopenedAt?: Timestamp | null;
  history?: DemoSessionHistoryEntry[] | null;
  conversionStatus?: DemoConversionStatus | null;
  recommendedCourse?: string | null;
  recommendedClassType?: DemoClassType | null;
  recommendedFrequency?: string | null;
  feeDiscussed?: string | null;
  followUpDate?: string | null;
  completedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  createdBy: string;
  lastUpdatedAt?: Timestamp | null;
  lastUpdatedBy?: string | null;
}

export interface DemoSessionPrivate {
  id: string;
  parentPhone: string;
  createdAt?: Timestamp | null;
  createdBy: string;
  lastUpdatedAt?: Timestamp | null;
  lastUpdatedBy?: string | null;
}

export interface CreateDemoSessionInput {
  parentName: string;
  parentPhone: string;
  childName: string;
  childGrade: string;
  childAge?: number | null;
  courseInterested: string;
  source?: string | null;
  demoMode?: string | null;
  preferredDateTimeText: string;
  timezone?: string | null;
  adminNotes?: string | null;
}
