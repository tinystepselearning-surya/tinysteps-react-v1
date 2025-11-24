interface FilteredStudent {
    uid: string;
    fullName: string;
    grade?: string;
    progressStatus?: 'on_track' | 'needs_attention';
    lastSessionDate?: string;
}
export declare function useTeacherFilteredStudents(): {
    students: FilteredStudent[];
    loading: boolean;
    error: string | null;
};
export {};
