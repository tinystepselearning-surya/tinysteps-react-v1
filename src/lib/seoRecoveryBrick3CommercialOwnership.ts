export const SEO_RECOVERY_BRICK3_REVISION = '2026-09-12-r1';

export const SEO_RECOVERY_BRICK3_COMMERCIAL_OWNERS = Object.freeze({
  genericPhonicsProgramme: '/phonics',
  phonicsComparison: '/best-online-phonics-classes-for-kids-in-india',
  phonicsFees: '/phonics-fees-india',
  crossProgrammePricing: '/pricing',
  assessmentConversion: '/book-demo',
});

export const SEO_RECOVERY_BRICK3_LEGACY_ALIASES = Object.freeze({
  '/phonics-classes-for-kids': '/phonics',
  '/online-phonics-reading-classes': '/phonics',
  '/best-online-phonics-classes-india': '/best-online-phonics-classes-for-kids-in-india',
});

/**
 * Brick 3 locks the commercial ownership split. The remaining editorial overlap
 * is intentionally handed to Brick 4, which owns merge/retirement mechanics.
 */
export const SEO_RECOVERY_BRICK3_PENDING_BRICK4_RETIREMENT = Object.freeze({
  source: '/blog/how-to-choose-phonics-classes',
  destination: '/best-online-phonics-classes-for-kids-in-india',
  historicalSources: Object.freeze([
    '/blog/best-online-phonics-classes-for-kids',
    '/blog/best-phonics-classes-for-kids',
  ]),
  requiredFinalRedirectShape: 'direct-301-to-comparison-owner',
});

export const SEO_RECOVERY_BRICK3_GUARDRAILS = Object.freeze([
  'generic phonics class intent belongs to /phonics',
  'best, compare, review and provider-selection intent belongs to the comparison owner',
  'phonics fee, price and cost research belongs to /phonics-fees-india',
  'cross-programme pricing belongs to /pricing',
  'free demo and assessment intent belongs to /book-demo',
  'no new commercial phonics URL may be created during recovery',
]);
