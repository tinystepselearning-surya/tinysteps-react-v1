import { Timestamp } from 'firebase/firestore';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed';
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface TeacherSession {
  id: string;
  teacherId: string;
  courseId: string;
  courseName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  kidIds: string[];
  status: SessionStatus;
  joinUrl?: string;
  notes?: string;
  attendance?: Record<string, AttendanceStatus>;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface TeacherStudent {
  id: string;
  fullName: string;
  grade?: string;
  courseNames?: string[];
  progressStatus?: 'on_track' | 'needs_attention';
  lastSessionDate?: string;
  avatarUrl?: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  phonics: number;
  grammar: number;
  speaking: number;
  lastSession?: string;
  attendanceRate?: number;
}

export interface TeacherEarningsSummary {
  month: string; // YYYY-MM
  totalSessions: number;
  sessionsCompleted: number;
  sessionsPending: number;
  ratePerSession: number;
  totalEarnings: number;
  pendingEarnings: number;
  breakdownByCourse: Array<{
    courseName: string;
    sessions: number;
    amount: number;
  }>;
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'pending' | 'paid';
  }>;
}

export interface TeacherStatsSummary {
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
  averageSatisfaction: number;
  completionRate: number;
  sessionsByCourse?: Array<{ course: string; value: number }>;
  sessionsByMonth?: Array<{ month: string; value: number }>;
  studentProgress?: Array<{ label: string; value: number }>;
}
