export const SEO_RECOVERY_BRICK8_AUTHORITY_PATHS = Object.freeze({
  phonicsProgramme: '/phonics',
  phonicsComparison: '/best-online-phonics-classes-for-kids-in-india',
  phonicsFees: '/phonics-fees-india',
  phonicsAssessment: '/book-demo',
  satpinMaster: '/blog/satpin-phonics-guide',
  satpinHomePractice: '/blog/phonics-satpin-launch',
  parentDecodingDiagnostic: '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  tracingOwner: '/free-letter-tracing-game-for-kids',
  tracingWithSounds: '/letter-tracing-with-sounds-game',
  wordBuildingPractice: '/free-word-building-game-for-kids',
} as const);

export const SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS = Object.freeze({
  '/blog/child-knows-letter-sounds-but-cannot-read':
    SEO_RECOVERY_BRICK8_AUTHORITY_PATHS.parentDecodingDiagnostic,
  '/blog/how-to-choose-phonics-classes':
    SEO_RECOVERY_BRICK8_AUTHORITY_PATHS.phonicsComparison,
  '/blog/best-online-phonics-classes-for-kids':
    SEO_RECOVERY_BRICK8_AUTHORITY_PATHS.phonicsComparison,
  '/blog/best-phonics-classes-for-kids':
    SEO_RECOVERY_BRICK8_AUTHORITY_PATHS.phonicsComparison,
} as const);

type RetiredInternalPath = keyof typeof SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS;

const RETIRED_PATHS_LONGEST_FIRST = Object.keys(SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS)
  .sort((left, right) => right.length - left.length) as RetiredInternalPath[];

/**
 * Normalize a Tiny Steps internal href so rendered links point directly to the
 * current authority URL instead of spending internal equity on a redirect hop.
 * Query strings and fragments are preserved because replacement is path-only.
 */
export function normalizeSeoRecoveryInternalHref(href: string): string {
  let normalized = String(href || '');

  for (const retiredPath of RETIRED_PATHS_LONGEST_FIRST) {
    const canonicalPath = SEO_RECOVERY_BRICK8_RETIRED_INTERNAL_PATHS[retiredPath];
    if (normalized.includes(retiredPath)) {
      normalized = normalized.split(retiredPath).join(canonicalPath);
    }
  }

  return normalized;
}

export function isSeoRecoveryRetiredInternalHref(href: string): boolean {
  const value = String(href || '');
  return RETIRED_PATHS_LONGEST_FIRST.some((retiredPath) => value.includes(retiredPath));
}
