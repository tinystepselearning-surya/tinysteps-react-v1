export type WeekOverride = {
    title: string;
    focus?: string;
    learns?: string[];
    activities?: string[];
    homework?: string[];
    mastery?: string;
};
export type CurriculumOverride = {
    courses: Record<string, {
        weeks?: WeekOverride[];
    }>;
};
export declare function loadCurriculumOverrides(): Promise<CurriculumOverride | null>;
export declare function getCourseWeeksOverride(slug: string): Promise<WeekOverride[] | null>;
