#!/usr/bin/env node
// TSSA-SCQ Phase 0: inspect the *generated* index-intended HTML, never claim actual indexing.
// Keeps canonical ownership and natural parent-readable content intact for 13 established URLs.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const origin = 'https://tinystepslearning.com';
const targets = [
  { url: '/online-english-classes-for-kids', sitemap: 'sitemap-static.xml' },
  { url: '/english-classes-for-5-year-old', sitemap: 'sitemap-static.xml' },
  { url: '/blog/why-child-knows-letter-sounds-but-cannot-read-words', sitemap: 'sitemap-blog.xml' },
  { url: '/courses/phonics-advanced', sitemap: 'sitemap-courses.xml' },
  { url: '/grammar', sitemap: 'sitemap-static.xml' },
  { url: '/blog/how-to-improve-sentence-formation-in-kids', sitemap: 'sitemap-blog.xml' },
  { url: '/blog/child-knows-grammar-but-makes-mistakes', sitemap: 'sitemap-blog.xml' },
  { url: '/spoken-english-classes-for-kids-online', sitemap: 'sitemap-static.xml' },
  { url: '/shy-child-speaking-confidence', sitemap: 'sitemap-static.xml' },
  { url: '/courses/public-speaking-foundations', sitemap: 'sitemap-courses.xml' },
  { url: '/blog/how-to-teach-storytelling-to-kids', sitemap: 'sitemap-blog.xml' },
  { url: '/courses/public-speaking-excellence', sitemap: 'sitemap-courses.xml' },
  { url: '/blog/child-understands-english-but-does-not-speak', sitemap: 'sitemap-blog.xml' },
];

assert.equal(targets.length, 13, 'The Phase 0 pilot has exactly 13 established owner routes');
assert.equal(new Set(targets.map(x => x.url)).size, targets.length, 'No duplicated canonical owners');

for (const target of targets) {
  test('SCQ semantic prerender and discovery: ' + target.url, () => {
    const html = readFileSync(path.join('dist', target.url.slice(1), 'index.html'), 'utf8');
    const document = new JSDOM(html, { url: origin + target.url }).window.document;

    const canonical = [...document.querySelectorAll('link[rel="canonical"]')];
    assert.equal(canonical.length, 1, 'one and only one canonical');
    assert.equal(canonical[0].getAttribute('href'), origin + target.url, 'correct canonical owner');

    for (const selector of ['meta[name="robots"]', 'meta[name="googlebot"]', 'meta[name="bingbot"]']) {
      const content = document.querySelector(selector)?.getAttribute('content') || '';
      assert.doesNotMatch(content, /\bnoindex\b/i, 'index-intended page must not be noindex');
    }

    assert.ok(document.querySelector('title')?.textContent?.trim(), 'nonempty title');
    assert.ok(document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(), 'nonempty description');
    assert.equal(document.querySelectorAll('h1').length, 1, 'one H1');
    const main = document.querySelector('main') || document.querySelector('#root');
    const readableText = (main?.textContent || '').replace(/\s+/g, ' ').trim();
    assert.ok(readableText.length >= 450, 'substantive pre-rendered content (not just JS shell)');

    const schema = [...document.querySelectorAll('script[type="application/ld+json"]')];
    assert.ok(schema.length >= 1, 'at least one JSON-LD block');
    for (const node of schema) {
      assert.doesNotThrow(() => JSON.parse(node.textContent || 'null'), 'JSON-LD must be parseable');
    }

    const sitemap = readFileSync(path.join('dist', target.sitemap), 'utf8');
    const entries = [...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
    assert.equal(entries.filter(loc => loc === origin + target.url).length, 1, 'exactly one sitemap entry');

    if (target.url.startsWith('/blog/')) {
      const types = schema.map(s => JSON.parse(s.textContent || 'null')).flatMap(s => {
        const nodes = Array.isArray(s) ? s : s?.['@graph'] || [s];
        return nodes.flatMap(x => (Array.isArray(x?.['@type']) ? x['@type'] : [x?.['@type']]));
      });
      assert.ok(types.includes('BlogPosting') || types.includes('Article'), 'blog article schema');
    }

    if (target.url === '/shy-child-speaking-confidence') {
      assert.ok(readableText.includes('Quiet behaviour by itself does not mean a child has a language deficit.'), 'avoid pathologising shyness');
      assert.ok(readableText.includes('Educational classes are not a clinical assessment.'), 'appropriate scope limitation');
      const mainListItems = [...document.querySelectorAll('main li')];
      assert.ok(mainListItems.length >= 20, 'semantic list content retained');
      assert.ok(mainListItems.every(li => !/^\s*•/.test(li.textContent || '')), 'no literal bullet duplication');
    }
    if (target.url === '/blog/child-knows-grammar-but-makes-mistakes') {
      assert.ok(readableText.includes('When grammar-rule practice is the right starting point'), 'parent-facing editorial heading');
      assert.doesNotMatch(readableText, /\bBlog\s+38\b/i, 'remove internal blog numbering');
      assert.ok(readableText.includes('Rule recall') && readableText.includes('Written transfer'), 'four-stage grammar guidance preserved');
    }
    console.log(JSON.stringify({ route: target.url, textChars: readableText.length, sitemap: target.sitemap, jsonLdBlocks: schema.length }));
  });
}
