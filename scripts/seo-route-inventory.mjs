export const STATIC_MARKETING_ROUTES = [
  '/',
  '/blog',
  '/pricing',
  '/contact',
  '/why-tiny-steps',
  '/learning-partner',
  '/team',
  '/careers',
  '/courses',
  '/curriculum',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-guarantee',
  '/faq',
  '/summer-english-camp-2026',
  '/online-phonics-reading-classes',
  '/english-grammar-writing-classes',
  '/public-speaking-communication-kids',
  '/best-online-phonics-classes-india',
  '/phonics-apps-for-preschoolers-india',
  '/phonics-games-for-preschoolers',
  '/phonics-learning-games',
  '/summer-camps',
  '/phonics-classes-for-kids',
  '/phonics',
  '/grammar',
  '/speaking',
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
