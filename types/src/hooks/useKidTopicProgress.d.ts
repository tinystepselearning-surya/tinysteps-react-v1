export interface KidTopicProgress {
    id: string;
    topicName?: string;
    area?: string;
    subskill?: string;
    mastery?: number | null;
    scoreBand?: string | null;
    lastEvidence?: string | null;
    nextAction?: string | null;
    teacherRemark?: string | null;
    updatedAt?: any;
    [key: string]: any;
}
interface UseKidTopicProgressResult {
    topics: KidTopicProgress[];
    loading: boolean;
    error: string | null;
}
/**
 * Hook: read /students/{kidId}/progress/{topicId} docs.
 *
 * IMPORTANT: this hook is always called, even if kidId is null.
 * When kidId is null, we simply clear topics and skip Firestore.
 */
export declare function useKidTopicProgress(kidId: string | null | undefined): UseKidTopicProgressResult;
export {};
