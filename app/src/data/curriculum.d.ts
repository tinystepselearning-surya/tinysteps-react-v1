export type CurriculumAreaId = "phonics" | "grammar" | "speaking";
export type CurriculumSkill = {
    id: string;
    title: string;
    description: string;
    notes?: string;
    tags?: string[];
};
export type CurriculumUnit = {
    id: string;
    title: string;
    summary: string;
    skills: CurriculumSkill[];
};
export type CurriculumLevel = {
    id: string;
    title: string;
    summary: string;
    ageRange: string;
    units: CurriculumUnit[];
};
export type CurriculumTrack = {
    id: CurriculumAreaId;
    title: string;
    ageRange: string;
    pathway: string[];
    focus: string;
    deliveryNotes: string[];
    levels: CurriculumLevel[];
};
export declare const CURRICULUM: CurriculumTrack[];
//# sourceMappingURL=curriculum.d.ts.map