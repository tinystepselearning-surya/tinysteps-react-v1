import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('single canonical brand and founder fact sources remain in place', () => {
  const facts = read('src/config/semanticFacts.ts');
  const schema = read('src/lib/schemas.ts');
  const founder = read('src/pages/FounderPriyaPage.tsx');
  assert.match(facts, /name: 'Tiny Steps Learning'/);
  assert.match(facts, /organizationName: 'Tiny Steps Learning'/);
  assert.match(facts, /fullName: 'Vannala Ravali Priya'/);
  assert.match(facts, /profilePath: '\/team\/vannala-ravali-priya'/);
  assert.match(facts, /export const FOUNDER_PUBLIC_PROFILE_URLS = SEMANTIC_FACTS\.founder\.publicProfiles\.map\(/);
  assert.ok(schema.includes('export const FOUNDER_ID = '));
  assert.ok(schema.includes('FOUNDER_PROFILE_URL}#person'));
  assert.ok(schema.includes('export const ORGANIZATION_ID = '));
  assert.match(founder, /sameAs: \[\.\.\.FOUNDER_PUBLIC_PROFILE_URLS\]/);
  assert.match(founder, /worksFor: \{\s*'@id': ORGANIZATION_ID/);
});

test('organisation founder Person reuses public founder profiles, not company accounts', () => {
  const schema = read('src/lib/schemas.ts');
  const start = schema.indexOf('export const organizationSchema = {');
  const end = schema.indexOf('export const websiteSchema = {', start);
  assert.ok(start >= 0 && end > start);
  const org = schema.slice(start, end);
  const founderStart = org.indexOf('  founder: {');
  const founderEnd = org.indexOf('  description:', founderStart);
  assert.ok(founderStart >= 0 && founderEnd > founderStart);
  const person = org.slice(founderStart, founderEnd);
  assert.match(person, /'@id': FOUNDER_ID/);
  assert.match(person, /sameAs: \[\.\.\.FOUNDER_PUBLIC_PROFILE_URLS\]/);
  assert.match(person, /url: FOUNDER_PROFILE_URL/);
  assert.match(org, /sameAs: \[\.\.\.ORGANIZATION_SAME_AS_URLS\]/);
  assert.equal((org.match(/sameAs:/g)||[]).length, 2, 'distinct founder and organisation profile arrays');
  assert.equal((schema.match(/foundingDate: '2020'/g)||[]).length, 1, 'founding-date source claim unchanged pending verification');
});

test('profile references are sourced from existing public URLs without new external addresses', () => {
  const facts = read('src/config/semanticFacts.ts');
  const schema = read('src/lib/schemas.ts');
  assert.match(facts, /'https:\/\/www\.linkedin\.com\/in\/ravali-priya-vannala\/'/);
  assert.match(facts, /'https:\/\/www\.instagram\.com\/vannala_ravalipriya\/'/);
  assert.doesNotMatch(schema, /https:\/\/(?:www\.)?(?:instagram|linkedin)\.com\/(?:in\/|@)[^\s'"]+/i);
  assert.match(schema, /name: PUBLIC_FACTS\.organizationName/);
});
