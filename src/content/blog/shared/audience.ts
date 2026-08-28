import type { BlogAudience, BlogDiscoveryCategory, BlogPost } from '../types';

/**
 * Research is the one source category that serves two materially different
 * audiences. Keep both sides explicit so adding a new Research article requires
 * an intentional audience review instead of silently defaulting into the parent
 * discovery experience.
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

export const PARENT_RESEARCH_SLUGS = new Set<string>([
  'phonics-for-parents-guide',
  'science-of-phonics-learning',
]);

export function hasReviewedResearchAudience(post: Pick<BlogPost, 'slug' | 'category'>): boolean {
  if (post.category !== 'Research') return true;
  return SCHOOL_RESEARCH_SLUGS.has(post.slug) || PARENT_RESEARCH_SLUGS.has(post.slug);
}

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
      // The reviewed parent-facing Research pieces are phonics authority guides.
      return 'Phonics';
    case 'Phonics':
    default:
      return 'Phonics';
  }
}
