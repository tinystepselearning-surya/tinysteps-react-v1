import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseCsv, reconcile, TARGET_PLATFORMS } from '../tssa7-b6-native-benchmark.mjs';

const root = 'docs/seo/ai-answer-engines/';
const original = parseCsv(fs.readFileSync(root +
  'native-audit-2026-10-19/EVALUATION_48.csv', 'utf8'));
const plan = parseCsv(fs.readFileSync(root + 'E4_NATIVE_12x4_SESSION_MATRIX_2026-10-19.csv','utf8'));

test('CSV parser preserves quoted commas, escaped quotes and line breaks', () => {
  assert.deepEqual(parseCsv('a,b\n"x,y","hello ""world""\nmore"\n'),
    [{a:'x,y',b:'hello "world"\nmore'}]);
  assert.throws(()=>parseCsv('a,b\n"broken,a'), /Unterminated/);
  assert.throws(()=>parseCsv('a,b\n1\n'), /width drift/);
});

test('native evidence anchors 12 prompts and historical records without treating Bing as observed', () => {
  const {summary, comparative, followup, competitorLabels} = reconcile(original,plan,true);
  assert.deepEqual(TARGET_PLATFORMS,['ChatGPT Search','Gemini','Google AI Mode','Bing/Copilot']);
  assert.equal(comparative.length,48);
  assert.equal(followup.length,48);
  assert.equal(competitorLabels.length,36);
  assert.equal(summary.historical_completed_answers,36);
  assert.equal(summary.historical_unavailable,12);
  assert.equal(summary.new_native_sessions_in_this_brick,0);
  assert.equal(summary.current_cross_provider_citation_rate,null);
  const m=new Map(summary.target_platforms.map(x=>[x.platform,x]));
  assert.deepEqual(m.get('ChatGPT Search').historical_completed,12);
  assert.deepEqual(m.get('Gemini').no_visible_citation,10);
  assert.equal(m.get('Google AI Mode').correct_owner,1);
  assert.equal(m.get('Google AI Mode').different_target,2);
  assert.equal(m.get('Bing/Copilot').historical_completed,0);
  assert.equal(m.get('Bing/Copilot').exact_owner_per_completed,null);
  assert.ok(followup.every(x=>x.new_test_status==='NOT_TESTED' &&
    !x.captured_at_ist && !x.clicked_tiny_steps_url));
  const p05=comparative.find(x=>x.prompt_id==='P05' && x.platform==='Google AI Mode');
  assert.match(p05.citation_destination,/^https:\/\/medium\.com\//);
  assert.equal(p05.historical_status,'TINY_STEPS_CITED_WRONG_URL');
});

test('reject duplicate or missing evidence, invented citation success, changed prompt, changed canonical',()=>{
  const replace=(id,platform,field,val)=>original.map(x=>x.prompt_id===id&&x.platform===platform?
    {...x,[field]:val}:x);
  assert.throws(()=>reconcile([...original,original[0]],plan),/matrix count changed/);
  assert.throws(()=>reconcile(replace('P01','Google AI Mode','test_status','NEW_ENGINE_SUCCESS'),plan),/unknown status/);
  assert.throws(()=>reconcile(replace('P01','Google AI Mode','cited_tiny_steps_url','https://example.com'),plan),
    /unverified exact citation/);
  assert.throws(()=>reconcile(replace('P01','ChatGPT Search','captured_at_ist',''),plan),
    /missing completed-answer provenance/);
  assert.throws(()=>reconcile(replace('P01','Gemini','exact_prompt','Tiny Steps best phonics'),plan),
    /prompt changed/);
  assert.throws(()=>reconcile(replace('P02','ChatGPT Search','expected_owner','https://tinystepslearning.com/blog/another'),plan),
    /canonical owner changed/);
});

test('generated output remains historical, provenance-linked, and without site changes',()=>{
  execFileSync('node',['scripts/tssa7-b6-native-benchmark.mjs'],{encoding:'utf8'});
  const summary=JSON.parse(fs.readFileSync('artifacts/tssa7-b6/SUMMARY.json','utf8'));
  const compared=parseCsv(fs.readFileSync('artifacts/tssa7-b6/HISTORICAL_12X4_RECONCILIATION.csv','utf8'));
  const future=parseCsv(fs.readFileSync('artifacts/tssa7-b6/FRESH_NATIVE_SESSION_TEMPLATE.csv','utf8'));
  assert.equal(summary.new_native_sessions_in_this_brick,0);
  assert.equal(compared.length,48);
  assert.equal(future.length,48);
  assert.equal(compared.filter(x=>x.platform==='Bing/Copilot' &&
    x.historical_status==='NOT_TESTED').length,12);
  assert.ok(compared.every(x=>x.expected_owner.startsWith('https://tinystepslearning.com/blog/')));
  assert.ok(future.every(x=>x.native_session_url==='' && x.evidence_file_paths===''));
  assert.equal(summary.target_platforms.find(x=>x.platform==='Bing/Copilot').any_observed_tiny_steps_source_per_completed,null);
});
