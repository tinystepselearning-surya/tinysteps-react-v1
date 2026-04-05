export const STATIC_MARKETING_ROUTES = [
  '/',
  '/blog',
  '/pricing',
  '/sitemap',
  '/contact',
  '/why-tiny-steps',
  '/learning-partner',
  '/team',
  '/class-samples',
  '/careers',
  '/courses',
  '/curriculum',
  '/privacy-policy',
  '/faq',
  '/summer-english-camp-2026',
  '/best-online-phonics-classes-india',
  '/online-phonics-reading-classes',
  '/phonics-apps-for-preschoolers-india',
  '/phonics-games-for-preschoolers',
  '/phonics-learning-games',
  '/summer-camps',
  '/phonics',
  '/phonics-classes-for-kids',
  '/grammar',
  '/english-grammar-writing-classes',
  '/speaking',
  '/public-speaking-communication-kids',
  '/for-schools',
  '/book-demo',
  // Intent-dominant expansion: money pages
  '/reading-classes-for-kids',
  '/spoken-english-classes-for-kids',
  '/writing-classes-for-kids',
  '/phonics-fees-india',
  '/online-english-classes-for-kids-india',
  // Intent-dominant expansion: age pages
  '/english-classes-for-4-year-old',
  '/english-classes-for-5-year-old',
  '/english-classes-for-6-year-old',
  '/english-classes-for-7-10-year-old',
  // Intent-dominant expansion: problem pages
  '/child-not-reading-properly',
  '/slow-reader-child-help',
  '/shy-child-speaking-confidence',
  // Intent-dominant expansion: program pages
  '/reading-fluency-program',
  '/confidence-building-program-kids',
  '/english-foundation-program',
  // Intent-dominant expansion: seasonal pages
  '/summer-camp-for-kids-india',
  '/summer-reading-program-kids',
  '/summer-speaking-camp-kids',
];

export const PARENT_HELP_ROUTES = [
  '/parents',
  '/parents/getting-started',
  '/parents/choosing-course',
  '/parents/scheduling',
  '/parents/payments',
  '/parents/tracking-progress',
  '/parents/helping-with-homework',
  '/parents/phonics-mission',
  '/parents/reading-at-home',
  '/parents/speech-confidence',
  '/parents/common-mistakes',
];

export function uniqueRoutes(routes) {
  return [...new Set(routes)];
}
