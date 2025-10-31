import type { CurriculumAreaId, CurriculumTrack } from "./curriculum";

export type MasteryStatus = "not_started" | "emerging" | "developing" | "proficient" | "mastered";

export type EvidenceType = "worksheet" | "game" | "oral" | "video" | "assignment";

export type ProgressEntry = {
  studentId: string;
  studentName: string;
  programmeId: CurriculumAreaId;
  levelId: string;
  unitId: string;
  skillId: string;
  status: MasteryStatus;
  lastEvidence?: {
    type: EvidenceType;
    reference: string;
    loggedAt: string;
  };
  remarks?: string;
  nextAction?: "practice" | "reteach" | "advance";
  updatedBy: string;
  updatedAt: string;
};

export type AttendanceEntry = {
  studentId: string;
  studentName: string;
  programmeId: CurriculumAreaId;
  sessionDate: string;
  attendance: "present" | "make-up" | "absent";
  rating: 1 | 2 | 3 | 4 | 5;
  daySummary: string;
  loggedBy: string;
  loggedAt: string;
};

export type StudentFeeSnapshot = {
  studentId: string;
  studentName: string;
  programmeId: CurriculumAreaId;
  totalClasses: number;
  classesCompleted: number;
  billingModel: "installment" | "top-up" | "subscription";
  balanceNote: string;
};

export type ProgressDatabase = {
  curriculum: CurriculumTrack[];
  progress: ProgressEntry[];
  attendance: AttendanceEntry[];
  feeSnapshots: StudentFeeSnapshot[];
};

export const SAMPLE_PROGRESS_DB: ProgressDatabase = {
  curriculum: [],
  progress: [
    {
      studentId: "stu-kavya",
      studentName: "Kavya Rao",
      programmeId: "phonics",
      levelId: "phonics-developing",
      unitId: "phonics-digraphs",
      skillId: "phonics-basic-digraphs",
      status: "proficient",
      lastEvidence: {
        type: "oral",
        reference: "audio://digraph-reading-2024-10-25",
        loggedAt: "2024-10-25T12:35:00+05:30",
      },
      remarks: "Reads sh/ch/th confidently. Needs reinforcement with wh in multi-syllable words.",
      nextAction: "practice",
      updatedBy: "teacher-ananya",
      updatedAt: "2024-10-25T12:36:00+05:30",
    },
    {
      studentId: "stu-aarav",
      studentName: "Aarav Sharma",
      programmeId: "grammar",
      levelId: "grammar-fluency",
      unitId: "grammar-advanced-tenses",
      skillId: "grammar-present-perfect",
      status: "developing",
      lastEvidence: {
        type: "worksheet",
        reference: "worksheet://present-perfect-set3",
        loggedAt: "2024-10-23T18:10:00+05:30",
      },
      remarks: "Understands structure but slips on irregular verbs.",
      nextAction: "reteach",
      updatedBy: "teacher-ravi",
      updatedAt: "2024-10-23T18:12:00+05:30",
    },
    {
      studentId: "stu-riya",
      studentName: "Riya Joshi",
      programmeId: "speaking",
      levelId: "speaking-speech-tools",
      unitId: "speaking-delivery-tools",
      skillId: "speaking-pause",
      status: "emerging",
      lastEvidence: {
        type: "video",
        reference: "video://showcase-rehearsal-oct",
        loggedAt: "2024-10-26T09:05:00+05:30",
      },
      remarks: "Still rushing through key points; needs deliberate pause practice.",
      nextAction: "practice",
      updatedBy: "teacher-fatima",
      updatedAt: "2024-10-26T09:07:00+05:30",
    },
  ],
  attendance: [
    {
      studentId: "stu-kavya",
      studentName: "Kavya Rao",
      programmeId: "phonics",
      sessionDate: "2024-10-26",
      attendance: "present",
      rating: 5,
      daySummary: "Mastered sh/ch blends; assigned picture sort pack.",
      loggedBy: "teacher-ananya",
      loggedAt: "2024-10-26T12:50:00+05:30",
    },
    {
      studentId: "stu-aarav",
      studentName: "Aarav Sharma",
      programmeId: "grammar",
      sessionDate: "2024-10-25",
      attendance: "present",
      rating: 4,
      daySummary: "Reviewed dialogue punctuation; needs more practice on commas.",
      loggedBy: "teacher-ravi",
      loggedAt: "2024-10-25T17:45:00+05:30",
    },
    {
      studentId: "stu-riya",
      studentName: "Riya Joshi",
      programmeId: "speaking",
      sessionDate: "2024-10-25",
      attendance: "present",
      rating: 5,
      daySummary: "Excellent projection; focus on pacing before showcase.",
      loggedBy: "teacher-fatima",
      loggedAt: "2024-10-25T10:05:00+05:30",
    },
  ],
  feeSnapshots: [
    {
      studentId: "stu-kavya",
      studentName: "Kavya Rao",
      programmeId: "phonics",
      totalClasses: 12,
      classesCompleted: 9,
      billingModel: "installment",
      balanceNote: "₹1,050 due (3 classes remain this cycle).",
    },
    {
      studentId: "stu-aarav",
      studentName: "Aarav Sharma",
      programmeId: "grammar",
      totalClasses: 12,
      classesCompleted: 6,
      billingModel: "top-up",
      balanceNote: "₹2,100 credit available (6 classes prepaid).",
    },
    {
      studentId: "stu-riya",
      studentName: "Riya Joshi",
      programmeId: "speaking",
      totalClasses: 12,
      classesCompleted: 8,
      billingModel: "subscription",
      balanceNote: "₹1,400 credit covers the next 4 classes (auto top-up 28 Oct).",
    },
  ],
};

export function attachCurriculumToProgress(db: ProgressDatabase, curriculum: CurriculumTrack[]): ProgressDatabase {
  return { ...db, curriculum };
}

export function getStudentProgress(db: ProgressDatabase, studentId: string): ProgressEntry[] {
  return db.progress.filter((entry) => entry.studentId === studentId);
}

export function getStudentAttendance(db: ProgressDatabase, studentId: string): AttendanceEntry[] {
  return db.attendance.filter((entry) => entry.studentId === studentId);
}

export function getProgrammeProgress(db: ProgressDatabase, programmeId: CurriculumAreaId): ProgressEntry[] {
  return db.progress.filter((entry) => entry.programmeId === programmeId);
}
