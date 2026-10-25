import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTE_SEO_REGISTRY } from '../../lib/routeSeoRegistry.js';

// Source-level crawlability checks for the feature homepage. These checks are
// necessary safeguards, not evidence of live indexing, crawl success or AI citations.
const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('src/pages/HomePage.tsx');
const hero = read('src/components/Home/ConversionHero.tsx');
const html = read('index.html');
const robots = read('public/robots.txt');
const sitemap = read('public/sitemap-static.xml');
const sitemapIndex = read('public/sitemap.xml');
const llms = read('public/llms.txt');
const llmsGenerator = read('scripts/generate-rss.mjs');
const hosting = JSON.parse(read('firebase.json')) as {
  hosting: { headers?: Array<{ source?: string; headers: Array<{ key: string; value: string }> }> };
};

describe('homepage machine readability and AI-search eligibility', () => {
  it('retains one canonical indexable public home URL with a useful title and description', () => {
    expect(ROUTE_SEO_REGISTRY['/'].canonicalPath).toBe('/');
    expect(ROUTE_SEO_REGISTRY['/'].title).toContain('Online English Classes for Kids');
    expect(ROUTE_SEO_REGISTRY['/'].description).toContain('phonics, reading, grammar');
    expect(html).toContain('<link rel="canonical" href="https://tinystepslearning.com/" />');
    expect(html).toContain('max-snippet:-1');
    expect(html).toContain('index, follow');
    expect(home).toContain('canonical={homeUrl}');
  });

  it('keeps the homepage text and primary programme destinations semantically readable', () => {
    expect(hero).toContain('<h1');
    expect(hero).toContain('Online English Classes');
    expect(hero).toContain('Live, personalised one-to-one online English classes');
    for (const target of [
      '/phonics',
      '/reading-classes-for-kids',
      '/grammar',
      '/spoken-english-classes-for-kids-online',
      '/speaking',
    ]) {
      expect(hero).toContain(`to="${target}"`);
    }
    expect(home).toContain('<ConversionHero />');
    expect(home).toContain('<LearningPathwaysSection />');
    expect(home).not.toContain('requestIdleCallback');
    expect(home).not.toContain('showDeferredSections');
  });

  it('keeps topical facts and organization identity in the homepage schema graph', () => {
    expect(home).toContain('organizationSchema, websiteSchema, homeWebPageSchema');
    expect(home).toContain('jsonLd={homepageSchemas}');
    for (const topic of [
      'Phonics, blending, decoding and spelling',
      'Reading fluency, vocabulary and comprehension',
      'Grammar and sentence building',
      'Spoken English and everyday conversation',
      'Public speaking and communication skills',
    ]) {
      // The sound-letter line contains more detail; check semantically meaningful fragments.
      expect(home.toLowerCase()).toContain(topic.toLowerCase().replace('phonics, ', 'phonics, '));
    }
    expect(home).not.toContain('createFAQPageSchema');
  });

  it('preserves the official programme, class samples, standard pricing and FAQ owner links', () => {
    for (const target of ['/class-samples', '/pricing#standard-pricing', '/faq']) {
      expect(home).toContain(`to="${target}"`);
    }
    expect(home).toContain('ONE_TO_ONE_MONTHLY_PACKAGES.map((plan)');
    expect(home).toContain('<details className="group py-3">');
    expect(home).not.toContain('FAQPageSchema');
  });

  it('keeps the homepage in the canonical sitemap index and static sitemap', () => {
    expect(sitemapIndex).toContain('https://tinystepslearning.com/sitemap-static.xml');
    expect(sitemap).toContain('<loc>https://tinystepslearning.com/</loc>');
    for (const owner of ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking', '/pricing']) {
      expect(sitemap).toContain(`<loc>https://tinystepslearning.com${owner}</loc>`);
    }
  });

  it('allows key public search and answer crawlers without opening private route paths', () => {
    expect(robots).toContain('User-agent: *\nAllow: /');
    expect(robots).toContain('Sitemap: https://tinystepslearning.com/sitemap.xml');
    for (const bot of [
      'Googlebot',
      'Bingbot',
      'OAI-SearchBot',
      'ChatGPT-User',
      'Claude-SearchBot',
      'PerplexityBot',
      'GPTBot',
    ]) {
      const marker = `User-agent: ${bot}`;
      expect(robots, `${bot} has no configured public crawl policy`).toContain(marker);
      const rules = robots.slice(robots.indexOf(marker), robots.indexOf(marker) + 650);
      expect(rules).toContain('Disallow: /admin/');
      expect(rules).toContain('Disallow: /parent/');
    }
  });

  it('does not deploy a noindex header on the public home route', () => {
    const rootHeaders = (hosting.hosting.headers ?? []).find((entry) => entry.source === '/');
    expect(rootHeaders).toBeDefined();
    for (const header of rootHeaders?.headers ?? []) {
      if (header.key.toLowerCase() === 'x-robots-tag') {
        expect(header.value.toLowerCase()).not.toContain('noindex');
      }
    }
  });

  it('keeps the generated LLM directory linked to the homepage and parent FAQ without touching full editorial directory', () => {
    expect(llmsGenerator).toContain("const isFullDirectory = filePath.endsWith('llms-full.txt')");
    expect(llmsGenerator).toContain('if (!isFullDirectory)');
    expect(llmsGenerator).toContain('Tiny Steps Learning homepage');
    expect(llmsGenerator).toContain('Parent FAQs');
    expect(llmsGenerator).toContain('text.replace(coreHeading');
    expect(llmsGenerator).toContain('text.replace(decisionHeading');
  });

  it('preserves existing LLM discovery links to authoritative commercial pages', () => {
    expect(llms).toContain('https://tinystepslearning.com/phonics');
    expect(llms).toContain('https://tinystepslearning.com/pricing');
    expect(llms).toContain('https://tinystepslearning.com/class-samples');
    expect(llms).toContain('https://tinystepslearning.com/book-demo');
  });
});
