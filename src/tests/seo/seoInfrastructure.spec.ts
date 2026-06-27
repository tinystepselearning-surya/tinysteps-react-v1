import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '../../..');
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'firebase.json'), 'utf8'));

function readXml(name: string) {
  return fs.readFileSync(path.join(repoRoot, 'public', name), 'utf8');
}

describe('SEO infrastructure', () => {
  it('keeps legacy /main routes out of sitemap files and includes priority canonicals', () => {
    const sitemapXml = [
      readXml('sitemap-static.xml'),
      readXml('sitemap-blog.xml'),
      readXml('sitemap-courses.xml'),
      readXml('sitemap-parents.xml'),
    ].join('\n');

    expect(sitemapXml).toContain('https://tinystepslearning.com/courses/phonics-foundation');
    expect(sitemapXml).toContain('https://tinystepslearning.com/parents/choosing-course');
    expect(sitemapXml).toContain('https://tinystepslearning.com/blog/what-is-phonics-for-kids');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/main/');
    expect(sitemapXml).not.toContain('https://tinystepslearning.com/blog/week-8-grammar-tenses');
  });

  it('keeps 301 redirects for /main legacy routes and does not redirect live long-tail landing pages', () => {
    const redirects = firebaseConfig.hosting.redirects as Array<{ source?: string; destination?: string; type?: number }>;

    expect(
      redirects.some((entry) => entry.source === '/main/parents/choosing-course' && entry.destination === '/parents/choosing-course' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/phonics' && entry.destination === '/courses/phonics-foundation' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/grammar' && entry.destination === '/courses/grammar-mastery' && entry.type === 301)
    ).toBe(true);
    expect(
      redirects.some((entry) => entry.source === '/main/courses/public-speaking' && entry.destination === '/courses/public-speaking-foundations' && entry.type === 301)
    ).toBe(true);

    expect(
      redirects.some((entry) => entry.source === '/online-phonics-reading-classes')
    ).toBe(false);
    expect(
      redirects.some((entry) => entry.source === '/english-grammar-writing-classes')
    ).toBe(false);
    expect(
      redirects.some((entry) => entry.source === '/public-speaking-communication-kids')
    ).toBe(false);
  });

  it('keeps long-tail landing pages self-canonical', async () => {
    const { ROUTE_SEO_REGISTRY } = await import('../../lib/routeSeoRegistry.js');
    const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

    expect(ROUTE_SEO_REGISTRY['/online-phonics-reading-classes']?.canonicalPath).toBe('/online-phonics-reading-classes');
    expect(ROUTE_SEO_REGISTRY['/english-grammar-writing-classes']?.canonicalPath).toBe('/english-grammar-writing-classes');
    expect(ROUTE_SEO_REGISTRY['/public-speaking-communication-kids']?.canonicalPath).toBe('/public-speaking-communication-kids');
    expect(ROUTE_SEO_REGISTRY['/spoken-english-classes-for-kids']?.canonicalPath).toBe('/spoken-english-classes-for-kids');

    expect(indexHtml).not.toContain("'/online-phonics-reading-classes': '/phonics'");
    expect(indexHtml).not.toContain("'/english-grammar-writing-classes': '/grammar'");
    expect(indexHtml).not.toContain("'/public-speaking-communication-kids': '/speaking'");
    expect(indexHtml).not.toContain("'/spoken-english-classes-for-kids': '/speaking'");
  });
});
