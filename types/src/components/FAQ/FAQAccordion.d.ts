export type FAQItem = {
    id: string;
    question: string;
    answer: string;
    category: 'phonics' | 'grammar' | 'speaking' | 'online' | 'general';
    relatedBlog?: string;
    relatedCourse?: string;
};
export default function FAQAccordion({ items }: {
    items: FAQItem[];
}): import("react/jsx-runtime").JSX.Element;
