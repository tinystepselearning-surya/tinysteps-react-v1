import type { Timestamp } from "firebase/firestore";

export interface Student {
  id: string;
  userId: string;
  displayName: string;
  dateOfBirth?: Timestamp;
  grade?: string;
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  assignedRmId?: string;
  assignedRmName?: string;
  enrollmentDate: Timestamp;
  status: "active" | "inactive" | "on-hold";
  summary?: StudentSummary;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface StudentSummary {
  phonicsMastery: number; // 0-100%
  grammarMastery: number;
  speakingMastery: number;
  weeklyMinutes: number; // Last 7 days
  streakDays: number;
  totalSessionsCompleted: number;
  worksheetsCompleted: number;
  gamesCompleted: number;
  lastActivityAt?: Timestamp;
  lastSessionAt?: Timestamp;
  updatedAt: Timestamp;
}

export interface Session {
  id: string;
  studentId: string;
  teacherId: string;
  scheduledAt: Timestamp;
  duration: number; // minutes
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  zoomLink?: string;
  completedAt?: Timestamp;
  notes?: string;
  topicsCovered?: string[];
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD format
  sessionId?: string;
  status: "present" | "absent" | "excused";
  minutesAttended?: number;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface ProgressRecord {
  id: string;
  studentId: string;
  topicId: string;
  topicName: string;
  category: "phonics" | "grammar" | "speaking";
  masteryLevel: "not-started" | "learning" | "practicing" | "mastered";
  score?: number; // 0-100
  attempts: number;
  lastPracticedAt?: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}
