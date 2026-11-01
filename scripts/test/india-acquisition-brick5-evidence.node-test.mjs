import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('existing broad English Trust proof gives direct access to three real supporting surfaces', () => {
  const page = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  const anchor = page.indexOf('eyebrow="Trust proof"');
  const boundary = page.indexOf('eyebrow="International access"', anchor);
  assert.ok(anchor > 0 && boundary > anchor, 'trust panel precedes international content');
  const proof = page.slice(anchor, boundary);
  const links = [
    ['/team', 'Meet the academic team'],
    ['/class-samples', 'See class samples'],
    ['/parents/tracking-progress', 'How parents can track progress'],
  ];
  for (const [path, label] of links) {
    assert.ok(proof.includes(`to="${path}"`), path + ' link exists in trust panel');
    assert.ok(proof.includes(label), label + ' describes destination');
  }
  assert.equal((proof.match(/<Link to=/g) || []).length, 3, 'exactly three evidence links');
});

test('each referenced evidence page exists and is statically public', () => {
  const routes = read('src/lib/publicRouteManifest.js');
  const files = [
    ['/team', 'src/pages/TeamPage.tsx', /TeacherDevelopmentSection/],
    ['/class-samples', 'src/pages/ClassSamplesPage.tsx', /class/],
    ['/parents/tracking-progress', 'src/pages/parents/tracking-progress.tsx', /progress/i],
  ];
  for (const [path, source, indicator] of files) {
    assert.ok(routes.includes(`route('${path}', 'static')`), path + ' static route');
    assert.match(read(source), indicator, source + ' has appropriate evidence');
  }
});

test('keyword owner, assessment and specialist commercial navigation are unchanged', () => {
  const page = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  const ownership = read('src/lib/commercialC2KeywordOwnership.ts');
  assert.match(page, /const canonicalPath = '\/online-english-classes-for-kids'/);
  assert.match(ownership, /canonicalOwnerPath: '\/online-english-classes-for-kids'/);
  for (const path of ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking']) {
    assert.ok(page.includes(`href: '${path}'`) || page.includes(`to="${path}"`), path);
  }
  assert.match(page, /to: '\/book-demo'/);
  assert.match(page, /to: '\/pricing'/);
});
