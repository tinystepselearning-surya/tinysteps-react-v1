import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const owners = [
  ['/phonics', 'src/pages/phonics.tsx'],
  ['/reading-classes-for-kids', 'src/pages/public/ReadingClassesForKidsPage.tsx'],
  ['/grammar', 'src/pages/grammar.tsx'],
  ['/speaking', 'src/pages/speaking.tsx'],
  ['/online-english-classes-for-kids', 'src/pages/public/OnlineEnglishClassesForKidsPage.tsx'],
];

test('five frozen C2 programme owners remain indexable prerendered static routes', () => {
  const manifest = read('src/lib/publicRouteManifest.js');
  const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
  for (const [path] of owners) {
    assert.ok(manifest.includes(`route('${path}', 'static')`), `${path}: static route`);
    assert.ok(c2.includes(`canonicalOwnerPath: '${path}'`), `${path}: frozen owner`);
  }
  assert.match(manifest, /indexable\s*=\s*true/);
  assert.match(manifest, /prerender\s*=\s*true/);
});

test('all five owner components retain self-canonical source declarations', () => {
  for (const [path, source] of owners) {
    const content = read(source);
    assert.ok(content.includes(`'${path}'`) || content.includes(`"${path}"`), `${path}: path present`);
    assert.match(content, /canonicalPath/);
    assert.match(content, /applySeo\(/);
  }
});

test('Grammar captures researched English grammar intent without replacing its title, path or fee source', () => {
  const s = read('src/pages/grammar.tsx');
  assert.match(s, /Online Grammar Classes for Kids \| Live 1:1 \| Tiny Steps/);
  assert.match(s, /Online Grammar Classes for Kids[\s\S]*?<\/h1>/);
  assert.match(s, /live 1:1 online English grammar classes for children in India and worldwide/);
  assert.match(s, /PUBLIC_SITE_FACTS\.standardOffer\.oneToOnePerClassInr} per standard 1:1 class/);
  assert.match(s, /to="\/book-demo"/);
  assert.match(s, /to="\/pricing"/);
});

test('Broad English distinguishes English tuition from all-purpose homework and keeps specialist owners', () => {
  const s = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  assert.match(s, /Online English Classes for Kids \| Live 1:1 \| Tiny Steps/);
  assert.match(s, /Is Tiny Steps suitable for parents seeking online English tuition for kids\?/);
  assert.match(s, /rather than covering every school homework task/);
  for (const path of ['/phonics', '/reading-classes-for-kids', '/grammar', '/speaking', '/spoken-english-classes-for-kids-online']) {
    assert.ok(s.includes(path), `${path}: specialist link retained`);
  }
  assert.match(s, /to: '\/book-demo'/);
});

test('Speaking keeps the existing public-speaking vs spoken-English boundary', () => {
  const s = read('src/pages/speaking.tsx');
  assert.match(s, /What is the difference between spoken English and public speaking classes\?/);
  assert.match(s, /dedicated Spoken English programme is the stronger first fit/);
  assert.match(s, /SPEAKING_META_DESCRIPTION_EXPERIMENT\.candidateDescription/);
});
test('researched English-speaking classes intent routes naturally to its existing specialist owner', () => {
  const national = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  const local = read('src/pages/public/OnlineEnglishClassesHyderabadPage.tsx');
  for (const source of [national, local]) {
    assert.match(source, /title: 'Spoken English',[\s\S]*?href: '\/spoken-english-classes-for-kids-online',[\s\S]*?linkLabel: 'English Speaking Classes for Kids'/);
    assert.ok(source.includes("href: '/speaking'"), 'Public Speaking owner retained');
    assert.ok(source.includes("href: '/grammar'"), 'Grammar owner retained');
  }
  // Research-backed descriptive anchor points to the existing specialist URL.
  assert.match(national, /Explore \{track\.linkLabel \?\? track\.title\}/);
  assert.match(local, /Explore \{card\.linkLabel \?\? card\.title\}/);
});

test('national English trust claims trace to the published academic teaching process', () => {
  const national = read('src/pages/public/OnlineEnglishClassesForKidsPage.tsx');
  const team = read('src/pages/team/TeamPageSections.tsx');
  assert.match(national, /Teachers are reviewed for spoken English, subject understanding, child interaction, reliability and online-class readiness/);
  assert.match(national, /They receive programme guidance and lesson resources, with academic feedback and parent insights supporting continued development/);
  assert.match(national, /<Link to="\/team"[^>]*>How our teachers are selected and supported<\/Link>/);
  assert.match(national, /<Link to="\/class-samples"/);
  assert.match(national, /<Link to="\/parents\/tracking-progress"/);
  assert.match(national, /const canonicalPath = '\/online-english-classes-for-kids'/);
  assert.match(team, /TeacherDevelopmentSection/);
});
