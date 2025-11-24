export interface KidSummary {
    phonicsMastery: number;
    grammarMastery: number;
    speakingMastery: number;
    attendanceRate30d: number;
    creditsRemaining: number;
}
export type KidStatus = 'active' | 'suspended' | 'archived';
export interface Kid {
    id?: string;
    fullName: string;
    dob: string;
    grade: string;
    parentIds: string[];
    primaryParentId?: string;
    status: KidStatus;
    summary: KidSummary;
    createdAt?: any;
    updatedAt?: any;
}
export type NewKidInput = Omit<Kid, 'id' | 'createdAt' | 'updatedAt'>;
export interface KidQueryFilters {
    parentId?: string;
}
