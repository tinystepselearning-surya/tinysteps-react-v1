import { TeacherSession } from '../../../types/Teacher';
interface UseTeacherSessionsResult {
    sessions: TeacherSession[];
    isLoading: boolean;
    error: Error | null;
}
export declare const useTeacherSessions: (teacherId?: string, date?: string) => UseTeacherSessionsResult;
export {};
