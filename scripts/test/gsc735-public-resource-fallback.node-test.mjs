import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  captureOriginalPublicResource,
  saveOriginalPublicResource,
  originalResourceForChunkError,
} from '../../src/lib/publicResourcePrerenderRecovery.js';

const ORIGIN = 'https://tinystepslearning.com';
const path = '/resources/vocabulary/vocabulary-for-better-writing';
const validArticle = 'Specific examples help children choose precise words in complete sentences. '.repeat(13);
function fixture({ route = path, canonical = route, robots = 'index, follow', body = validArticle } = {}) {
  return new JSDOM(`<!DOCTYPE html><html><head>
    <link rel="canonical" href="${ORIGIN}${canonical}" />
    <meta name="robots" content="${robots}" />
    </head><body><div id="root"><main><h1>Vocabulary for Better Writing</h1>
    <article><p>${body}</p><a href="/resources/vocabulary">Related guides</a></article>
    </main></div></body></html>`, { url: ORIGIN + route });
}

const chunkError = new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/VocabularyKnowledgePage-abc123.js');

test('GSC #735: preserve only genuine initial, self-canonical public resource content', () => {
  const dom = fixture();
  const snapshot = captureOriginalPublicResource(dom.window.document, dom.window.location);
  assert.ok(snapshot);
  assert.equal(snapshot.path, path);
  assert.match(snapshot.html, /Vocabulary for Better Writing/);
  saveOriginalPublicResource(dom.window.document, dom.window.location);
  assert.match(originalResourceForChunkError(chunkError, dom.window.location), /Specific examples/);
  assert.equal(originalResourceForChunkError(new Error('An unrelated application error'), dom.window.location), null);
});

test('GSC #735: never reuse an old article after client-side route navigation', () => {
  const dom = fixture();
  saveOriginalPublicResource(dom.window.document, dom.window.location);
  const another = new URL(ORIGIN + '/resources/grammar/simple-past-tense-for-kids');
  assert.equal(originalResourceForChunkError(chunkError, another), null);
  assert.equal(originalResourceForChunkError(chunkError, new URL('https://example.org' + path)), null);
});

test('GSC #735: reject noindex, wrong canonical, error/empty shells and protected routes', () => {
  const invalid = [
    fixture({ robots: 'noindex, follow' }),
    fixture({ canonical: '/resources/grammar' }),
    fixture({ body: 'Too short' }),
    fixture({ body: 'Something went wrong ' + validArticle }),
    fixture({ route: '/surya' }),
    fixture({ route: '/resources/grammar/missing-guide', canonical: '/resources/vocabulary/vocabulary-for-better-writing' }),
  ];
  for (const dom of invalid) {
    assert.equal(captureOriginalPublicResource(dom.window.document, dom.window.location), null);
  }
});

test('GSC #735: normal failures never receive article rescue', () => {
  const dom = fixture();
  saveOriginalPublicResource(dom.window.document, dom.window.location);
  for (const error of [new Error('Permission denied'), new Error('404 - Page Not Found'), new Error('Loading failed')]) {
    assert.equal(originalResourceForChunkError(error, dom.window.location), null);
  }
});

const blogRoute = '/blog/online-phonics-classes-vs-school';
const blogChunkError = new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/BlogPostPage-abc123.js');

test('GSC #735 P1: protect a verified initial blog article when BlogPostPage lazy chunk fails', () => {
  const dom = fixture({ route: blogRoute, canonical: blogRoute });
  const snapshot = captureOriginalPublicResource(dom.window.document, dom.window.location);
  assert.ok(snapshot, 'a substantive self-canonical blog article should be capturable');
  saveOriginalPublicResource(dom.window.document, dom.window.location);
  assert.match(originalResourceForChunkError(blogChunkError, dom.window.location), /Specific examples/);
  assert.match(originalResourceForChunkError(
    new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/NotFoundPage-abc123.js'),
    dom.window.location,
  ), /Specific examples/);
  assert.equal(originalResourceForChunkError(new Error('Unrelated application failure'), dom.window.location), null);
  assert.equal(originalResourceForChunkError(blogChunkError, new URL(ORIGIN + '/blog/sight-words-or-phonics-first')), null);
});

test('GSC #735 P1: never preserve wrong-canonical, noindex, empty, fake or protected blog content', () => {
  for (const dom of [
    fixture({ route: blogRoute, canonical: '/blog/sight-words-or-phonics-first' }),
    fixture({ route: blogRoute, robots: 'noindex, follow' }),
    fixture({ route: blogRoute, body: 'Too short' }),
    fixture({ route: blogRoute, body: '404 - Page Not Found' + validArticle }),
    fixture({ route: '/blog/rss.xml' }),
    fixture({ route: '/blog/missing', canonical: blogRoute }),
    fixture({ route: '/courses' }),
    fixture({ route: '/parent/dashboard' }),
    fixture({ route: '/surya' }),
  ]) {
    assert.equal(captureOriginalPublicResource(dom.window.document, dom.window.location), null, dom.window.location.href);
  }
});
