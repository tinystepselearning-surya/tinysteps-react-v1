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
