const route = (path, group, {
  indexable = true,
  prerender = true,
  sitemap = indexable,
  canonicalPath = path,
} = {}) => ({
  path,
  group,
  intent: indexable ? 'index' : 'noindex',
  indexable,
  prerender,
  sitemap,
  canonicalPath,
  robots: indexable
    ? 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    : 'noindex, follow',
  seoRegistry: true,
});

export const PUBLIC_ROUTE_MANIFEST = [
  route('/', 'static'),
  route('/blog', 'static'),
  route('/blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading', 'static'),
  route('/pricing', 'static'),
  route('/sitemap', 'static', { indexable: false, sitemap: false }),
  route('/contact', 'static'),
  route('/why-tiny-steps', 'static'),
  route('/learning-partner', 'static'),
  route('/team', 'static'),
  route('/class-samples', 'static'),
  route('/testimonials', 'static'),
  route('/careers', 'static'),
  route('/courses', 'static'),
  route('/curriculum', 'static'),
  route('/faq', 'static'),
  route('/best-online-phonics-classes-for-kids-in-india', 'static'),
  route('/phonics-apps-for-preschoolers-india', 'static'),
  route('/phonics-games-for-preschoolers', 'static'),
  route('/phonics-learning-games', 'static'),
  route('/free-english-games-for-kids', 'static'),
  route('/free-phonics-games-for-kids', 'static'),
  route('/free-letter-sound-games-for-kids', 'static'),
  route('/free-word-building-games-for-kids', 'static'),
  route('/free-sentence-building-games-for-kids', 'static'),
  route('/free-reading-games-for-kids', 'static'),
  route('/free-grammar-games-for-kids', 'static'),
  route('/free-speaking-games-for-kids', 'static'),
  route('/free-letter-sounds-game-for-kids', 'static'),
  route('/free-sound-listening-game-for-kids', 'static'),
  route('/free-word-building-game-for-kids', 'static'),
  route('/free-spelling-game-for-kids', 'static'),
  route('/free-sentence-making-game-for-kids', 'static'),
  route('/free-reading-fluency-game-for-kids', 'static'),
  route('/free-grammar-practice-game-for-kids', 'static'),
  route('/free-speaking-practice-game-for-kids', 'static'),
  route('/free-letter-tracing-game-for-kids', 'static'),
  route('/letter-tracing-with-sounds-game', 'static'),
  route('/free-balloon-pop-phonics-game-for-kids', 'static'),
  route('/free-games/word-meaning-flashcards', 'static'),
  route('/phonics', 'static'),
  route('/grammar', 'static'),
  route('/speaking', 'static'),
  route('/for-schools', 'static'),
  route('/book-demo', 'static'),
  route('/reading-classes-for-kids', 'static'),
  route('/writing-classes-for-kids', 'static'),
  route('/phonics-fees-india', 'static'),
  route('/english-grammar-writing-classes', 'static'),
  route('/spoken-english-classes-for-kids-online', 'static'),
  route('/online-english-classes-for-kids', 'static'),
  route('/online-english-classes-hyderabad', 'static'),
  route('/english-classes-for-4-year-old', 'static'),
  route('/english-classes-for-5-year-old', 'static'),
  route('/english-classes-for-6-year-old', 'static'),
  route('/english-classes-for-7-10-year-old', 'static'),
  route('/child-not-reading-properly', 'static'),
  route('/slow-reader-child-help', 'static'),
  route('/shy-child-speaking-confidence', 'static'),
  route('/reading-fluency-program', 'static'),
  route('/confidence-building-program-kids', 'static'),
  route('/english-foundation-program', 'static'),
  route('/public-speaking-communication-kids', 'static'),

  route('/summer-camps', 'seasonal'),
  route('/summer-camp-for-kids-india', 'seasonal'),
  route('/summer-reading-program-kids', 'seasonal'),
  route('/summer-speaking-camp-kids', 'seasonal'),
  route('/summer-camps/phonics-fast-track', 'seasonal'),
  route('/summer-camps/grammar-fast-track', 'seasonal'),
  route('/summer-camps/speaking-fast-track', 'seasonal'),
  route('/seasonal/christmas-tree', 'seasonal', { indexable: false, sitemap: false }),

  route('/parents', 'parents'),
  route('/parents/getting-started', 'parents'),
  route('/parents/choosing-course', 'parents'),
  route('/parents/scheduling', 'parents'),
  route('/parents/payments', 'parents'),
  route('/parents/tracking-progress', 'parents'),
  route('/parents/helping-with-homework', 'parents'),
  route('/parents/phonics-mission', 'parents'),
  route('/parents/reading-at-home', 'parents'),
  route('/parents/speech-confidence', 'parents'),
  route('/parents/common-mistakes', 'parents'),

  route('/privacy-policy', 'legal', { indexable: false, sitemap: false }),
  route('/terms-and-conditions', 'legal', { indexable: false, sitemap: false }),
  route('/refund-guarantee', 'legal', { indexable: false, sitemap: false }),
];

