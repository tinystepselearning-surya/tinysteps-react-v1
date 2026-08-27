import type { BlogPost } from '../types';

export type BlogAudience = 'Parent' | 'Schools & Research';
export type BlogDiscoveryCategory =
  | 'Phonics'
  | 'Grammar'
  | 'Speaking & Communication'
  | 'Parent Guides'
  | 'Schools & Research';

/**
 * Explicit audience ownership for institutional/research content.
 *
 * Keep this list explicit rather than inferring from category alone: the Research
 * category also contains parent-facing authority pieces such as the phonics parent
 * guide and science-of-phonics explainer.
 */
export const SCHOOL_RESEARCH_SLUGS = new Set<string>([
  'cbse-phonics-curriculum-vs-systematic-phonics-programme',
  'does-cbse-include-phonics-ncf-foundational-literacy',
  'how-schools-can-assess-decoding-not-memorisation',
  'international-phonics-benchmarks-for-indian-schools',
  'phonics-scope-and-sequence-for-cbse-schools',
  'phonics-teacher-training-for-schools-implementation',
  'systematic-cumulative-phonics-explained-for-schools',
  'why-letter-sounds-are-not-enough-to-read',
]);

export function getBlogAudience(post: Pick<BlogPost, 'slug' | 'category'>): BlogAudience {
  return SCHOOL_RESEARCH_SLUGS.has(post.slug) ? 'Schools & Research' : 'Parent';
}

export function getBlogDiscoveryCategory(
  post: Pick<BlogPost, 'slug' | 'category'>,
): BlogDiscoveryCategory {
  if (getBlogAudience(post) === 'Schools & Research') return 'Schools & Research';

  switch (post.category) {
    case 'Grammar':
      return 'Grammar';
    case 'Public Speaking':
    case 'English Communication':
      return 'Speaking & Communication';
    case 'Parent Tips':
      return 'Parent Guides';
    case 'Research':
      // Parent-facing Research content is discovered by the problem it solves,
      // not through an institution-oriented Research shelf.
      return 'Phonics';
    case 'Phonics':
    default:
      return 'Phonics';
  }
}
