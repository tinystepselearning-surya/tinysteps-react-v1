export type CourseTrack = 'phonics' | 'grammar' | 'speaking';
export type CourseCatalogItem = {
    slug: string;
    icon: string;
    name: string;
    track: CourseTrack;
    age: string;
    duration: string;
    frequency: string;
    level: string;
    overview: string[];
    outcomes: string[];
    price: string;
    ibLens: string[];
    reviews?: string;
};
export declare const catalogs: CourseCatalogItem[];
export declare const curriculumBySlug: Record<string, {
    weeks?: {
        title: string;
        learns?: string[];
        focus?: string;
        activities?: string[];
        homework?: string[];
        mastery?: string;
    }[];
}>;
