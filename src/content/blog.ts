export type BlogPost = {
  slug: string;
  title: string;
  category: 'Phonics'|'Grammar'|'Public Speaking'|'Parent Tips'|'Research';
  author: string;
  date: string; // ISO date
  readTime: string;
  hero?: string; // image url
  excerpt: string;
  body: { type: 'h2'|'h3'|'p'|'li'; content: string }[];
  viewsCount?: number;
  popularScore?: number;
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'satpin-method-phonics',
    title: 'The Complete Parent\'s Guide to Phonics: From SATPIN to Fluency',
    category: 'Phonics',
    author: 'Surya',
    date: '2025-11-01',
    readTime: '5 min',
    hero: '/images/blog/satpin.jpg',
    excerpt: 'Why the SATPIN sequence kickstarts reading and how to use it at home with short, fun sessions.',
    viewsCount: 2547,
    popularScore: 96,
    body: [
      { type: 'h2', content: 'Introduction' },
      { type: 'p', content: 'SATPIN starts with the six sounds that form many CVC words quickly. Start with sounds, not names.' },
      { type: 'h2', content: 'Section 1: Sounds First' },
      { type: 'p', content: 'Teach /s/ /a/ /t/ /p/ /i/ /n/ with motions and short 10–15 minute sessions.' },
      { type: 'h3', content: 'Games over worksheets' },
      { type: 'p', content: 'Use sound hunts, motion mimic, and word building with tiles.' },
      { type: 'h2', content: 'FAQ' },
      { type: 'p', content: 'Q: When to add tricky words? A: After decoding is solid—usually in week 9–12.' },
      { type: 'h2', content: 'Conclusion' },
      { type: 'p', content: 'Keep it fun, keep it short, and celebrate small wins.' }
    ]
  },
  {
    slug: 'why-blending-is-hard',
    title: 'Why Your 7‑Year‑Old Can\'t Blend (And How to Fix It)',
    category: 'Phonics',
    author: 'Surya',
    date: '2025-11-08',
    readTime: '5 min',
    excerpt: 'Blending is a different skill than recognizing sounds. Here\'s how to train it in 4–6 weeks.',
    viewsCount: 1830,
    popularScore: 88,
    body: [
      { type: 'h2', content: 'Introduction' },
      { type: 'p', content: 'Blending requires slow→fast practice. Many skip this step.' }
    ]
  }
];
