import { TeacherSession } from '../../../types/Teacher';
interface UseUpcomingSessionsResult {
    sessions: TeacherSession[];
    isLoading: boolean;
    error: Error | null;
}
export declare const useUpcomingSessions: (teacherId?: string) => UseUpcomingSessionsResult;
export {};
