#!/usr/bin/env node
// Regression protection for GSC issue #735, not an external Google indexing check.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const DIST = path.join(process.cwd(), 'dist');
const ORIGIN = 'https://tinystepslearning.com';
import { TRACKED, GRAMMAR_HUB } from '../lib/gsc735TrackedResources.mjs';



async function documentFor(route) {
  const html = await fs.readFile(path.join(DIST, route.slice(1), 'index.html'), 'utf8');
  return new JSDOM(html, { url: ORIGIN + route }).window.document;
}
function siteLinks(doc) {
  return new Set([...doc.querySelectorAll('a[href]')].map(a => {
    try {
      const url = new URL(a.getAttribute('href'), ORIGIN);
      return url.origin === ORIGIN ? url.pathname.replace(/\/$/, '') || '/' : null;
    } catch {
      return null;
    }
  }).filter(Boolean));
}

test('GSC #735: tracked screenshot resource URLs appear once in the generated static sitemap', async () => {
  const xml = await fs.readFile(path.join(DIST, 'sitemap-static.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(TRACKED.length + 1, 23, 'Expected 18 phonics, 3 grammar, 1 vocabulary guide and Grammar hub');
  for (const { url } of [...TRACKED, {url:GRAMMAR_HUB}]) {
    assert.equal(urls.filter(href => href === ORIGIN + url).length, 1, url + ' must appear exactly once');
  }
});

test('GSC #735: every tracked page prerenders with correct canonical, robots and meaningful main text', async () => {
  for (const { url } of [...TRACKED, {url:GRAMMAR_HUB}]) {
    const doc = await documentFor(url);
    const canonicalTags = [...doc.querySelectorAll('link[rel="canonical"]')];
    assert.equal(canonicalTags.length, 1, url + ' should have exactly one canonical');
    assert.equal(canonicalTags[0].getAttribute('href'), ORIGIN + url, url + ' canonical');
    for (const node of doc.querySelectorAll('meta[name="robots"],meta[name="googlebot"],meta[name="bingbot"]')) {
      assert.doesNotMatch(node.getAttribute('content') || '', /\bnoindex\b/i, url + ' robots should permit index');
    }
    assert.ok(doc.querySelector('title')?.textContent?.trim(), url + ' needs a title');
    assert.ok(doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim(), url + ' needs a description');
    assert.ok(doc.querySelector('h1')?.textContent?.trim(), url + ' needs an H1');
    assert.ok((doc.querySelector('main')?.textContent || '').replace(/\s+/g,' ').trim().length >= 180, url + ' needs meaningful main content');
  }
});

test('GSC #735: each flagged child guide has a direct HTML link from its existing canonical subject hub', async () => {
  const hubLinks = new Map();
  for (const { url, hub } of TRACKED) {
    if (!hubLinks.has(hub)) hubLinks.set(hub, siteLinks(await documentFor(hub)));
    assert.ok(hubLinks.get(hub).has(url), hub + ' should link directly to ' + url);
  }
});
