import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Grammar and Sentence Formation retain their frozen commercial owner', () => {
  const owner = read('src/lib/commercialC2KeywordOwnership.ts');
  const route = read('src/lib/publicRouteManifest.js');
  const seo = read('src/lib/routeSeoRegistry.js');
  const grammar = read('src/pages/grammar.tsx');
  assert.match(owner, /id: 'grammar-provider'.*canonicalOwnerPath: '\/grammar'/);
  assert.match(owner, /forbiddenPrimaryClaimants: \['\/courses\/grammar'/);
  assert.match(owner, /canonicalOwnerPath: '\/writing-classes-for-kids'/);
  assert.match(route, /route\('\/grammar', 'static'\)/);
  assert.match(route, /route\('\/group-grammar-classes-for-kids', 'static'\)/);
  assert.match(grammar, /const canonicalPath = '\/grammar'/);
  assert.match(grammar, /const seoTitle = 'Online Grammar Classes for Kids \| Live 1:1 \| Tiny Steps'/);
  assert.match(seo, /'\/grammar': \{\s*title: 'Online Grammar Classes for Kids \| Live 1:1 \| Tiny Steps'/);
});

test('Grammar FAQ describes actual sentence transfer instead of rote rule memorisation', () => {
  const s = read('src/pages/grammar.tsx');
  assert.match(s, /question: 'Can grammar classes improve sentence formation\?'/);
  assert.match(s, /teacher models a sentence pattern, guides word order, tense or punctuation corrections/);
  assert.match(s, /create a fresh sentence with less prompting/);
  assert.match(s, /application rather than only memorising a grammar rule/);
  assert.match(s, /const faqSchema = \{/);
  assert.match(s, /createFAQPageSchema\(faqItems\)/);
});

test('Grammar 1:1 vs group FAQ matches source-backed conditional group rules', () => {
  const grammar = read('src/pages/grammar.tsx');
  const group = read('src/pages/public/GroupClassPage.tsx');
  assert.match(grammar, /Are Tiny Steps grammar classes available as live 1:1 or small groups\?/);
  assert.match(grammar, /Standard live 1:1 grammar classes run for \$\{PUBLIC_SESSION_DURATION_LABEL\}/);
  assert.match(grammar, /up to four children per teacher/);
  assert.match(grammar, /a group demo or place is not confirmed until a suitable batch forms/);
  assert.match(group, /group classes have a maximum of four children per teacher/);
  assert.match(group, /New groups are formed when children with compatible learning levels and schedules are available/);
  assert.match(grammar, /to="\/group-grammar-classes-for-kids"/);
  assert.match(grammar, /to="\/book-demo"/);
  assert.match(grammar, /to="\/pricing"/);
});

test('Grammar programme age placement and distinct Writing and Fluency boundaries remain', () => {
  const s = read('src/pages/grammar.tsx');
  assert.match(s, /Beginner Grammar is designed for ages 5–10 and Advanced Grammar for ages 8–12/);
  assert.match(s, /What is the difference between grammar classes and writing classes\?/);
  assert.match(s, /to="\/writing-classes-for-kids"/);
});
