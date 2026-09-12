export const SEO_RECOVERY_BRICK9_REVISION = '2026-09-12-brick9';
export const SEO_RECOVERY_BRICK9_STATUS = 'existing-page-quality-locked';

export const SEO_RECOVERY_BRICK9_QUALITY_STANDARD = Object.freeze([
  'searchIntent',
  'title',
  'meta',
  'h1',
  'introduction',
  'h2Coverage',
  'examples',
  'expertise',
  'faqs',
  'internalLinks',
  'cta',
  'schema',
  'duplication',
  'freshness',
] as const);

export type SeoRecoveryBrick9Decision = 'protect' | 'targeted-upgrade';

export type SeoRecoveryBrick9PriorityPage = {
  path: string;
  sourcePath: string;
  role: string;
  userJob: string;
  decision: SeoRecoveryBrick9Decision;
  primaryCta: string | null;
  supportingHandoffs: readonly string[];
};

export const SEO_RECOVERY_BRICK9_PRIORITY_PAGES = Object.freeze([
  {
    path: '/phonics',
    sourcePath: 'src/pages/phonics.tsx',
    role: 'generic phonics programme authority',
    userJob: 'Understand Tiny Steps live 1:1 phonics, programme fit, progression and the next step.',
    decision: 'protect',
    primaryCta: '/book-demo',
    supportingHandoffs: [
      '/best-online-phonics-classes-for-kids-in-india',
      '/phonics-fees-india',
    ],
  },
  {
    path: '/best-online-phonics-classes-for-kids-in-india',
    sourcePath: 'src/pages/public/BestOnlinePhonicsClassesIndiaPage.tsx',
    role: 'phonics comparison and provider-selection authority',
    userJob: 'Compare phonics options using child fit, teaching quality, transfer evidence and practical clarity.',
    decision: 'protect',
    primaryCta: '/book-demo',
    supportingHandoffs: ['/phonics', '/phonics-fees-india', '/curriculum?tab=phonics'],
  },
  {
    path: '/phonics-fees-india',
    sourcePath: 'src/pages/public/PhonicsFeesIndiaPage.tsx',
    role: 'phonics fee and cost authority',
    userJob: 'Understand live 1:1 and group phonics pricing in India and compare like-for-like value.',
    decision: 'protect',
    primaryCta: '/book-demo',
    supportingHandoffs: ['/phonics', '/pricing'],
  },
  {
    path: '/pricing',
    sourcePath: 'src/pages/PricingPage.tsx',
    role: 'cross-programme pricing authority',
    userJob: 'Compare Tiny Steps class formats and current programme pricing before enrolment.',
    decision: 'protect',
    primaryCta: '/book-demo',
    supportingHandoffs: ['/phonics', '/grammar', '/speaking'],
  },
  {
    path: '/book-demo',
    sourcePath: 'src/pages/public/BookDemoPage.tsx',
    role: 'assessment and trial authority',
    userJob: 'Book one free 35-minute live 1:1 assessment and understand what happens before enrolment.',
    decision: 'protect',
    primaryCta: null,
    supportingHandoffs: ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking'],
  },
  {
    path: '/blog/satpin-phonics-guide',
    sourcePath: 'src/content/blog/posts/phonics/satpin-phonics-guide.ts',
    role: 'SATPIN explanation and progression authority',
    userJob: 'Understand SATPIN sounds, order, words, blending, early reading and what comes next.',
    decision: 'targeted-upgrade',
    primaryCta: '/phonics',
    supportingHandoffs: ['/blog/phonics-satpin-launch', '/book-demo'],
  },
  {
    path: '/blog/phonics-satpin-launch',
    sourcePath: 'src/content/blog/posts/phonics/week-1-phonics-satpin-launch.ts',
    role: 'SATPIN at-home routine support',
    userJob: 'Follow a flexible home routine for early SATPIN sound recall, blending, reading and spelling.',
    decision: 'protect',
    primaryCta: '/blog/satpin-phonics-guide',
    supportingHandoffs: ['/phonics', '/book-demo'],
  },
  {
    path: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
    sourcePath: 'src/content/blog/posts/parent-tips/why-child-knows-letter-sounds-but-cannot-read-words.ts',
    role: 'parent decoding diagnostic authority',
    userJob: 'Identify where reading breaks after letter-sound knowledge and choose the next teaching target.',
    decision: 'protect',
    primaryCta: '/phonics',
    supportingHandoffs: ['/book-demo', '/blog/how-kids-learn-blending'],
  },
  {
    path: '/free-letter-tracing-game-for-kids',
    sourcePath: 'src/pages/public/FreeLetterTracingGamePage.tsx',
    role: 'generic alphabet and letter-tracing authority',
    userJob: 'Practise pre-writing strokes and A–Z letter formation, then move into sound and blending work.',
    decision: 'protect',
    primaryCta: '/letter-tracing-with-sounds-game',
    supportingHandoffs: ['/blog/satpin-phonics-guide', '/free-word-building-game-for-kids', '/phonics'],
  },
  {
    path: '/letter-tracing-with-sounds-game',
    sourcePath: 'src/pages/public/LetterTracingWithSoundsGamePage.tsx',
    role: 'sound-supported tracing practice',
    userJob: 'Connect letter formation with sound recall without confusing tracing with word decoding.',
    decision: 'targeted-upgrade',
    primaryCta: '/blog/satpin-phonics-guide',
    supportingHandoffs: [
      '/free-word-building-game-for-kids',
      '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
      '/phonics',
    ],
  },
] satisfies readonly SeoRecoveryBrick9PriorityPage[]);

export function getSeoRecoveryBrick9PriorityPage(path: string): SeoRecoveryBrick9PriorityPage | undefined {
  return SEO_RECOVERY_BRICK9_PRIORITY_PAGES.find((page) => page.path === path);
}
