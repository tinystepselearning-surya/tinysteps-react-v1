import { StudentProgress, TeacherStudent } from '../types/Teacher';
export declare const useProgress: () => {
    students: TeacherStudent[];
    progressData: StudentProgress[];
    loading: boolean;
    error: string | null;
};
