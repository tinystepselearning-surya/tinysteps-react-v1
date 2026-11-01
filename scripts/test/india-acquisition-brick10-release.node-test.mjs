import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

const owners = [
  { id: 'phonics-provider', path: '/phonics', source: 'src/pages/phonics.tsx', title: 'Online Phonics Classes for Kids | Live 1:1 | Tiny Steps' },
  { id: 'reading-provider', path: '/reading-classes-for-kids', source: 'src/pages/public/ReadingClassesForKidsPage.tsx', title: 'Online Reading Classes for Kids | Live 1:1 | Tiny Steps' },
  { id: 'grammar-provider', path: '/grammar', source: 'src/pages/grammar.tsx', title: 'Online Grammar Classes for Kids | Live 1:1 | Tiny Steps' },
  { id: 'public-speaking-provider', path: '/speaking', source: 'src/pages/speaking.tsx', title: 'Online Public Speaking Classes for Kids | Live 1:1 | Tiny Steps' },
  { id: 'broad-english-provider', path: '/online-english-classes-for-kids', source: 'src/pages/public/OnlineEnglishClassesForKidsPage.tsx', title: 'Online English Classes for Kids | Live 1:1 | Tiny Steps' },
];

test('Brick 10: five commercial owners remain uniquely prerenderable indexable public routes', () => {
  const manifest = read('src/lib/publicRouteManifest.js');
  const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
  assert.match(manifest, /indexable = true/);
  assert.match(manifest, /prerender = true/);
  assert.match(manifest, /canonicalPath = path/);
  for (const item of owners) {
    const routeToken = "route('" + item.path + "', 'static')";
    assert.equal(manifest.split(routeToken).length - 1, 1, item.path + ': exactly one static owner');
    const ownerToken = "id: '" + item.id + "'";
    const start = c2.indexOf(ownerToken);
    assert.ok(start >= 0, item.id + ': required frozen intent');
    assert.ok(c2.slice(start, start + 240).includes("canonicalOwnerPath: '" + item.path + "'"), item.id + ': path unchanged');
  }
});

test('Brick 10: SEO registry self-canonical/title and visible demo route survive for five owners', () => {
  const registry = read('src/lib/routeSeoRegistry.js');
  for (const item of owners) {
    const token = "'" + item.path + "': {";
    const start = registry.indexOf(token);
    assert.ok(start >= 0, item.path + ': SEO registry entry');
    const next = registry.indexOf("\n  '/", start + token.length);
    const entry = registry.slice(start, next < 0 ? undefined : next);
    assert.ok(entry.includes("title: '" + item.title + "'"), item.path + ': stable primary title');
    assert.ok(entry.includes("canonicalPath: '" + item.path + "'"), item.path + ': self canonical');
    const page = read(item.source);
    assert.ok(page.includes(item.path), item.path + ': owner route in component');
    assert.match(page, /canonicalPath/, item.path + ': canonical path source');
    assert.match(page, /createFAQPageSchema\(/, item.path + ': structured FAQ generated from source');
    assert.ok(/to=["']\/book-demo["']/.test(page) || /to: ['"]\/book-demo['"]/.test(page), item.path + ': parent demo path');
  }
});

test('Brick 10: core brand, class pricing and free assessment come from defined canonical sources', () => {
  const facts = read('src/config/semanticFacts.ts');
  const pricing = read('src/config/pricing.ts');
  const publicFacts = read('src/config/publicFacts.ts');
  const schemas = read('src/lib/schemas.ts');
  assert.match(facts, /name: 'Tiny Steps Learning'/);
  assert.match(facts, /organizationName: 'Tiny Steps Learning'/);
  assert.match(facts, /coreAgeMin: 3/);
  assert.match(facts, /coreAgeMax: 12/);
  assert.match(facts, /const STANDARD_ONE_TO_ONE_DURATION_MINUTES = 35/);
  assert.match(facts, /const FREE_ASSESSMENT_DURATION_MINUTES = 35/);
  assert.match(facts, /const FREE_ASSESSMENT_PRICE_INR = 0/);
  assert.match(pricing, /export const PER_CLASS_PRICE = 400/);
  assert.match(pricing, /export const NEW_GROUP_CLASS_RATIO = '1:4'/);
  assert.match(pricing, /monthlyFee: 3000,\s*durationMinutes: 50/);
  assert.match(publicFacts, /oneToOnePerClassInr: SEMANTIC_FACTS\.pricing\.standardOneToOnePerClassInr/);
  assert.match(schemas, /founder: \{\s*'@type': 'Person'/);
  assert.match(schemas, /sameAs: \[\.\.\.FOUNDER_PUBLIC_PROFILE_URLS\]/);
  assert.match(schemas, /sameAs: \[\.\.\.ORGANIZATION_SAME_AS_URLS\]/);
});

test('Brick 10: specialist owners and conditional group-interest boundaries remain distinct', () => {
  const c2 = read('src/lib/commercialC2KeywordOwnership.ts');
  const group = read('src/pages/public/GroupClassPage.tsx');
  const s = read('src/pages/speaking.tsx');
  const grammar = read('src/pages/grammar.tsx');
  const phonics = read('src/pages/phonics.tsx');
  assert.match(c2, /id: 'reading-fluency'.*canonicalOwnerPath: '\/reading-fluency-program'/);
  assert.match(c2, /id: 'spoken-english-provider'.*canonicalOwnerPath: '\/spoken-english-classes-for-kids-online'/);
  assert.match(c2, /id: 'writing-provider'.*canonicalOwnerPath: '\/writing-classes-for-kids'/);
  assert.match(group, /group classes have a maximum of four children per teacher/);
  assert.match(group, /New groups are formed when children with compatible learning levels and schedules are available/);
  assert.match(group, /enquiryHref = .+\/book-demo\?format=small_group&program=/);
  for (const page of [s, grammar, phonics]) {
    assert.match(page, /up to four children per teacher/);
    assert.match(page, /1:1/);
  }
});
