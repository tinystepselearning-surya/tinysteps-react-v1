export type MdxMeta = {
    slug: string;
    title: string;
    category?: string;
    author?: string;
    date?: string;
    readTime?: string;
    hero?: string;
    excerpt?: string;
};
export declare function fetchMdxPosts(): Promise<MdxMeta[]>;
