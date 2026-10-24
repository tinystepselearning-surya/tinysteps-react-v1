#!/usr/bin/env node
/**
 * TSSA-7/B6: reconcile historic native AI evidence without fabricating fresh answers.
 * This command does not make network requests or mutate website/production data.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = 'docs/seo/ai-answer-engines/';
const SOURCE = ROOT + 'native-audit-2026-10-19/EVALUATION_48.csv';
const ORIGINAL_PLAN = ROOT + 'E4_NATIVE_12x4_SESSION_MATRIX_2026-10-19.csv';
const OUTPUT = 'artifacts/tssa7-b6';
export const TARGET_PLATFORMS = ['ChatGPT Search', 'Gemini', 'Google AI Mode', 'Bing/Copilot'];
export const HISTORICAL_PLATFORMS = ['ChatGPT Search', 'Gemini', 'Google AI Mode', 'Perplexity'];
const ALL_STATUSES = new Set([
  'TINY_STEPS_CITED_CORRECT_URL', 'TINY_STEPS_CITED_WRONG_URL',
  'THIRD_PARTY_ONLY', 'NO_CITATION', 'NOT_TESTED'
]);
const COMPLETED = new Set([...ALL_STATUSES].filter(x => x !== 'NOT_TESTED'));

export function parseCsv(content) {
  const out = [];
  let row = [], value = '', quote = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (quote) {
      if (ch === '"' && content[i + 1] === '"') { value += '"'; i++; }
      else if (ch === '"') quote = false;
      else value += ch;
    } else if (ch === '"') quote = true;
    else if (ch === ',') { row.push(value); value = ''; }
    else if (ch === '\n') { row.push(value); out.push(row); row = []; value = ''; }
    else if (ch !== '\r') value += ch;
  }
  if (quote) throw new Error('Unterminated quoted CSV value');
  if (row.length || value) { row.push(value); out.push(row); }
  if (!out.length) throw new Error('Empty CSV');
  const header = out.shift();
  if (new Set(header).size !== header.length) throw new Error('Duplicate CSV headers');
  return out.map((fields, i) => {
    if (fields.length !== header.length) throw new Error('CSV width drift on row ' + (i + 2));
    return Object.fromEntries(header.map((k, n) => [k, fields[n]]));
  });
}

function csv(rows, fields) {
  const esc = value => '"' + String(value ?? '').replaceAll('"','""').replace(/^[=+\-@]/, "'$&") + '"';
  return fields.join(',') + '\n' + rows.map(row => fields.map(k => esc(row[k])).join(',')).join('\n') + '\n';
}

function ensure(test, reason) { if (!test) throw new Error('TSSA-7/B6: ' + reason); }
function expectedOwner(url) {
  try { const parsed = new URL(url); return parsed.hostname === 'tinystepslearning.com' &&
    parsed.pathname.startsWith('/blog/') && !parsed.search && !parsed.hash; }
  catch { return false; }
}

export function reconcile(evidence, plan, checkFiles = false) {
  ensure(evidence.length === 48 && plan.length === 48, 'historical 12x4 matrix count changed');
  const ids = Array.from({length:12}, (_,i) => 'P' + String(i + 1).padStart(2, '0'));
  const oldMap = new Map(), planning = new Map(), owners = new Map();
  for (const row of plan) {
    const key = row.prompt_id + '|' + row.platform;
    ensure(ids.includes(row.prompt_id) && HISTORICAL_PLATFORMS.includes(row.platform), 'unexpected planned prompt/platform');
    ensure(!planning.has(key), 'duplicate original plan ' + key);
    ensure(expectedOwner(row.expected_owner), 'original canonical owner invalid ' + key);
    planning.set(key,row);
  }
  for (const row of evidence) {
    const key = row.prompt_id + '|' + row.platform;
    ensure(planning.has(key), 'unplanned historical native cell ' + key);
    ensure(!oldMap.has(key), 'duplicate historical cell ' + key);
    ensure(ALL_STATUSES.has(row.test_status), 'unknown status ' + key);
    ensure(row.exact_prompt === planning.get(key).prompt, 'prompt changed ' + key);
    ensure(row.expected_owner === planning.get(key).expected_owner, 'canonical owner changed ' + key);
    if (!owners.has(row.prompt_id)) owners.set(row.prompt_id, row.expected_owner);
    ensure(owners.get(row.prompt_id) === row.expected_owner, 'cross-provider owner drift ' + key);
    if (COMPLETED.has(row.test_status)) {
      ensure(row.native_answer_observed === 'yes' && row.captured_at_ist, 'missing completed-answer provenance ' + key);
      ensure(row.evidence, 'no evidence pointer for ' + key);
      if (checkFiles) for (const p of row.evidence.split(';').map(x => x.trim())) {
        ensure(p.startsWith('evidence/') && !p.includes('..'), 'untrusted evidence path ' + p);
        ensure(fs.existsSync(path.join(ROOT, 'native-audit-2026-10-19', p)), 'evidence file missing ' + p);
      }
    } else ensure(row.native_answer_observed !== 'yes', 'uncompleted result claims an answer ' + key);
    if (row.test_status === 'TINY_STEPS_CITED_CORRECT_URL')
      ensure(row.cited_tiny_steps_url === row.expected_owner &&
        row.clickable_tiny_steps_citation === 'yes', 'unverified exact citation ' + key);
    if (row.test_status === 'TINY_STEPS_CITED_WRONG_URL')
      ensure(row.cited_tiny_steps_url &&
        row.cited_tiny_steps_url !== row.expected_owner &&
        row.clickable_tiny_steps_citation === 'yes', 'unverified different target ' + key);
    if (row.test_status === 'NO_CITATION' || row.test_status === 'THIRD_PARTY_ONLY')
      ensure(!row.cited_tiny_steps_url, 'misassigned citation for ' + key);
    oldMap.set(key,row);
  }
  ensure(planning.size === 48 && oldMap.size === 48 && owners.size === 12, 'matrix incomplete');
  const summary = {project:'TSSA-7/B6', audit_date_ist:'2026-10-25',
    provenance:'Historical genuine native session records from 19 October 2026, merged PR #754',
    new_native_sessions_in_this_brick:0, current_cross_provider_citation_rate:null,
    source_count:48, historical_completed_answers:0, historical_unavailable:0,
    target_platforms:[], evidence_caveats:[
      'This is a historical cohort; no fresh 25 October platform sessions were executed.',
      'Bing/Copilot has no individual native session evidence in this dataset, so its denominator is zero.',
      'Original Perplexity 12 blocked/unsubmitted cells remain in PR #754 but are excluded from the target four-engine matrix.',
      'Incomplete ChatGPT source disclosures and Gemini unexpanded source URLs constrain absence/competitor claims.',
      'Different target may be a relevant Tiny Steps guide or Medium syndication, not an incorrect canonical.',
      'Web search, robots eligibility, GSC impressions, Bing Webmaster citation aggregates and AI native answers are distinct evidence types.'
    ]};
  const comparative = [], followup = [], competitorLabels = [];
  for (const id of ids) for (const platform of TARGET_PLATFORMS) {
    const old = oldMap.get(id + '|' + platform);
    const planRow = planning.get(id + '|ChatGPT Search');
    const cell = {prompt_id:id, platform, prompt:planRow.prompt,
      expected_owner:owners.get(id),
      observation_cohort:old?'2026-10-19_PR754_NATIVE':'NO_NATIVE_SESSION',
      historical_status:old?.test_status ?? 'NOT_TESTED',
      observed_at_ist:old?.captured_at_ist ?? '',
      citation_destination:old?.cited_tiny_steps_url ?? '',
      quality_review_label:old?.answer_quality ?? 'NOT_EVALUATED',
      citation_inspection:old?.citation_inspection_complete ?? 'NOT_TESTED',
      source_label_text:old?.other_cited_sources ?? '',
      evidence_pointer:old?.evidence ?? '',
      observation_limit:old?.limitation ?? 'Bing/Copilot native answers not tested'
    };
    comparative.push(cell);
    followup.push({prompt_id:id,platform,exact_prompt:planRow.prompt,
      expected_owner:owners.get(id),new_test_status:'NOT_TESTED',
      captured_at_ist:'',native_session_url:'',actual_region:'',account_and_mode:'',
      clicked_tiny_steps_url:'',other_cited_source_urls:'',educational_accuracy_notes:'',
      complete_citation_disclosure:'',evidence_file_paths:'',limitations:''});
    if(old && COMPLETED.has(old.test_status)) competitorLabels.push({
      prompt_id:id,platform,other_source_labels_as_written:old.other_cited_sources,
      label_verification:'NOT_INDEPENDENTLY_VERIFIED',
      comparative_rank:'NOT_MEASURED'
    });
  }
  summary.target_platforms = TARGET_PLATFORMS.map(platform => {
    const rows=comparative.filter(x=>x.platform===platform);
    const count=status=>rows.filter(x=>x.historical_status===status).length;
    const completed=rows.filter(x=>COMPLETED.has(x.historical_status)).length;
    summary.historical_completed_answers+=completed;
    summary.historical_unavailable+=count('NOT_TESTED');
    return {platform,total_prompts:12,historical_completed:completed,not_tested:count('NOT_TESTED'),
      correct_owner:count('TINY_STEPS_CITED_CORRECT_URL'),
      different_target:count('TINY_STEPS_CITED_WRONG_URL'),
      third_party_only:count('THIRD_PARTY_ONLY'),no_visible_citation:count('NO_CITATION'),
      exact_owner_per_completed:completed?count('TINY_STEPS_CITED_CORRECT_URL')/completed:null,
      any_observed_tiny_steps_source_per_completed:completed?
        (count('TINY_STEPS_CITED_CORRECT_URL')+count('TINY_STEPS_CITED_WRONG_URL'))/completed:null};
  });
  ensure(summary.historical_completed_answers===36 &&
    summary.historical_unavailable===12, 'historical 36/12 breakdown drifted');
  ensure(summary.target_platforms.find(x=>x.platform==='Google AI Mode').correct_owner===1 &&
    summary.target_platforms.find(x=>x.platform==='Google AI Mode').different_target===2, 'verified AI Mode citation breakdown drifted');
  return {summary, comparative, followup, competitorLabels};
}

export function run() {
  const result = reconcile(parseCsv(fs.readFileSync(SOURCE,'utf8')),
    parseCsv(fs.readFileSync(ORIGINAL_PLAN,'utf8')), true);
  fs.mkdirSync(OUTPUT,{recursive:true});
  fs.writeFileSync(OUTPUT+'/HISTORICAL_12X4_RECONCILIATION.csv',
    csv(result.comparative,['prompt_id','platform','prompt','expected_owner','observation_cohort',
    'historical_status','observed_at_ist','citation_destination','quality_review_label',
    'citation_inspection','source_label_text','evidence_pointer','observation_limit']));
  fs.writeFileSync(OUTPUT+'/FRESH_NATIVE_SESSION_TEMPLATE.csv',
    csv(result.followup,['prompt_id','platform','exact_prompt','expected_owner','new_test_status',
    'captured_at_ist','native_session_url','actual_region','account_and_mode',
    'clicked_tiny_steps_url','other_cited_source_urls','educational_accuracy_notes',
    'complete_citation_disclosure','evidence_file_paths','limitations']));
  fs.writeFileSync(OUTPUT+'/OTHER_SOURCE_LABELS_UNVERIFIED.csv',
    csv(result.competitorLabels,['prompt_id','platform','other_source_labels_as_written',
    'label_verification','comparative_rank']));
  fs.writeFileSync(OUTPUT+'/SUMMARY.json',JSON.stringify(result.summary,null,2)+'\n');
  console.log('TSSA7_B6_SUMMARY '+JSON.stringify(result.summary));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
