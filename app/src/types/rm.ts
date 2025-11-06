import type { Timestamp } from "firebase/firestore";

export interface RM {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  specialization?: string[]; // e.g., ["Early Learners", "Advanced Grammar"]
  region?: string; // Geographic region or territory
  status: "active" | "inactive" | "on-leave";
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
}

export interface RMStats {
  rmId: string;
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  pendingAssignments: number; // Students without assigned teachers
  overduePayments: number;
  monthlyRevenue: number;
  updatedAt: Timestamp;
}

export interface StudentAssignment {
  studentId: string;
  teacherId: string;
  assignedBy: string;
  assignedAt: Timestamp;
  notes?: string;
}

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  activeStudents: number;
  maxStudents: number;
  scheduledSessions: number;
  completedSessions: number;
  completionRate: number; // percentage
  averageRating?: number;
}

export interface Alert {
  id: string;
  rmId: string;
  type: "payment" | "assignment" | "performance" | "attendance" | "general";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  entityId?: string; // Student ID, Teacher ID, etc.
  entityType?: "student" | "teacher" | "session";
  isRead: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
