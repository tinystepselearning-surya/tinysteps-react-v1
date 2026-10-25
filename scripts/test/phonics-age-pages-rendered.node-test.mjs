#!/usr/bin/env node
// TSSA-SCQ Phonics age family — assert generated HTML, not just JSX/source promises.
// Run after "npm run build:deploy"; this test does not call public servers.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { PHONICS_AGE_PROGRAMME_PAGES } from '../../src/lib/phonicsAgeProgrammeRegistry.js';

const origin = 'https://tinystepslearning.com';
const sitemap = readFileSync('dist/sitemap-static.xml', 'utf8');
const entries = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map((m) => m[1]);
const byAge = new Map(PHONICS_AGE_PROGRAMME_PAGES.map((p) => [p.age, p]));

test('published Phonics ages remain a finite, individually authored group', () => {
  assert.deepEqual([...byAge.keys()], [3, 4, 5, 6]);
  assert.equal(new Set(PHONICS_AGE_PROGRAMME_PAGES.map((p) => p.description)).size, 4);
  assert.equal(new Set(PHONICS_AGE_PROGRAMME_PAGES.map((p) => p.activityExample)).size, 4);
  for (const age of [7, 8, 9]) {
    assert.equal(entries.includes(`${origin}/phonics/age-${age}`), false, 'unapproved age must not be in sitemap');
    assert.equal(existsSync(join('dist', 'phonics', `age-${age}`, 'index.html')), false, 'unapproved age must not have generated HTML');
  }
});

for (const [age, page] of byAge) {
  test(`age ${age} HTML has one self-canonical, useful original text and JSON-LD`, () => {
    const file = join('dist', 'phonics', `age-${age}`, 'index.html');
    assert.ok(existsSync(file), `missing age ${age} prerender: ${file}`);
    const doc = new JSDOM(readFileSync(file, 'utf8'), { url: origin + page.path }).window.document;
    const canonicals = [...doc.querySelectorAll('link[rel="canonical"]')];
    assert.equal(canonicals.length, 1, 'one canonical');
    assert.equal(canonicals[0].getAttribute('href'), origin + page.path, 'self canonical');
    assert.equal([...doc.querySelectorAll('h1')].length, 1, 'one H1');
    assert.equal(doc.querySelector('h1')?.textContent?.trim(), page.heading, 'unique age H1');
    assert.equal(doc.querySelector('title')?.textContent?.trim(), page.title, 'unique age title');
    assert.equal(doc.querySelector('meta[name="description"]')?.getAttribute('content'), page.description);
    const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    assert.doesNotMatch(robots, /\bnoindex\b/i, 'index intended');
    const text = (doc.querySelector('main')?.textContent || '').replace(/\s+/g, ' ').trim();
    assert.ok(text.length > 900, `need genuinely useful main content; got ${text.length}`);
    assert.ok(text.includes(page.directAnswer), 'SSR parent direct answer');
    assert.ok(text.includes(page.activityExample), 'SSR concrete age-specific practice');
    const jsonLd = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent || 'null'));
    assert.ok(jsonLd.length > 0, 'at least one parseable JSON-LD block');
    assert.equal(entries.filter((url) => url === origin + page.path).length, 1, 'one sitemap entry');
  });
}

test('main Phonics programme offers crawlable links to every approved guide', () => {
  const doc = new JSDOM(readFileSync('dist/phonics/index.html', 'utf8'), { url: origin + '/phonics' }).window.document;
  const hrefs = [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  for (const page of PHONICS_AGE_PROGRAMME_PAGES) {
    assert.ok(hrefs.some((href) => href === page.path || href === origin + page.path), `missing age navigation link: ${page.path}`);
  }
});
