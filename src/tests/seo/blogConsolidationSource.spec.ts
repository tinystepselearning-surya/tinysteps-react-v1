import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error Build/SEO tooling is intentionally authored as executable ESM JavaScript.
import { RETIRED_BLOG_PATH_REDIRECTS } from '../../../scripts/blog-consolidation-map.mjs';

const ROOT = process.cwd();
const BLOG_POSTS = path.join(ROOT, 'src/content/blog/posts/phonics');

function read(file: string) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

describe('B3 blog consolidation source state', () => {
  it('retires the branded reading-confidence duplicate only after merging its useful method signals', () => {
    const retiredFile = path.join(BLOG_POSTS, 'how-tiny-steps-builds-reading-confidence.ts');
    const owner = read('src/content/blog/posts/phonics/how-phonics-builds-reading-confidence.ts');

    expect(fs.existsSync(retiredFile)).toBe(false);
    expect(RETIRED_BLOG_PATH_REDIRECTS['/blog/how-tiny-steps-builds-reading-confidence'])
      .toBe('/blog/how-phonics-builds-reading-confidence');

    for (const signal of [
      'mirror the teacher’s correction language at home',
      'weekly teacher or parent progress notes',
      'explicit stage placement',
      'parent-visible method Tiny Steps aims to use',
      'temporary level adjustment and focused revision cycle',
    ]) {
      expect(owner).toContain(signal);
    }
  });

  it('keeps the speaking overlap as a permanent Hosting redirect instead of a page-level noindex rule', () => {
    const firebase = JSON.parse(read('firebase.json'));
    const policy = read('src/lib/blogIndexingPolicy.js');
    const redirect = firebase.hosting.redirects.find(
      (candidate: { source?: string }) => candidate.source === '/blog/spoken-english-classes-for-kids-confidence',
    );

    expect(redirect).toMatchObject({
      destination: '/blog/child-understands-english-but-does-not-speak',
      type: 301,
    });
    expect(policy).not.toContain('spoken-english-classes-for-kids-confidence');
  });

  it('keeps the reading-confidence redirect in the server fallback map', () => {
    const notFoundRoute = read('functions/src/notFoundRoute.ts');
    expect(notFoundRoute).toContain(
      '"/blog/how-tiny-steps-builds-reading-confidence": "/blog/how-phonics-builds-reading-confidence"',
    );
  });
});
