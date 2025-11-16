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
