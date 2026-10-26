#!/usr/bin/env node
/**
 * Verifies real initial prerendered HTML, without running any client JavaScript.
 * This rejects "JS-only SEO" regressions even when a browser eventually hydrates.
 */
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const read = (path) => new JSDOM(fs.readFileSync(path, 'utf8')).window.document;
const speaking = read('dist/speaking/index.html');
const samples = read('dist/class-samples/index.html');
const expectedVideoId = 'H-xTpL6tKWU';
const expectedDate = '2026-04-09';
const expectedTitle = 'Instant Storytelling Activity';
const requireTrue = (value, reason) => { if (!value) throw new Error(`Issue #804 prerender verification: ${reason}`); };

requireTrue(speaking.body.textContent.includes(expectedTitle), 'Speaking title not in initial HTML body');
requireTrue(speaking.body.textContent.includes('created and presented a story'), 'Speaking description not in HTML');
const iframe = speaking.querySelector('#real-class-sample iframe[src]');
requireTrue(iframe?.getAttribute('src')?.includes(`/embed/${expectedVideoId}`), 'YouTube embed iframe missing from HTML');
const thumbnail = speaking.querySelector('#real-class-sample img[src]');
requireTrue(thumbnail?.getAttribute('src')?.includes(`/vi/${expectedVideoId}/`), 'YouTube thumbnail missing from HTML');
const originalLink = [...speaking.querySelectorAll('#real-class-sample a[href]')]
  .find((a) => a.href === `https://www.youtube.com/watch?v=${expectedVideoId}`);
requireTrue(Boolean(originalLink), 'public YouTube watch link missing from Speaking HTML');
const scripts = [...speaking.querySelectorAll('script[type="application/ld+json"]')];
const trees = scripts.map((script) => {
  try { return JSON.parse(script.textContent || '{}'); }
  catch { throw new Error('Invalid speaking JSON-LD script'); }
});
const searchNodes = (value, results = []) => {
  if (!value || typeof value !== 'object') return results;
  if (Array.isArray(value)) { for (const item of value) searchNodes(item, results); return results; }
  if (value['@type'] === 'VideoObject' || (Array.isArray(value['@type']) && value['@type'].includes('VideoObject'))) results.push(value);
  for (const child of Object.values(value)) searchNodes(child, results);
  return results;
};
const videos = searchNodes(trees);
const matched = videos.filter((node) => node.embedUrl?.includes(expectedVideoId));
requireTrue(matched.length === 1, `Expected exactly one VideoObject for real video, got ${matched.length}`);
requireTrue(matched[0].uploadDate === expectedDate, 'First-publication date missing from JSON-LD');
requireTrue(matched[0].name === expectedTitle, 'Approved title mismatch in JSON-LD');
requireTrue(matched[0].thumbnailUrl.includes(`/vi/${expectedVideoId}/`), 'thumbnail mismatch in JSON-LD');
const canonical = speaking.querySelector('link[rel="canonical"]')?.getAttribute('href');
requireTrue(canonical === 'https://tinystepslearning.com/speaking', 'Speaking canonical changed');
const galleryLink = samples.querySelector('[data-static-speaking-video-link] a[href]');
requireTrue(galleryLink?.getAttribute('href') === '/speaking#real-class-sample', 'Class Samples prerender link missing');
requireTrue(samples.body.textContent.includes(expectedTitle), 'Class Samples body lacks the linked clip title');
console.log('PASS #804: verified existing Public Speaking clip in both initial HTML pages, iframe, thumbnail, canonical and VideoObject');
