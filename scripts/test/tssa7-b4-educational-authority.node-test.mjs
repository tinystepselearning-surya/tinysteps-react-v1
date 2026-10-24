import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

const root='artifacts/tssa7-b4/';
const read=name=>fs.readFileSync(root+name,'utf8');
const summary=JSON.parse(read('SUMMARY.json'));

test('B4 inventories all protected educational families without new routes',()=>{
 assert.equal(summary.total_source_corpus,168);
 assert.deepEqual(summary.groups,{
  editorial_blogs:83,programmatic_phonics_guides:31,
  programmatic_grammar_guides:38,vocabulary_authority_guides:16
 });
 assert.equal(summary.structural_phonics_teaching_minimum_met,31);
 assert.equal(summary.structural_grammar_vocab_reference_minimum_met,54);
 assert.equal(summary.high_priority_blog_sample,9);
 assert.equal(read('SOURCE_EDUCATIONAL_AUTHORITY_168.csv').trim().split('\n').length,169);
 assert.equal(read('PRIORITY_9_BLOG_SPOT_CHECK.csv').trim().split('\n').length,10);
});

test('discloses the limit between source metadata and verified educational expertise',()=>{
 assert.equal(summary.external_peer_review_status,'NOT_PERFORMED');
 assert.equal(summary.named_author_credentials_verified,false);
 assert.equal(summary.all_168_pedagogically_verified,false);
 assert.equal(summary.provider_index_and_ai_citations,'OUT_OF_SCOPE');
 assert.equal(summary.independent_sources_validated_for_app,2);
});

test('preschool page rejects unsupported board-sequence and universal-result claims',()=>{
 const source=fs.readFileSync('src/pages/public/PhonicsAppsPreschoolersIndiaPage.tsx','utf8');
 assert.doesNotMatch(source,/matches CBSE\/ICSE\/IB sound order and expectations/);
 assert.doesNotMatch(source,/will be effective\. If possible, choose apps/);
 assert.doesNotMatch(source,/10 minutes a day is plenty for preschoolers/i);
 assert.doesNotMatch(source,/decode words faster/);
 assert.doesNotMatch(source,/usually resolves with consistent practice/);
 assert.match(source,/do not prescribe one shared phonics sound order/);
 assert.match(source,/not a standardized diagnostic test/);
});

test('visible teaching reference links are independent and clearly bounded',()=>{
 const source=fs.readFileSync('src/pages/public/PhonicsAppsPreschoolersIndiaPage.tsx','utf8');
 assert.match(source,/https:\/\/educationendowmentfoundation\.org\.uk\/education-evidence\/teaching-learning-toolkit\/phonics\//);
 assert.match(source,/https:\/\/ies\.ed\.gov\/ncee\/wwc\/PracticeGuide\/21\/Published/);
 assert.match(source,/do not endorse Tiny Steps or evaluate any named app/);
 assert.match(source,/sat/);
 assert.match(source,/pat/);
 assert.doesNotMatch(source,/<meta[^>]*name="robots"[^>]*noindex/);
});

test('existing published canonical URL and presentation remain unchanged',()=>{
 const source=fs.readFileSync('src/pages/public/PhonicsAppsPreschoolersIndiaPage.tsx','utf8');
 assert.match(source,/canonicalPath:\s*'\/phonics-apps-for-preschoolers-india'/);
 assert.match(source,/mainEntity:\s*FAQS\.map/);
 assert.match(source,/ClusterSeoNav cluster="phonics"/);
 assert.match(source,/Book Free 35-Minute Demo/);
});
