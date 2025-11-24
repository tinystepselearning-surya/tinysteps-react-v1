export interface Kid {
    id: string;
    name: string;
    birthdate: string;
    parentId: string;
    teacherId?: string;
    sessionId?: string;
    progressSummary?: string;
    createdAt: string;
    updatedAt: string;
}
