export interface FilteredChild {
    id?: string;
    uid?: string;
    fullName?: string;
    displayName?: string;
    name?: string;
    age?: number | string | null;
    grade?: string | null;
    enrollmentCount?: number;
    averageMastery?: number;
}
interface UseParentFilteredChildrenResult {
    children: FilteredChild[];
    loading: boolean;
    error: string | null;
}
/**
 * TS-friendly wrapper around the legacy JS hook.
 * Keeps all the old Firestore logic but returns a clean
 * { children, loading, error } object.
 */
export declare function useParentFilteredChildren(): UseParentFilteredChildrenResult;
export {};
