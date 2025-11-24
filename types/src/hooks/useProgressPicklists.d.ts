export type TopicArea = 'phonics' | 'grammar' | 'speaking' | string;
export interface TopicDefinition {
    id: string;
    label: string;
    area: TopicArea;
    subskills?: string[];
}
export interface ProgressPicklists {
    topics: TopicDefinition[];
    mastery: string[];
    scoreBands: string[];
    lastEvidence: string[];
    nextActions: string[];
}
interface UseProgressPicklistsResult {
    config: ProgressPicklists | null;
    loading: boolean;
    error: string | null;
}
/**
 * Reads shared picklists from:
 *   /config/picklists
 */
export declare function useProgressPicklists(): UseProgressPicklistsResult;
export {};
