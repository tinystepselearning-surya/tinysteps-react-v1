export type InternalLinkRule = {
  id: string;
  href: string;
  phrases: string[];
  priority: number;
  cluster: 'phonics' | 'grammar' | 'speaking' | 'courses' | 'trust' | 'parents' | 'admissions';
  pageAllowlist?: string[];
  pageDenylist?: string[];
};

export const internalLinkMap: InternalLinkRule[] = [
  // High-priority, specific phrases
  {
    id: 'jolly-phonics-explainer',
    href: '/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading',
    phrases: ['Jolly Phonics'],
    priority: 100,
    cluster: 'phonics',
  },
  {
    id: 'child-not-reading',
    href: '/child-not-reading-properly',
    phrases: ['child not reading properly', 'reading difficulty', 'struggles to read'],
    priority: 90,
    cluster: 'parents',
  },
  // Core authority pages
  {
    id: 'phonics-page',
    href: '/phonics',
    phrases: ['online phonics classes', 'structured phonics program', 'synthetic phonics method'],
    priority: 80,
    cluster: 'phonics',
  },
  {
    id: 'grammar-page',
    href: '/grammar',
    phrases: ['grammar classes for kids', 'online grammar course', 'english grammar program'],
    priority: 80,
    cluster: 'grammar',
  },
  {
    id: 'speaking-page',
    href: '/speaking',
    phrases: ['public speaking classes', 'speaking skills for kids', 'communication skills program'],
    priority: 80,
    cluster: 'speaking',
  },

  // Key informational pages
  {
    id: 'courses-page',
    href: '/courses',
    phrases: ['all courses', 'all programs', 'course catalog'],
    priority: 70,
    cluster: 'courses',
  },
  {
    id: 'pricing-page',
    href: '/pricing',
    phrases: ['course fees', 'class fees', 'view pricing'],
    priority: 70,
    cluster: 'admissions',
  },
  {
    id: 'curriculum-page',
    href: '/curriculum',
    phrases: ['full curriculum', 'learning path', 'curriculum details'],
    priority: 70,
    cluster: 'courses',
  },
  {
    id: 'class-samples-page',
    href: '/class-samples',
    phrases: ['class samples', 'see a class in action', 'sample classes'],
    priority: 75,
    cluster: 'trust',
  },
  {
    id: 'why-tiny-steps-page',
    href: '/why-tiny-steps',
    phrases: ['why tiny steps', 'our teaching philosophy', 'our teaching method'],
    priority: 60,
    cluster: 'trust',
  },

  // Specific course pages (from courses.ts)
  {
    id: 'course-phonics-foundation',
    href: '/courses/phonics-foundation',
    phrases: ['Phonics Foundations course'],
    priority: 85,
    cluster: 'courses',
  },
  {
    id: 'course-early-phonics',
    href: '/courses/phonics-brush-up', // slug is phonics-brush-up
    phrases: ['Early Phonics course'],
    priority: 85,
    cluster: 'courses',
  },
  {
    id: 'course-advanced-phonics',
    href: '/courses/phonics-advanced',
    phrases: ['Advanced Phonics course'],
    priority: 85,
    cluster: 'courses',
  },
  {
    id: 'course-basic-grammar',
    href: '/courses/grammar',
    phrases: ['Beginner Grammar course'],
    priority: 85,
    cluster: 'courses',
  },
  {
    id: 'course-advanced-grammar',
    href: '/courses/grammar-mastery',
    phrases: ['Advanced Grammar course', 'Grammar mastery course'],
    priority: 85,
    cluster: 'courses',
  },
  {
    id: 'course-public-speaking-foundations',
    href: '/courses/public-speaking-foundations',
    phrases: ['Public Speaking Foundations course', 'Basic Public Speaking course'],
    priority: 85,
    cluster: 'courses',
  },
];
