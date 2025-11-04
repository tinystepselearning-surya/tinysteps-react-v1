import type { CurriculumAreaId, CurriculumTrack } from "./curriculum";
export type MasteryStatus = "not_started" | "emerging" | "developing" | "proficient" | "mastered";
export type EvidenceType = "worksheet" | "game" | "oral" | "video" | "assignment";
export type ProgressEntry = {
    studentId: string;
    studentName: string;
    admissionNumber: string;
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
    admissionNumber: string;
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
    admissionNumber: string;
    programmeId: CurriculumAreaId;
    totalClasses: number;
    classesCompleted: number;
    billingModel: "installment" | "top-up" | "subscription";
    balanceNote: string;
};
export type StudentProfile = {
    studentId: string;
    studentName: string;
    admissionNumber: string;
    programmeId: CurriculumAreaId;
};
export type ProgressDatabase = {
    curriculum: CurriculumTrack[];
    progress: ProgressEntry[];
    attendance: AttendanceEntry[];
    feeSnapshots: StudentFeeSnapshot[];
    students: StudentProfile[];
};
export declare const SAMPLE_PROGRESS_DB: ProgressDatabase;
export declare function attachCurriculumToProgress(db: ProgressDatabase, curriculum: CurriculumTrack[]): ProgressDatabase;
export declare function getStudentProgress(db: ProgressDatabase, studentId: string): ProgressEntry[];
export declare function getStudentAttendance(db: ProgressDatabase, studentId: string): AttendanceEntry[];
export declare function getProgrammeProgress(db: ProgressDatabase, programmeId: CurriculumAreaId): ProgressEntry[];
//# sourceMappingURL=progress-db.d.ts.map