export const PUBLIC_REDIRECT_MANIFEST = [
  {
    source: '/terms',
    destination: '/terms-and-conditions',
    status: 301,
  },
  {
    source: '/terms/',
    destination: '/terms-and-conditions',
    status: 301,
  },
  {
    source: '/online-english-classes-for-kids-india',
    destination: '/online-english-classes-for-kids',
    status: 301,
  },
  {
    source: '/online-phonics-reading-classes',
    destination: '/phonics',
    status: 301,
  },
  {
    source: '/how-it-works',
    destination: '/curriculum',
    status: 301,
  },
  {
    source: '/spoken-english-classes-for-kids',
    destination: '/spoken-english-classes-for-kids-online',
    status: 301,
  },
  {
    source: '/games',
    destination: '/phonics-learning-games',
    status: 301,
  },
  {
    source: '/games/english-excellence',
    destination: '/phonics-learning-games',
    status: 301,
  },
];

export const APPLICATION_ROUTE_INTENT_MANIFEST = [
  { path: '/login', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/surya/login', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/teacher/login', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/parent/login', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/learning-partner/login', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/unauthorized', intent: 'noindex', robots: 'noindex, nofollow, noarchive' },
  { path: '/surya/**', intent: 'private-spa', robots: 'noindex, nofollow, noarchive' },
  { path: '/teacher/**', intent: 'private-spa', robots: 'noindex, nofollow, noarchive' },
  { path: '/parent/**', intent: 'private-spa', robots: 'noindex, nofollow, noarchive' },
  { path: '/kids/**', intent: 'private-spa', robots: 'noindex, nofollow, noarchive' },
  { path: '/messages/**', intent: 'private-spa', robots: 'noindex, nofollow, noarchive' },
  {
    path: '/learning-partner/dashboard/**',
    intent: 'private-spa',
    robots: 'noindex, nofollow, noarchive',
  },
  { path: '/rss.xml', intent: 'noindex', robots: 'noindex' },
  { path: '/feed.xml', intent: 'noindex', robots: 'noindex' },
  { path: '/sitemap*.xml', intent: 'noindex', robots: 'noindex' },
  { path: '/**', intent: 'genuine-404', robots: 'noindex, nofollow' },
];

export const DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST = [
  {
    path: '/blog/**',
    intent: 'index',
    canonicalPath: 'self',
    sitemap: true,
    prerender: true,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    seoRegistry: 'resolved',
  },
  {
    path: '/courses/**',
    intent: 'index',
    canonicalPath: 'self',
    sitemap: true,
    prerender: true,
    robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
    seoRegistry: 'resolved',
  },
];

export const ROUTE_INTENT_MANIFEST = [
  ...PUBLIC_ROUTE_MANIFEST,
  ...DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST,
  ...PUBLIC_REDIRECT_MANIFEST.map((entry) => ({
    ...entry,
    path: entry.source,
    intent: 'redirect',
    permanent: entry.status === 301 || entry.status === 308,
    sitemap: false,
    prerender: false,
  })),
  ...APPLICATION_ROUTE_INTENT_MANIFEST,
];

const DYNAMIC_PUBLIC_PREFIXES = DYNAMIC_PUBLIC_ROUTE_INTENT_MANIFEST.map(
  (entry) => entry.path.replace(/\*\*$/, ''),
);
const PUBLIC_ANALYTICS_EXCLUSIONS = new Set(['/parents/payments']);
const PUBLIC_ANALYTICS_ALIASES = new Set([
  '/games/english-excellence',
  '/online-phonics-reading-classes',
]);

export function isPublicAnalyticsPath(pathname) {
  const normalized = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (PUBLIC_ANALYTICS_EXCLUSIONS.has(normalized)) return false;
  if (PUBLIC_ANALYTICS_ALIASES.has(normalized)) return true;
  const entry = PUBLIC_ROUTE_MANIFEST.find((candidate) => candidate.path === normalized);
  if (entry) return true;
  return DYNAMIC_PUBLIC_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
