import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
const read=path=>fs.readFileSync(path,'utf8');
const summary=JSON.parse(read('artifacts/tssa7-b5/SUMMARY.json'));
test('all 28 registered parent question owners have source/hub provenance',()=>{
 assert.equal(summary.parent_owner_count,28);
 assert.equal(read('artifacts/tssa7-b5/PARENT_28_PATH_AUDIT.csv').trim().split('\n').length,29);
 assert.equal(summary.focused_link_checks_passed,11);
 assert.equal(summary.canonical_changes,0);
 assert.equal(summary.external_sameAs_changes,0);
});
test('source records disclose actual supporting and practice coverage rather than pretending 28/28',()=>{
 assert.equal(summary.with_registered_supporting_paths+summary.problem_ids_without_supporting_paths.length,28);
 assert.equal(summary.with_registered_practice_paths+summary.problem_ids_without_practice_paths.length,28);
 assert.equal(summary.independently_confirmed_external_backlink_count,null);
 assert.equal(summary.search_engine_indexed_verdicts,'NOT_CHECKED');
});
test('fluent reader handoff is skill-led and links existing canonical guidance',()=>{
 const resources=read('src/pages/SubjectResourcesPage.tsx');
 assert.match(resources,/to: '\/reading-fluency-program'/);
 assert.match(resources,/to="\/reading-classes-for-kids"/);
 assert.match(resources,/to: '\/blog\/how-to-improve-reading-fluency-in-children'/);
 assert.match(resources,/href="#focused-phonics-guides"/);
 assert.match(resources,/allGuidesLabel: 'Browse phonics articles'/);
 const specialist=read('src/pages/public/ReadingFluencyProgramPage.tsx');
 assert.match(specialist,/to="\/blog\/how-to-improve-reading-fluency-in-children"/);
 assert.match(specialist,/to="\/book-demo"/);
 assert.match(specialist,/If unfamiliar-word decoding is still unreliable/);
});
test('preserve grammar and official profile identities without invented authority',()=>{
 const grammar=read('src/pages/grammar.tsx');
 assert.match(grammar,/to="\/courses\/grammar"/);
 assert.match(grammar,/to="\/courses\/grammar-mastery"/);
 const profiles=read('src/config/semanticFacts.ts');
 assert.doesNotMatch(profiles,/trustpilot\.com|justdial\.com|sulekha\.com/i);
});
