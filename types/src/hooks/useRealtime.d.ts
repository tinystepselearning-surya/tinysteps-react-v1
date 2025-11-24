import type { QueryConstraint } from 'firebase/firestore';
export declare function useRealtimeData(collectionName: string, constraints?: QueryConstraint[]): {
    data: any[];
    error: Error | null;
    isLoading: boolean;
};
