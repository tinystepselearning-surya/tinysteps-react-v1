import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { blogPosts } from '../../content/blog';

const blogSource = readFileSync('src/pages/BlogPostPage.tsx','utf8');

const protectedPages = [
  {
    slug:'child-gives-one-word-answers',
    heading:'First check whether your child struggles to start speaking or to expand an answer',
    related:['/blog/child-understands-english-but-does-not-speak','/blog/how-to-improve-sentence-formation-in-kids'],
  },
  {
    slug:'child-understands-english-but-does-not-speak',
    heading:'First distinguish speaking initiation from short replies and sentence difficulties',
    related:['/blog/child-gives-one-word-answers','/blog/speaking-confidence-seeds'],
  },
  {
    slug:'phonics-for-parents-guide',
    heading:'What this phonics guide covers and which guide to read next',
    related:['/blog/what-is-phonics-for-kids','/blog/why-child-knows-letter-sounds-but-cannot-read-words','/blog/are-phonics-apps-enough-for-kids'],
  },
] as const;

describe('AI Answer E3: parent-facing editorial integrity', () => {
  for (const config of protectedPages) {
    it(`${config.slug} has a clear parent topic, not internal article numbers`, () => {
      const post=blogPosts.find(p=>p.slug===config.slug);
      expect(post).toBeDefined();
      const blocks=post?.body||[];
      const contents=blocks.map(b=>String(b.content||''));
      expect(contents.some(x=>x===config.heading)).toBe(true);
      const combined=contents.join('\\n');
      expect(combined).not.toMatch(/\bBlog\s+#?\d+\b/i);
      for (const path of config.related) expect(combined).toContain(']('+path+')');
      expect(contents.some(x=>/^Quick answer/i.test(x))).toBe(true);
    });
  }

  it('keeps curated speaking table of contents aligned with editorial heading', () => {
    expect(blogSource).toContain(
      "'First check whether your child struggles to start speaking or to expand an answer'",
    );
    expect(blogSource).not.toContain("'First separate Blog 37 from the nearby speaking problems'");
  });
});
