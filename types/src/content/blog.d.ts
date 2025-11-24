export type BlogPost = {
    slug: string;
    title: string;
    category: 'Phonics' | 'Grammar' | 'Public Speaking' | 'Parent Tips' | 'Research';
    author: string;
    date: string;
    readTime: string;
    hero?: string;
    excerpt: string;
    body: {
        type: 'h2' | 'h3' | 'p' | 'li';
        content: string;
    }[];
    viewsCount?: number;
    popularScore?: number;
};
export declare const blogPosts: BlogPost[];
