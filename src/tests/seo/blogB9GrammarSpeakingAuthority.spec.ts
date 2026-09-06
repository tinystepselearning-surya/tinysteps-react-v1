import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  getBlogDiscoveryCategory,
  GRAMMAR_PARENT_DIAGNOSTIC_SLUGS,
  SPEAKING_PARENT_DIAGNOSTIC_SLUGS,
} from '../../content/blog/shared/audience';
import { getBlogHeroFamily } from '../../content/blog/shared/heroFamilies';
import { resolveBlogAuthor } from '../../content/blog/shared/editorialTrust';
import { shouldNoindexBlogSlug } from '../../lib/blogIndexingPolicy.js';
import { FOUNDER_PROFILE_PATH } from '../../lib/schemas';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));
const bodyText = (slug: string) => bySlug.get(slug)!.body.map((block) => block.content).join('\n');

const GRAMMAR_OWNER = 'grammar-nouns-to-paragraphs';
const SPEAKING_OWNER = 'speaking-confidence-seeds';

const QUALITY_PROMOTED_GRAMMAR_SUPPORT_SLUGS = [
  'grammar-tenses',
  'grammar-conjunctions',
  'grammar-subject-verb',
  'grammar-creative-writing',
  'grammar-assessment',
] as const;

const NOINDEX_GRAMMAR_SUPPORT_SLUGS = [
  'grammar-editing-camp',
  'grammar-speaking-bridge',
] as const;

const SPEAKING_SUPPORT_SLUGS = [
  'speaking-structure',
  'speaking-visual-aids',
  'speaking-debate-starters',
  'speaking-video-feedback',
  'speaking-competition-prep',
  'speaking-family-showcase',
] as const;

const expectedAuthorProfilePath = (author: ReturnType<typeof resolveBlogAuthor>) =>
  author.key === 'founder' ? FOUNDER_PROFILE_PATH : '/team';

