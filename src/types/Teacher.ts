import { Timestamp } from 'firebase/firestore';

export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'reschedule_requested';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'reschedule_requested';

export interface TeacherSession {
  id: string;

  enrollmentId?: string;

  teacherId: string;
  teacherIds?: string[];
  assignedTeacherId?: string;
  primaryTeacherId?: string;
  teacherUid?: string;
  teacher_id?: string;

  parentId?: string;
  parentIds?: string[];

  courseId: string;
  courseName?: string;

  studentName?: string;
  kidName?: string;
  childName?: string;

  studentNames?: string[] | Record<string, string>;
  kidNames?: string[] | Record<string, string>;
  childNames?: string[] | Record<string, string>;

  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM

  durationMins?: number;
  durationMinutes?: number;

  kidIds: string[];
  kidId?: string;
  studentId?: string;
  childId?: string;
  studentIds?: string[];
  childIds?: string[];
  childrenIds?: string[];

  status: SessionStatus;

  joinUrl?: string;
  meetingLink?: string;
  lessonPlanUrl?: string; // Canva or other lesson plan embed URL

  notes?: string;
  feeAmount?: number;
  currency?: string;
  source?: string;

  attendance?: Record<string, AttendanceStatus | { status: AttendanceStatus; [key: string]: any }>;

  startAt?: Timestamp;
  endAt?: Timestamp;
  scheduledStartAt?: Timestamp;
  scheduledEndAt?: Timestamp;
  updatedAt?: Timestamp;
  updatedBy?: string;

  makeupCreditId?: string;
  makeupForSessionId?: string;

  replacementSessionId?: string;
  rescheduledFromSessionId?: string;
}

export interface TeacherStudent {
  id: string;
  enrollmentId?: string;
  fullName: string;
  grade?: string;
  courseNames?: string[];
  enrollmentStatus?: 'active' | 'pending_payment' | string;
  parentName?: string;
  parentEmail?: string;
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

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  subject?: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
  participants: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: Message;
  unreadCount: number;
}

export interface TeacherStatsSummary {
  totalSessions: number;
  totalStudents: number;
  averageAttendance: number;
  averageSatisfaction: number;
  completionRate: number;
  sessionsByCourse: Array<{
    courseName: string;
    sessions: number;
    attendance: number;
  }>;
  sessionsByMonth: Array<{
    month: string;
    sessions: number;
    attendance: number;
  }>;
  studentProgress: Array<{
    studentId: string;
    studentName: string;
    progress: number;
    attendance: number;
  }>;
}
