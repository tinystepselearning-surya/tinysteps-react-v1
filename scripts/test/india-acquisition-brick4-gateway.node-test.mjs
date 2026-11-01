import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('homepage has one contextual route to broad English programme for undecided parents', () => {
  const home = source('src/pages/HomePage.tsx');
  assert.match(home, /If you are unsure which programme fits, explore our/);
  assert.match(home, /<Link to="\/online-english-classes-for-kids"[^>]*>online English classes for kids<\/Link>/);
  assert.equal((home.match(/to="\/online-english-classes-for-kids"/g) || []).length, 1);
});

test('homepage keeps four specialist Explore cards and the premium free demo hero', () => {
  const home = source('src/pages/HomePage.tsx');
  const hero = source('src/components/Home/ConversionHero.tsx');
  const cards = home.split('const learningPaths = [')[1]?.split('];')[0] || '';
  for (const route of ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking']) {
    assert.ok(cards.includes(`path: '${route}'`), route);
  }
  assert.equal((cards.match(/path:/g) || []).length, 4);
  assert.match(hero, /Online English Classes <span className="text-\[#FF7A00\]">for Kids\.<\/span>/);
  assert.match(hero, /to="\/book-demo"/);
  assert.match(home, /<Meta[\s\S]*?canonical=\{homeUrl\}/);
});

test('the broad English URL remains the existing self-canonical indexable owner', () => {
  const manifest = source('src/lib/publicRouteManifest.js');
  const ownership = source('src/lib/commercialC2KeywordOwnership.ts');
  const destination = source('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  assert.match(manifest, /route\('\/online-english-classes-for-kids', 'static'\)/);
  assert.match(ownership, /canonicalOwnerPath: '\/online-english-classes-for-kids'/);
  assert.match(destination, /const canonicalPath = '\/online-english-classes-for-kids'/);
  assert.match(destination, /to: '\/book-demo'/);
});
