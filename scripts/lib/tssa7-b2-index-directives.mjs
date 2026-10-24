// TSSA-7/B2 source-only guard for index-exclusion directives.
// This does not replace Google/Bing URL Inspection or robots.txt policy checks.
const TOKEN = /(?:^|[,;\s:])(?:noindex|none)(?=$|[,;\s])/i;
const excluded = value => TOKEN.test(String(value ?? ''));
const hasExcluded = values => (Array.isArray(values) ? values : []).some(excluded);

/**
 * Any user-agent-specific indexing ban is a technical flag even when a
 * generic `robots` meta tag allows indexing. Values such as `none` mean
 * noindex + nofollow. X-Robots-Tag can be agent-scoped or generic, so flag
 * an exclusion without assuming which bot it targets when scopes vary.
 */
export function b2IndexExclusionFlags({
  xRobots = '',
  robotsValues = [],
  googlebotValues = [],
  bingbotValues = [],
} = {}) {
  const flags = [];
  if (excluded(xRobots)) flags.push('x-robots-index-exclusion');
  if (hasExcluded(robotsValues)) flags.push('served-noindex');
  if (hasExcluded(googlebotValues)) flags.push('googlebot-index-exclusion');
  if (hasExcluded(bingbotValues)) flags.push('bingbot-index-exclusion');
  return flags;
}
