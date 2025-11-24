interface FilteredTeacher {
    uid: string;
    displayName: string;
    email: string;
    specialization?: string;
    yearsExperience?: number;
}
interface FilteredParent {
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
    childCount?: number;
}
export declare function useLPFilteredTeachers(): {
    teachers: FilteredTeacher[];
    loading: boolean;
    error: string | null;
};
export declare function useLPFilteredParents(): {
    parents: FilteredParent[];
    loading: boolean;
    error: string | null;
};
export {};