describe('B9 grammar and speaking authority guardrails', () => {
  it('keeps the 76-post inventory and uses existing broad owners instead of creating new pillars', () => {
    expect(blogPosts).toHaveLength(76);
    expect(bySlug.has(GRAMMAR_OWNER)).toBe(true);
    expect(bySlug.has(SPEAKING_OWNER)).toBe(true);

    const authorityMap = readRepoFile('docs/seo/blog-bricks/B09_GRAMMAR_SPEAKING_AUTHORITY_MAP.md');
    expect(authorityMap).toContain('total new blog URLs: **0**');
    expect(authorityMap).toContain('expected live blog inventory after B9: **76**');
  });

  it('routes the four parent diagnostics into the correct topical discovery lanes without rewriting source categories', () => {
    expect(GRAMMAR_PARENT_DIAGNOSTIC_SLUGS).toEqual(
      new Set(['how-to-improve-sentence-formation-in-kids', 'child-knows-grammar-but-makes-mistakes']),
    );
    expect(SPEAKING_PARENT_DIAGNOSTIC_SLUGS).toEqual(
      new Set(['child-understands-english-but-does-not-speak', 'child-gives-one-word-answers']),
    );

    for (const slug of GRAMMAR_PARENT_DIAGNOSTIC_SLUGS) {
      const post = bySlug.get(slug)!;
      expect(post.category).toBe('Parent Tips');
      expect(getBlogDiscoveryCategory(post)).toBe('Grammar');
      expect(post.discoveryCategory).toBe('Grammar');
    }

    for (const slug of SPEAKING_PARENT_DIAGNOSTIC_SLUGS) {
      const post = bySlug.get(slug)!;
      expect(post.category).toBe('Parent Tips');
      expect(getBlogDiscoveryCategory(post)).toBe('Speaking & Communication');
      expect(post.discoveryCategory).toBe('Speaking & Communication');
    }
  });

  it('keeps broad owners and audited skill pages indexable while unaudited support pages remain noindex', () => {
    expect(shouldNoindexBlogSlug(GRAMMAR_OWNER)).toBe(false);
    expect(shouldNoindexBlogSlug(SPEAKING_OWNER)).toBe(false);

    for (const slug of QUALITY_PROMOTED_GRAMMAR_SUPPORT_SLUGS) {
      expect(shouldNoindexBlogSlug(slug), `${slug} completed the quality promotion gate`).toBe(false);
    }

    for (const slug of [...NOINDEX_GRAMMAR_SUPPORT_SLUGS, ...SPEAKING_SUPPORT_SLUGS]) {
      expect(shouldNoindexBlogSlug(slug), `${slug} should remain a support page until audited`).toBe(true);
    }
  });

  it('preserves the distinct B8 grammar and speaking diagnostic checkpoints', () => {
    const sentenceFormation = bodyText('how-to-improve-sentence-formation-in-kids');
    expect(sentenceFormation).toContain('Oral sentence check');
    expect(sentenceFormation).toContain('Core structure check');
    expect(sentenceFormation).toContain('Writing transfer check');

    const grammarTransfer = bodyText('child-knows-grammar-but-makes-mistakes');
    expect(grammarTransfer).toContain('Rule recall');
    expect(grammarTransfer).toContain('Controlled use');
    expect(grammarTransfer).toContain('Spontaneous speaking');
    expect(grammarTransfer).toContain('Written transfer');

    const speakingIndependence = bodyText('child-understands-english-but-does-not-speak');
    expect(speakingIndependence).toContain('Comprehension check');
    expect(speakingIndependence).toContain('Modelled response');
    expect(speakingIndependence).toContain('Prompted response');
    expect(speakingIndependence).toContain('Independent response');

    const answerExpansion = bodyText('child-gives-one-word-answers');
    expect(answerExpansion).toContain('Step 1 — complete sentence');
    expect(answerExpansion).toContain('Step 2 — one useful detail');
    expect(answerExpansion).toContain('Step 3 — connected thinking');
  });

  it('builds contextual authority paths between the broad owners and protected diagnostics', () => {
    const grammarHub = bodyText(GRAMMAR_OWNER);
    expect(grammarHub).toContain('/blog/how-to-improve-sentence-formation-in-kids');
    expect(grammarHub).toContain('/blog/child-knows-grammar-but-makes-mistakes');
    expect(grammarHub).toContain('/blog/grammar-conjunctions');
    expect(grammarHub).toContain('/blog/grammar-speaking-bridge');

    expect(bodyText('how-to-improve-sentence-formation-in-kids')).toContain(`/blog/${GRAMMAR_OWNER}`);
    expect(bodyText('child-knows-grammar-but-makes-mistakes')).toContain(`/blog/${GRAMMAR_OWNER}`);

    const speakingHub = bodyText(SPEAKING_OWNER);
    expect(speakingHub).toContain('/blog/child-understands-english-but-does-not-speak');
    expect(speakingHub).toContain('/blog/child-gives-one-word-answers');
    expect(speakingHub).toContain('/blog/speaking-structure');

    expect(bodyText('child-understands-english-but-does-not-speak')).toContain(`/blog/${SPEAKING_OWNER}`);
    expect(bodyText('child-gives-one-word-answers')).toContain(`/blog/${SPEAKING_OWNER}`);
  });

  it('keeps the legacy speaking redirect and commercial programme boundary intact', () => {
    const firebase = JSON.parse(readRepoFile('firebase.json')) as {
      hosting?: { redirects?: Array<{ source?: string; destination?: string; type?: number }> };
    };
    const redirect = firebase.hosting?.redirects?.find(
      (item) => item.source === '/blog/spoken-english-classes-for-kids-confidence',
    );

    expect(redirect).toEqual({
      source: '/blog/spoken-english-classes-for-kids-confidence',
      destination: '/blog/child-understands-english-but-does-not-speak',
      type: 301,
    });

    const map = readRepoFile('docs/seo/blog-bricks/B09_GRAMMAR_SPEAKING_AUTHORITY_MAP.md');
    expect(map).toContain('Commercial intent');
    expect(map).toContain('`/grammar`, `/speaking`, `/courses`, `/book-demo`');
  });

  it('preserves hero families and B7 author responsibility on the B9 authority owners', () => {
    const grammarSlugs = [
      GRAMMAR_OWNER,
      'how-to-improve-sentence-formation-in-kids',
      'child-knows-grammar-but-makes-mistakes',
    ];
    const speakingSlugs = [
      SPEAKING_OWNER,
      'child-understands-english-but-does-not-speak',
      'child-gives-one-word-answers',
    ];

    for (const slug of grammarSlugs) {
      const post = bySlug.get(slug)!;
      const author = resolveBlogAuthor(post.author, post.category);
      expect(getBlogHeroFamily(post)).toBe('grammar-sentence-building');
      expect(author.profilePath).toBe(expectedAuthorProfilePath(author));
    }

    for (const slug of speakingSlugs) {
      const post = bySlug.get(slug)!;
      const author = resolveBlogAuthor(post.author, post.category);
      expect(getBlogHeroFamily(post)).toBe('speaking-communication');
      expect(author.profilePath).toBe(expectedAuthorProfilePath(author));
    }
  });
});
