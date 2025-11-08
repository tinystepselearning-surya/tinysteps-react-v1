// TinySteps Firestore models
export type User = {
  uid: string;
  role: "parent" | "teacher" | "rm" | "admin";
  displayName?: string;
  email?: string;
  settings?: {
    weeklyDigest?: boolean;
  };
};

export type Student = {
  sid: string;
  name: string;
  parentIds: string[];
  assignedTeacherId: string;
  assignedRmId: string;
  summary?: {
    phonicsMastery?: number;
    grammarMastery?: number;
    speakingMastery?: number;
    lastUpdated?: any;
    streakDays?: number;
    weeklyMinutes?: number;
  };
};

export type CurriculumTopic = {
  topicId: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  teacherNote?: string;
  updatedAt: any;
};

export type Session = {
  sessionId: string;
  studentId: string;
  teacherId: string;
  rmId?: string;
  courseId: string;
  startAt: any;
  endAt?: any;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  recordingUrl?: string;
};

export type Payment = {
  paymentId: string;
  parentId: string;
  studentId: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  createdAt: any;
  description?: string;
  planId?: string;
};

export type TeacherNote = {
  noteId: string;
  parentId: string;
  studentId: string;
  teacherId: string;
  sessionId?: string;
  message: string;
  createdAt: any;
};

export type Ticket = {
  ticketId: string;
  parentId: string;
  studentId?: string;
  type: "support" | "reschedule" | string;
  message: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: any;
};
