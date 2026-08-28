import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';
import {
  BLOG_COLLECTION_ID,
  BLOG_FAQ_ID,
  BLOG_ID,
  BLOG_TECHNICAL_AUTHORITY,
  buildBlogKeywords,
  extractExternalCitationUrls,
  getBlogArticleId,
  getBlogTechnicalAuthority,
  getBlogWebPageId,
} from '../../content/blog/shared/technicalAuthority';
import { shouldNoindexBlogSlug } from '../../lib/blogIndexingPolicy.js';
import { SITE_ORIGIN } from '../../lib/schemas';

const repoRoot = process.cwd();
const readRepoFile = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const retiredDuplicates = [
  'spoken-english-classes-for-kids-confidence',
  'why-child-answers-only-in-one-word',
] as const;

describe('B10 technical SEO, GEO, and LLM authority guardrails', () => {
  it('keeps the 76-post corpus and registers only live, indexable authority owners', () => {
    expect(blogPosts).toHaveLength(76);
    for (const slug of Object.keys(BLOG_TECHNICAL_AUTHORITY)) {
      expect(bySlug.has(slug), `${slug} must remain a live blog record`).toBe(true);
      expect(shouldNoindexBlogSlug(slug), `${slug} must remain indexable authority`).toBe(false);
    }
    for (const slug of retiredDuplicates) expect(BLOG_TECHNICAL_AUTHORITY).not.toHaveProperty(slug);
  });

  it('keeps B6 and B9 authority distinctions machine-readable without collapsing intents', () => {
    expect(BLOG_TECHNICAL_AUTHORITY['child-knows-abc-but-cannot-read'].topics)
      .toContain('alphabet knowledge versus reading');
    expect(BLOG_TECHNICAL_AUTHORITY['why-child-knows-letter-sounds-but-cannot-read-words'].topics)
      .toContain('letter sounds without word reading');

    const sentenceFormation = getBlogTechnicalAuthority(bySlug.get('how-to-improve-sentence-formation-in-kids')!);
    const grammarTransfer = getBlogTechnicalAuthority(bySlug.get('child-knows-grammar-but-makes-mistakes')!);
    expect(sentenceFormation.cluster).toBe('Grammar');
    expect(grammarTransfer.cluster).toBe('Grammar');
    expect(sentenceFormation.topics).toContain('sentence formation');
    expect(grammarTransfer.topics).toContain('grammar rule transfer');

    const hesitation = getBlogTechnicalAuthority(bySlug.get('child-understands-english-but-does-not-speak')!);
    const oneWord = getBlogTechnicalAuthority(bySlug.get('child-gives-one-word-answers')!);
    expect(hesitation.topics).toContain('speaking hesitation');
    expect(oneWord.topics).toContain('one-word answers');
  });

  it('uses stable Blog, Collection, Article, WebPage, and FAQ identities', () => {
    expect(BLOG_ID).toBe(`${SITE_ORIGIN}/blog#blog`);
    expect(BLOG_COLLECTION_ID).toBe(`${SITE_ORIGIN}/blog#collection`);
    expect(BLOG_FAQ_ID).toBe(`${SITE_ORIGIN}/blog#faqpage`);
    expect(getBlogArticleId('satpin-phonics-guide')).toBe(`${SITE_ORIGIN}/blog/satpin-phonics-guide#article`);
    expect(getBlogWebPageId('satpin-phonics-guide')).toBe(`${SITE_ORIGIN}/blog/satpin-phonics-guide#webpage`);
  });

  it('derives keywords and citations only from declared topics and visible external URLs', () => {
    const grammar = bySlug.get('week-7-grammar-nouns-to-paragraphs')!;
    expect(buildBlogKeywords(grammar)).toContain('grammar for children');
    expect(buildBlogKeywords(grammar)).toContain('Grammar');

    const citations = extractExternalCitationUrls({
      body: [{ type: 'p', content: 'Evidence: https://example.org/report. Internal: https://tinystepslearning.com/grammar' }],
      faq: [],
    });
    expect(citations).toEqual(['https://example.org/report']);
  });

  it('connects individual BlogPosting schema to the technical authority graph', () => {
    const source = readRepoFile('src/pages/BlogPostPage.tsx');
    expect(source).toContain("'@id': getBlogArticleId(articleSlug)");
    expect(source).toContain("isPartOf: { '@id': BLOG_ID }");
    expect(source).toContain("mainEntityOfPage: { '@id': getBlogWebPageId(articleSlug) }");
    expect(source).toContain('about: buildBlogAboutSchema(authorityPost)');
    expect(source).toContain('keywords: buildBlogKeywords(authorityPost)');
    expect(source).toContain("'@type': 'Audience'");
    expect(source).toContain('citation: externalCitations.length ? externalCitations : undefined');
    expect(source).toContain('isAccessibleForFree: true');
  });

  it('aligns Blog/Collection machine-readable listings to the established indexability policy', () => {
    const source = readRepoFile('src/pages/blog/BlogIndexPage.tsx');
    expect(source).toContain('const indexablePublishedPosts = useMemo(');
    expect(source).toContain('!shouldNoindexBlogSlug(post.slug)');
    expect(source).toContain("'@id': BLOG_ID");
    expect(source).toContain("'@id': BLOG_COLLECTION_ID");
    expect(source).toContain("'@id': getBlogArticleId(post.slug)");
    expect(source).toContain("mainEntityOfPage: { '@id': getBlogWebPageId(post.slug) }");
  });

  it('publishes the authority map for LLM discovery while preserving crawler privacy and RSS discovery', () => {
    const llms = readRepoFile('public/llms.txt');
    expect(llms).toContain('## Canonical Editorial Authority Map');
    for (const slug of [
      'week-7-grammar-nouns-to-paragraphs',
      'how-to-improve-sentence-formation-in-kids',
      'child-knows-grammar-but-makes-mistakes',
      'week-12-speaking-confidence-seeds',
      'child-understands-english-but-does-not-speak',
      'child-gives-one-word-answers',
    ]) expect(llms).toContain(`/blog/${slug}`);
    expect(llms).toContain('Do not collapse these distinct parent questions');

    const robots = readRepoFile('public/robots.txt');
    for (const bot of ['OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot', 'ClaudeBot']) {
      expect(robots).toContain(`User-agent: ${bot}`);
    }
    expect(robots).toContain('Disallow: /admin/');
    expect(robots).toContain('Disallow: /teacher/');
    expect(robots).toContain('Disallow: /parent/');

    const html = readRepoFile('index.html');
    expect(html).toContain('type="application/rss+xml"');
    expect(html).toContain('https://tinystepslearning.com/rss.xml');
    expect(html).toContain('https://tinystepslearning.com/blog/rss.xml');
  });
});
