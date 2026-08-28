import type { BlogDiscoveryCategory, BlogPost } from '../types';
import { getBlogAudience, getBlogDiscoveryCategory } from './audience';
import { SITE_ORIGIN } from '../../../lib/schemas';

export const BLOG_ID = `${SITE_ORIGIN}/blog#blog`;
export const BLOG_COLLECTION_ID = `${SITE_ORIGIN}/blog#collection`;
export const BLOG_FAQ_ID = `${SITE_ORIGIN}/blog#faqpage`;

export type BlogAuthorityRole =
  | 'pillar'
  | 'diagnostic-owner'
  | 'skill-guide'
  | 'activity-guide'
  | 'school-authority';

export type BlogAuthorityCluster =
  | 'Phonics'
  | 'Grammar'
  | 'Speaking & Communication'
  | 'Schools & Research';

type BlogAuthorityEntry = {
  cluster: BlogAuthorityCluster;
  role: BlogAuthorityRole;
  topics: readonly string[];
};

/**
 * Machine-readable authority owners established by B2/B6/B9.
 * This is an entity/topic graph only. It does not change canonicals, redirects,
 * source categories, indexability, or the distinct intent owned by each URL.
 */
export const BLOG_TECHNICAL_AUTHORITY = Object.freeze({
  'satpin-phonics-guide': {
    cluster: 'Phonics',
    role: 'pillar',
    topics: ['SATPIN phonics', 'letter-sound correspondence', 'early decoding', 'phonics progression'],
  },
  'phonics-for-parents-guide': {
    cluster: 'Phonics',
    role: 'pillar',
    topics: ['phonics for parents', 'systematic phonics', 'decoding', 'home phonics support'],
  },
  'child-knows-abc-but-cannot-read': {
    cluster: 'Phonics',
    role: 'diagnostic-owner',
    topics: ['alphabet knowledge versus reading', 'decoding difficulty', 'early reading diagnosis'],
  },
  'why-child-knows-letter-sounds-but-cannot-read-words': {
    cluster: 'Phonics',
    role: 'diagnostic-owner',
    topics: ['letter sounds without word reading', 'blending difficulty', 'decoding transfer'],
  },
  'how-kids-learn-blending': {
    cluster: 'Phonics',
    role: 'skill-guide',
    topics: ['phonics blending', 'sound blending progression', 'word reading'],
  },
  'phonics-blending-activities': {
    cluster: 'Phonics',
    role: 'activity-guide',
    topics: ['phonics blending activities', 'home blending practice', 'guided word reading'],
  },
  'how-to-improve-reading-fluency-in-children': {
    cluster: 'Phonics',
    role: 'pillar',
    topics: ['reading fluency', 'accurate reading', 'expressive reading', 'reading practice'],
  },
  'week-7-grammar-nouns-to-paragraphs': {
    cluster: 'Grammar',
    role: 'pillar',
    topics: ['grammar for children', 'sentence building', 'paragraph building', 'grammar progression'],
  },
  'how-to-improve-sentence-formation-in-kids': {
    cluster: 'Grammar',
    role: 'diagnostic-owner',
    topics: ['sentence formation', 'sentence expansion', 'oral to written language transfer'],
  },
  'child-knows-grammar-but-makes-mistakes': {
    cluster: 'Grammar',
    role: 'diagnostic-owner',
    topics: ['grammar rule transfer', 'grammar mistakes', 'spontaneous grammar use', 'self-correction'],
  },
  'week-12-speaking-confidence-seeds': {
    cluster: 'Speaking & Communication',
    role: 'pillar',
    topics: ['speaking confidence', 'oral communication', 'connected speaking', 'public speaking foundations'],
  },
  'child-understands-english-but-does-not-speak': {
    cluster: 'Speaking & Communication',
    role: 'diagnostic-owner',
    topics: ['understands English but does not speak', 'speaking hesitation', 'independent spoken response'],
  },
  'child-gives-one-word-answers': {
    cluster: 'Speaking & Communication',
    role: 'diagnostic-owner',
    topics: ['one-word answers', 'spoken sentence expansion', 'connected thinking', 'oral language development'],
  },
  'phonics-teacher-training-for-schools-implementation': {
    cluster: 'Schools & Research',
    role: 'school-authority',
    topics: ['phonics teacher training', 'school phonics implementation', 'teacher practice'],
  },
  'how-schools-can-assess-decoding-not-memorisation': {
    cluster: 'Schools & Research',
    role: 'school-authority',
    topics: ['decoding assessment', 'reading assessment', 'memorisation versus decoding'],
  },
  'systematic-cumulative-phonics-explained-for-schools': {
    cluster: 'Schools & Research',
    role: 'school-authority',
    topics: ['systematic phonics', 'cumulative phonics', 'school literacy implementation'],
  },
} satisfies Record<string, BlogAuthorityEntry>);

const DEFAULT_TOPICS: Record<BlogDiscoveryCategory, readonly string[]> = {
  Phonics: ['phonics', 'reading', 'decoding'],
  Grammar: ['grammar', 'sentence formation', 'writing'],
  'Speaking & Communication': ['speaking', 'communication', 'public speaking'],
  'Parent Guides': ['parent English learning support', 'home learning routines'],
  'Schools & Research': ['school literacy', 'systematic phonics', 'teacher implementation'],
};

type BlogAuthorityInput = Pick<BlogPost, 'slug' | 'category'> &
  Partial<Pick<BlogPost, 'audience' | 'discoveryCategory'>>;

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function getBlogArticleId(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}#article`;
}

export function getBlogWebPageId(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}#webpage`;
}

export function getBlogTechnicalAuthority(post: BlogAuthorityInput) {
  const explicit = BLOG_TECHNICAL_AUTHORITY[post.slug as keyof typeof BLOG_TECHNICAL_AUTHORITY];
  const discoveryCategory = post.discoveryCategory || getBlogDiscoveryCategory(post);
  const audience = post.audience || getBlogAudience(post);
  const topics = unique([...(explicit?.topics || []), ...DEFAULT_TOPICS[discoveryCategory]]);

  return {
    cluster: explicit?.cluster || discoveryCategory,
    role: explicit?.role || 'skill-guide',
    topics,
    discoveryCategory,
    audience,
    audienceType:
      audience === 'Schools & Research'
        ? 'School leaders, English heads, teachers, and education decision-makers'
        : 'Parents and caregivers of children learning English',
  } as const;
}

export function buildBlogAboutSchema(post: BlogAuthorityInput) {
  return getBlogTechnicalAuthority(post).topics.map((name) => ({
    '@type': 'Thing',
    name,
  }));
}

export function buildBlogKeywords(post: BlogAuthorityInput): string {
  const authority = getBlogTechnicalAuthority(post);
  return unique([
    ...authority.topics,
    authority.discoveryCategory,
    'Tiny Steps Learning',
  ]).join(', ');
}

export function extractExternalCitationUrls(
  post: Pick<BlogPost, 'body' | 'faq'>,
): string[] {
  const visibleText = [
    ...(post.body || []).map((block) => block.content || ''),
    ...(post.faq || []).flatMap((item) => [item.question || '', item.answer || '']),
  ].join('\n');

  const urls = visibleText.match(/https?:\/\/[^\s)\]}>,]+/g) || [];
  const cleaned = urls.map((url) => url.replace(/[.,;:!?]+$/, ''));

  return unique(cleaned).filter((url) => !url.startsWith(SITE_ORIGIN));
}
