import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { blogPosts } from '../../content/blog';

const ROOT = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const bySlug = new Map(blogPosts.map((post) => [post.slug, post]));

const RETIRED_SLUG = 'spoken-english-classes-for-kids-confidence';
const RETIRED_PATH = `/blog/${RETIRED_SLUG}`;
const CANONICAL_OWNER = '/blog/child-understands-english-but-does-not-speak';

describe('Blog #69 communication-classes overlap retirement lock', () => {
  it('keeps the numbered source hidden instead of reviving a competing public article', () => {
    const post = bySlug.get(RETIRED_SLUG);
    expect(post).toBeDefined();
    expect(post?.title).toBe('Communication Classes for Kids: How to Help Shy Children Speak With Confidence');
    expect(post?.hideFromList).toBe(true);

    const source = read('src/content/blog/posts/public-speaking/spoken-english-classes-for-kids-confidence.ts');
    expect(source).toContain("hideFromList: true");
    expect(source).toContain("slug: 'spoken-english-classes-for-kids-confidence'");
  });

  it('preserves the one-hop permanent redirect to the protected speaking diagnostic owner', () => {
    const firebase = JSON.parse(read('firebase.json')) as {
      hosting?: { redirects?: Array<{ source?: string; destination?: string; type?: number }> };
    };
    const redirect = firebase.hosting?.redirects?.find((item) => item.source === RETIRED_PATH);

    expect(redirect).toEqual({
      source: RETIRED_PATH,
      destination: CANONICAL_OWNER,
      type: 301,
    });
    expect(bySlug.has('child-understands-english-but-does-not-speak')).toBe(true);
  });

  it('keeps the retired URL out of sitemap and RSS discovery instead of quality-promoting it', () => {
    const sitemapGenerator = read('scripts/generate-sitemaps.js');
    const rssGenerator = read('scripts/generate-rss.mjs');
    const indexingPolicy = read('src/lib/blogIndexingPolicy.js');

    expect(sitemapGenerator).toContain("'spoken-english-classes-for-kids-confidence'");
    expect(rssGenerator).toContain("EXCLUDED_BLOG_SLUGS = new Set(['spoken-english-classes-for-kids-confidence'])");
    expect(indexingPolicy).not.toContain('spoken-english-classes-for-kids-confidence');
  });

  it('preserves the intent boundary: diagnosis stays with Blog 40 and commercial class selection stays on programme pages', () => {
    const owner = bySlug.get('child-understands-english-but-does-not-speak');
    const ownerBody = owner?.body.map((block) => block.content).join('\n') || '';
    const b9 = read('docs/seo/blog-bricks/B09_GRAMMAR_SPEAKING_AUTHORITY_MAP.md');

    expect(ownerBody).toContain('understanding-versus-independent-speaking diagnosis');
    expect(b9).toContain('Commercial intent');
    expect(b9).toContain('`/grammar`, `/speaking`, `/courses`, `/book-demo`');
  });
});
