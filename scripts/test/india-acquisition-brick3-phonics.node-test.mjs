import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('Phonics programme keeps the established commercial search owner and prerender intent', () => {
  const routes = read('src/lib/publicRouteManifest.js');
  const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
  assert.match(routes, /route\('\/phonics', 'static'\)/);
  assert.match(c2, /id: 'phonics-provider',[^\n]*canonicalOwnerPath: '\/phonics'/);
  assert.match(c2, /canonicalOwnerPath: '\/phonics-fees-india'/);
  assert.match(c2, /canonicalOwnerPath: '\/best-online-phonics-classes-for-kids-in-india'/);
});

test('Main phonics FAQ accurately presents 1:1 and conditional small-group pathways', () => {
  const content = read('src/pages/phonics.tsx');
  const group = read('src/pages/public/GroupClassPage.tsx');
  assert.match(content, /Are Tiny Steps phonics classes available as 1:1 or small groups\?/);
  assert.match(content, /Standard live 1:1 phonics classes provide individual pacing and correction/);
  assert.match(content, /up to four children per teacher/);
  assert.match(content, /immediate group availability is not guaranteed/);
  assert.match(group, /group classes have a maximum of four children per teacher/);
  assert.match(group, /New groups are formed when children with compatible learning levels and schedules are available/);
  assert.match(content, /to="\/group-phonics-classes-for-kids"/);
  assert.match(content, /to="\/book-demo"/);
});

test('No collateral change to canonical, hero and specialist fee/comparison pages', () => {
  const content = read('src/pages/phonics.tsx');
  assert.match(content, /seoOverrides\?\.canonicalPath \?\? "\/phonics"/);
  assert.match(content, /Online Phonics Classes for Kids \| Live 1:1 \| Tiny Steps/);
  assert.match(content, /heroTitleOverride \?\? "Online Phonics Classes for Kids"/);
  assert.match(content, /to="\/phonics-fees-india"/);
  assert.match(content, /to="\/best-online-phonics-classes-for-kids-in-india"/);
  assert.match(content, /const schemaFaqItems = faqItems/);
});
