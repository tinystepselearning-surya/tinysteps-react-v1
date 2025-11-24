import { ProgressItem } from '../types/models';
import type { Timestamp } from 'firebase/firestore';
export interface KidRecord {
    id: string;
    birthdate?: any;
    [key: string]: any;
}
export declare function useKidProgress(kidId: string): import("@tanstack/react-query").UseQueryResult<ProgressItem[], Error>;
export declare function useSessionsForTeacher(teacherId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useKidAttendance(kidId: string, monthStart: string): import("@tanstack/react-query").UseQueryResult<{
    total: number;
    present: number;
    late: number;
    absent: number;
    percentage: number;
}, Error>;
export declare function useEnrollments(parentId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useEnrollmentsForStudents(studentIds: string[]): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useInvoices(parentId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCourses(filters?: {
    area?: string;
    level?: number;
    status?: string;
    search?: string;
}): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCourse(courseId: string): import("@tanstack/react-query").UseQueryResult<{
    id: any;
    name: string;
    area: "Phonics" | "Grammar" | "Speaking";
    level: number;
    description: string;
    durationMinutes: number;
    sessionFrequency: "weekly" | "biweekly" | "monthly";
    ratePerSession: number;
    topics: string[];
    prerequisites?: string[];
    targetAge: number[];
    targetGrade: string[];
    maxStudentsPerSession: number;
    status: "active" | "inactive" | "draft";
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
} | null, Error>;
export declare function useTopics(courseId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useCourseEnrollments(courseId: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useKid(kidId: string): import("@tanstack/react-query").UseQueryResult<KidRecord | null, Error>;
