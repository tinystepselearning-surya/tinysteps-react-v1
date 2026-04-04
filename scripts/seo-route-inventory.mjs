export const STATIC_MARKETING_ROUTES = [
  '/',
  '/blog',
  '/pricing',
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
