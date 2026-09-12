import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { readPrerenderReadiness } from '../prerender-readiness.mjs';

const articles = [
  'speaking-video-feedback', 'speaking-structure', 'speaking-debate-starters',
  'speaking-competition-prep', 'phonics-for-parents-guide', 'satpin-phonics-guide',
];

test('generated article files contain the correct indexable content before JavaScript hydration', async (t) => {
  const browser = await chromium.launch();
  t.after(() => browser.close());
  // Inspect the saved output, not the shell adapter or a runtime-corrected DOM.
  const page = await browser.newPage({ javaScriptEnabled: false, serviceWorkers: 'block' });
  await page.route('**/*', route => route.abort());
  for (const slug of articles) {
    const html = await fs.readFile(path.resolve('dist/blog', slug, 'index.html'), 'utf8');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const state = await page.evaluate(readPrerenderReadiness, {
      canonicalUrl: 'https://tinystepslearning.com/blog/' + slug,
      requireArticle: true, checkArticleMetadata: true, expectedNoindex: false, diagnostics: true,
    });
    assert.equal(state.ready, true, slug + ': ' + JSON.stringify(state));
    if (slug === 'speaking-video-feedback') {
      assert.equal(state.title, 'How Video Feedback Helps Kids Improve Public Speaking | Tiny Steps Blog');
    }
    console.log('PASS saved article identity: ' + slug);
  }
});
