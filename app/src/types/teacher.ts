import type { Timestamp } from "firebase/firestore";

export interface Teacher {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  specialization?: string[];
  hourlyRate?: number;
  maxStudentsPerWeek?: number;
  status: "active" | "inactive" | "on-leave";
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface TeacherEarnings {
  id: string;
  teacherId: string;
  month: string; // YYYY-MM format
  totalSessions: number;
  completedSessions: number;
  totalMinutes: number;
  totalEarnings: number;
  sessionBreakdown: {
    sessionId: string;
    studentName: string;
    date: string;
    duration: number;
    earnings: number;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionFormData {
  studentId: string;
  scheduledAt: Date;
  duration: number;
  zoomLink?: string;
  notes?: string;
  topicsCovered?: string[];
}

export interface CompleteSessionData {
  completedAt: Date;
  outcomes: string;
  topicsCovered: string[];
  studentPerformance?: "excellent" | "good" | "needs-improvement";
  homeworkAssigned?: string;
  notes?: string;
}
