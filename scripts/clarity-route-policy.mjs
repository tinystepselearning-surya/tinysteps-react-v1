export const CLARITY_BLOCKED_PREFIXES = [
  '/admin',
  '/surya',
  '/teacher',
  '/parent',
  '/student',
  '/kids',
  '/kid',
  '/login',
  '/signup',
  '/auth',
  '/account',
  '/profile',
  '/payment',
  '/payments',
  '/checkout',
  '/messages',
  '/learning-partner/dashboard',
  '/learningpartner/dashboard',
  '/unauthorized',
  '/dev',
];

export const CLARITY_ALLOWED_EXACT_PATHS = [
  '/',
  '/pricing',
  '/sitemap',
  '/contact',
  '/why-tiny-steps',
  '/learning-partner',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-guarantee',
  '/team',
  '/class-samples',
  '/testimonials',
  '/careers',
  '/curriculum',
  '/faq',
  '/for-schools',
  '/book-demo',
  '/grammar',
  '/speaking',
  '/games/english-excellence',
];

export const CLARITY_ALLOWED_PREFIXES = [
  '/blog',
  '/courses',
  '/free-',
  '/free-games',
  '/summer-',
  '/phonics',
  '/online-',
  '/best-online-',
  '/english-',
  '/public-speaking-',
  '/reading-',
  '/writing-',
  '/spoken-',
  '/child-',
  '/slow-',
  '/shy-',
  '/confidence-',
  '/letter-',
  '/seasonal/',
];

export function isClarityAllowedPath(pathname) {
  const normalizedPath = String(pathname || '/').toLowerCase();
  if (CLARITY_BLOCKED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) return false;
  return CLARITY_ALLOWED_EXACT_PATHS.includes(normalizedPath)
    || CLARITY_ALLOWED_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix));
}
