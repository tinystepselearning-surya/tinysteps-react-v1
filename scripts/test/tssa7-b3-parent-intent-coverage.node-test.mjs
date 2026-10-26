import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const dir = 'artifacts/tssa7-b3';
const read = path => fs.readFileSync(path, 'utf8');
const extract = name => {
  const rows = read(dir + '/' + name).trim().split('\n');
  return rows;
};

test('intent audit preserves 279 historical owners and isolates approved additions', () => {
  const summary = JSON.parse(read(dir + '/SUMMARY.json'));
  assert.equal(summary.historical_corpus_owners, 279);
  assert.equal(summary.new_phonics_age_corpus_owners, 4);
  assert.equal(summary.new_group_corpus_owners, 3);
  assert.equal(summary.corpus_owners, 279 + 4 + 3);
  assert.equal(summary.parent_intents, 28);
  assert.equal(summary.benchmark_intents, 12);
  assert.equal(summary.commercial_intents, 9);
  assert.equal(summary.owner_errors, 0);
  assert.equal(summary.provider_indexing_verdict, 'UNVERIFIED');
  assert.equal(summary.native_ai_citation_verdict, 'UNVERIFIED');
  assert.equal(extract('PARENT_INTENT_28.csv').length, 29);
  assert.equal(extract('BENCHMARK_12.csv').length, 13);
  assert.equal(extract('COMMERCIAL_INTENTS.csv').length, 10);
});

test('all seven course ages and 245 lessons remain sourced from curriculum', () => {
  const summary = JSON.parse(read(dir + '/SUMMARY.json'));
  assert.equal(summary.curriculum_levels, 7);
  assert.equal(summary.structured_lessons, 245);
  assert.equal(extract('SEVEN_COURSE_STAGES.csv').length, 8);
  const source = read('src/pages/CoursesPage.tsx');
  assert.match(source, /SEMANTIC_FACTS\.programmes\.phonics\.levels\.foundations\.ageRange\.label/);
  assert.match(source, /SEMANTIC_FACTS\.programmes\.phonics\.levels\.early\.ageRange\.label/);
  assert.doesNotMatch(source, /age: 'Age: 3–5'/);
  assert.doesNotMatch(source, /age: 'Age: 4–7'/);
});

test('high-intent commercial pages retain distinct programme, comparison and pricing ownership', () => {
  const csv = read(dir + '/COMMERCIAL_INTENTS.csv');
  assert.match(csv, /online-phonics-classes[^\n]*\/phonics/);
  assert.match(csv, /best-online-phonics-classes[^\n]*\/best-online-phonics-classes-for-kids-in-india/);
  assert.match(csv, /phonics-prices[^\n]*\/phonics-fees-india/);
  assert.match(csv, /public-speaking-classes[^\n]*\/speaking/);
});

test('B3 does not change public URL declarations, robots, redirects or the assessment form', () => {
  const source = read('scripts/tssa7-b3-parent-intent-coverage.mjs');
  assert.match(source, /SOURCE_OWNER_VALID/);
  assert.match(source, /SOURCE_OWNER_VALID|HANDOFF_REVIEW/);
  assert.doesNotMatch(source, /firebase deploy|firestore|writeFileSync\(['"]src\//);
});
