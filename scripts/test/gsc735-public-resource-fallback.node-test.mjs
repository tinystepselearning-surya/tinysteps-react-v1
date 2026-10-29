import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  captureOriginalPublicResource,
  saveOriginalPublicResource,
  originalResourceForChunkError,
  isLazyModuleLoadError,
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
    </main></main></div></body></html>`, { url: ORIGIN + route });
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

const GROUP_OWNERS = [
  ['/group-phonics-classes-for-kids', 'Live Online Group Phonics Classes for Kids'],
  ['/group-grammar-classes-for-kids', 'Small-Group Online Grammar Classes for Kids'],
  ['/group-public-speaking-classes-for-kids', 'Live Online Group Public Speaking Classes for Kids'],
];
const substantialGroupText = 'Our experienced teachers plan individual speaking turns, guided practice, thoughtful feedback and level-matched activities for each small group. '.repeat(9);

function groupFixture({ route, canonical = route, robots = 'index, follow', heading, mainClass = 'group-commercial-page', body = substantialGroupText } = {}) {
  return new JSDOM(`<!DOCTYPE html><html><head>
    <link rel="canonical" href="${ORIGIN}${canonical}">
    <meta name="robots" content="${robots}">
    </head><body><div id="root"><main class="public-layout-shell"><main class="${mainClass}"><h1>${heading}</h1>
    <section><p>${body}</p><a href="/book-demo?format=small_group">Register Group Interest</a></section>
    </main></div></body></html>`, { url: ORIGIN + route });
}

test('GSC group-class hotfix: each self-canonical programme survives its lazy chunk and NotFoundPage failures', () => {
  for (const [route, heading] of GROUP_OWNERS) {
    const dom = groupFixture({ route, heading });
    const snapshot = captureOriginalPublicResource(dom.window.document, dom.window.location);
    assert.ok(snapshot, route + ': expected capturable programme HTML');
    assert.match(snapshot.html, /group-commercial-page/);
    assert.match(snapshot.html, /Register Group Interest/);
    saveOriginalPublicResource(dom.window.document, dom.window.location);
    for (const failedChunk of ['GroupPublicSpeakingClassesPage', 'GroupGrammarClassesPage', 'GroupPhonicsClassesPage', 'NotFoundPage']) {
      const error = new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/' + failedChunk + '-abc123.js');
      assert.equal(isLazyModuleLoadError(error), true);
      assert.match(originalResourceForChunkError(error, dom.window.location), /Register Group Interest/, route);
    }
    for (const [otherRoute] of GROUP_OWNERS) {
      if (otherRoute !== route) {
        assert.equal(originalResourceForChunkError(
          new Error('Failed to fetch dynamically imported module'), new URL(ORIGIN + otherRoute),
        ), null, route + ': must not reuse a different programme');
      }
    }
    assert.equal(originalResourceForChunkError(new Error('Permission denied'), dom.window.location), null);
  }
});

test('GSC group-class hotfix: fail closed for missing, misleading, noindex and wrong-owner content', () => {
  const [route, heading] = GROUP_OWNERS[2];
  for (const [name, dom] of [
    ['wrong canonical', groupFixture({ route, heading, canonical: GROUP_OWNERS[0][0] })],
    ['noindex', groupFixture({ route, heading, robots: 'noindex, follow' })],
    ['wrong heading', groupFixture({ route, heading: 'Page not found' })],
    ['missing programme class', groupFixture({ route, heading, mainClass: 'generic-page' })],
    ['thin content', groupFixture({ route, heading, body: 'Too short' })],
    ['application error', groupFixture({ route, heading, body: 'Something went wrong ' + substantialGroupText })],
    ['unapproved URL', groupFixture({ route: '/group-reading-classes-for-kids', heading })],
    ['protected route', groupFixture({ route: '/parent/dashboard', heading })],
  ]) {
    assert.equal(captureOriginalPublicResource(dom.window.document, dom.window.location), null, name);
  }
  assert.equal(isLazyModuleLoadError(new Error('A business validation error')), false);
});

const CORE_COMMERCIAL = [
  ['/courses', 'Find the Right English Course for Your Child'],
  ['/pricing', 'Online English Classes for Kids: Fees & Pricing'],
  ['/phonics', 'Online Phonics Classes for Kids'],
  ['/grammar', 'Online Grammar Classes for Kids'],
  ['/speaking', 'Online Public Speaking Classes for Kids'],
  ['/reading-classes-for-kids', 'Online Reading Classes for Kids'],
];
test('six commercial owners preserve only their own substantive self-canonical prerendered HTML', () => {
  for (const [route, heading] of CORE_COMMERCIAL) {
    const dom = groupFixture({ route, heading, mainClass: 'commercial-programme-content' });
    assert.ok(captureOriginalPublicResource(dom.window.document, dom.window.location), route);
    saveOriginalPublicResource(dom.window.document, dom.window.location);
    const err = new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/CoursesPage-test.js');
    assert.match(originalResourceForChunkError(err, dom.window.location), /Register Group Interest/, route);
    for (const [otherRoute] of CORE_COMMERCIAL) {
      if (route === otherRoute) continue;
      assert.equal(originalResourceForChunkError(err, new URL(ORIGIN + otherRoute)), null, route);
    }
    for (const altered of [
      groupFixture({ route, heading: 'Wrong heading', mainClass: 'commercial-programme-content' }),
      groupFixture({ route, heading, canonical: route === '/pricing' ? '/phonics' : '/pricing', mainClass: 'commercial-programme-content' }),
      groupFixture({ route, heading, robots: 'noindex, follow', mainClass: 'commercial-programme-content' }),
      groupFixture({ route, heading, body: 'Too short', mainClass: 'commercial-programme-content' }),
    ]) {
      assert.equal(captureOriginalPublicResource(altered.window.document, altered.window.location), null, route);
    }
  }
});

const GSC_GOOGLEBOT_LIVE_SOFT404 = [
  ['/free-reading-fluency-game-for-kids', 'Free Reading Fluency Game for Kids'],
  ['/free-phonics-games-for-kids', 'Free Phonics Games for Kids'],
  ['/why-tiny-steps', 'Why Parents Choose Tiny Steps Learning'],
  ['/resources', 'English Learning Resources for Kids, Parents & Educators'],
];
const meaningfulPublicCopy = 'Families can learn how to practise reading, phonics and English with child-friendly examples, independent activities and teacher support. '.repeat(9);
function gscLiveSoft404Fixture({ route, heading, canonical = route, robots = 'index, follow', content = meaningfulPublicCopy } = {}) {
  return new JSDOM(`<!DOCTYPE html><html><head>
    <link rel="canonical" href="${ORIGIN}${canonical}">
    <meta name="robots" content="${robots}">
    </head><body><div id="root"><main class="public-shell"><h1>${heading}</h1>
      <section><p>${content}</p><a href="/book-demo">Book a demo</a></section>
      </main></div></body></html>`, { url: ORIGIN + route });
}

test('GSC 2026-10-29 live Soft 404: retain four exact public prerendered owners when a lazy import fails', () => {
  for (const [route, heading] of GSC_GOOGLEBOT_LIVE_SOFT404) {
    const dom = gscLiveSoft404Fixture({ route, heading });
    const snapshot = captureOriginalPublicResource(dom.window.document, dom.window.location);
    assert.ok(snapshot, route + ': expected existing substantive initial HTML to be eligible');
    assert.equal(snapshot.path, route);
    saveOriginalPublicResource(dom.window.document, dom.window.location);
    const error = new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + '/assets/FreeEnglishGameLandingPage-test.js');
    assert.match(originalResourceForChunkError(error, dom.window.location), /Book a demo/);
    assert.match(originalResourceForChunkError(error, dom.window.location), new RegExp(heading));
    assert.equal(originalResourceForChunkError(new Error('Permission denied'), dom.window.location), null);
    assert.equal(originalResourceForChunkError(error, new URL(ORIGIN + '/pricing')), null);
  }
});

test('GSC 2026-10-29 live Soft 404: recovery rejects thin, wrong-owner, noindex and actual-error content', () => {
  for (const [route, heading] of GSC_GOOGLEBOT_LIVE_SOFT404) {
    const invalid = [
      gscLiveSoft404Fixture({ route, heading: 'Page temporarily unavailable' }),
      gscLiveSoft404Fixture({ route, heading: '404 - Page not found' }),
      gscLiveSoft404Fixture({ route, heading: 'Wrong heading' }),
      gscLiveSoft404Fixture({ route, heading, canonical: '/phonics' }),
      gscLiveSoft404Fixture({ route, heading, robots: 'noindex,follow' }),
      gscLiveSoft404Fixture({ route, heading, content: 'Too short' }),
      gscLiveSoft404Fixture({ route, heading, content: 'Something went wrong. ' + meaningfulPublicCopy }),
    ];
    for (const dom of invalid) {
      assert.equal(captureOriginalPublicResource(dom.window.document, dom.window.location), null, route);
    }
  }
  const unapproved = gscLiveSoft404Fixture({ route: '/free-games/example', heading: GSC_GOOGLEBOT_LIVE_SOFT404[0][1] });
  assert.equal(captureOriginalPublicResource(unapproved.window.document, unapproved.window.location), null);
});
