#!/usr/bin/env node
// GSC #735 / Phase 1: checks the generated production build, not Google's index.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const ORIGIN = 'https://tinystepslearning.com';
const DIST = path.resolve('dist');
const targets = [
  { path: '/courses', sitemap: 'sitemap-static.xml' },
  { path: '/blog/why-child-knows-letter-sounds-but-cannot-read-words', sitemap: 'sitemap-blog.xml' },
  { path: '/blog/sight-words-or-phonics-first', sitemap: 'sitemap-blog.xml' },
  { path: '/blog/online-phonics-classes-vs-school', sitemap: 'sitemap-blog.xml' },
];

test('GSC #735 P1: all four original crawled-not-indexed URLs occur once in their owned sitemap', async () => {
  for (const target of targets) {
    const xml = await fs.readFile(path.join(DIST, target.sitemap), 'utf8');
    const locations = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(x => x[1].trim());
    assert.equal(locations.filter(url => url === ORIGIN + target.path).length, 1, target.path + ': sitemap loc');
  }
});

test('GSC #735 P1: all four prerendered pages are substantive, indexable and self-canonical', async () => {
  for (const target of targets) {
    const html = await fs.readFile(path.join(DIST, target.path.slice(1), 'index.html'), 'utf8');
    const doc = new JSDOM(html, { url: ORIGIN + target.path }).window.document;
    const canons = [...doc.querySelectorAll('link[rel="canonical"]')];
    assert.equal(canons.length, 1, target.path + ': exactly one canonical');
    assert.equal(canons[0].getAttribute('href'), ORIGIN + target.path, target.path + ': canonical URL');
    for (const tag of doc.querySelectorAll('meta[name="robots"],meta[name="googlebot"],meta[name="bingbot"]')) {
      assert.doesNotMatch(tag.getAttribute('content') || '', /\bnoindex\b/i, target.path + ': index intent');
    }
    assert.ok(doc.querySelector('title')?.textContent?.trim(), target.path + ': title');
    assert.ok(doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(), target.path + ': description');
    assert.ok(doc.querySelector('h1')?.textContent?.trim(), target.path + ': H1');
    const text = (doc.querySelector('main')?.textContent || '').replace(/\s+/g, ' ').trim();
    assert.ok(text.length >= 450, target.path + ': substantive main content (' + text.length + ' chars)');
    assert.doesNotMatch(text, /^(something went wrong|404 - page not found)/i, target.path + ': error content');
    const hrefs = [...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
    assert.ok(hrefs.some(href => href === '/phonics' || href === '/courses' || href?.startsWith('/courses/')), target.path + ': useful programme path');
    console.log(JSON.stringify({ route: target.path, canonical: ORIGIN + target.path, textLength: text.length, sitemap: target.sitemap }));
  }
});
