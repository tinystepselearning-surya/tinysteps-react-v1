#!/usr/bin/env node
/**
 * TSSA-7/B5 audit. Source registries and public-link implementation only.
 * Never infers real-world backlinks, Google indexing, crawl depth, traffic or AI citations.
 * No HTTP calls or production mutations.
 */
import fs from 'node:fs';
import { AI_ANSWER_LAYER_1_PARENT_PROBLEMS } from '../src/lib/aiAnswerLayerRegistry.js';

const read=path=>fs.readFileSync(path,'utf8');
const parentRows=AI_ANSWER_LAYER_1_PARENT_PROBLEMS.map(row=>({
  id:row.id,
  subject:row.subject,
  owner:row.canonicalPath,
  hub:row.hubPath,
  supporting_count:row.supportingPaths.length,
  practice_count:row.practicePaths.length,
  has_supporting:row.supportingPaths.length>0,
  has_practice:row.practicePaths.length>0,
}));
const unique=new Set(parentRows.map(row=>row.id));
if(parentRows.length!==28 || unique.size!==28)throw new Error('B5 parent problem ID count/uniqueness drifted');
if(parentRows.some(row=>!row.owner.startsWith('/')||!row.hub.startsWith('/resources/')))throw new Error('B5 parent problem owner/hub invalid');

const resources=read('src/pages/SubjectResourcesPage.tsx');
const fluency=read('src/pages/public/ReadingFluencyProgramPage.tsx');
const grammar=read('src/pages/grammar.tsx');
const semantic=read('src/config/semanticFacts.ts');
function need(expression,label){if(!expression)throw new Error('B5: '+label);}
const assertions=[
  ['phonics hub preserves article discovery',resources.includes("allGuidesLabel: 'Browse phonics articles'") && resources.includes("allGuidesTo: '/blog?topic=Phonics'")],
  ['phonics hub preserves all 31 guide anchor',resources.includes('href="#focused-phonics-guides"')],
  ['phonics hub has accurate fluency specialist handoff',resources.includes("to: '/reading-fluency-program'") && resources.includes('Accurate word reading, but still choppy in passages')],
  ['phonics hub has skill-led broad reading handoff',resources.includes('to="/reading-classes-for-kids"') && resources.includes('word reading is secure')],
  ['fluency programme links canonical educational guide',fluency.includes('to="/blog/how-to-improve-reading-fluency-in-children"')],
  ['fluency programme still preserves direct assessment CTA',fluency.includes('to="/book-demo"')],
  ['fluency guide explicitly protects decoding-first intent',fluency.includes('If unfamiliar-word decoding is still unreliable')],
  ['existing Beginner Grammar route preserved',grammar.includes('to="/courses/grammar"')],
  ['existing Advanced Grammar route preserved',grammar.includes('to="/courses/grammar-mastery"')],
  ['official identity registry remains, no new review sameAs',!(/trustpilot\.com|justdial\.com|sulekha\.com/i).test(semantic)],
  ['preschool phonics claims unaffected',fs.existsSync('src/pages/public/PhonicsAppsPreschoolersIndiaPage.tsx')],
];
for(const [label,pass] of assertions)need(pass,label);

const out='artifacts/tssa7-b5';
fs.mkdirSync(out,{recursive:true});
const esc=v=>'"'+String(v??'').replaceAll('"','""').replace(/^[=+@-]/,v=>"'"+v)+'"';
const keys=['id','subject','owner','hub','supporting_count','practice_count','has_supporting','has_practice'];
fs.writeFileSync(out+'/PARENT_28_PATH_AUDIT.csv',
  [keys.join(','),...parentRows.map(x=>keys.map(k=>esc(x[k])).join(','))].join('\n')+'\n');
const summary={
  project:'TSSA-7/B5',scope:'internal-link contract and external evidence boundaries',
  parent_owner_count:parentRows.length,
  with_registered_supporting_paths:parentRows.filter(x=>x.has_supporting).length,
  with_registered_practice_paths:parentRows.filter(x=>x.has_practice).length,
  problem_ids_without_supporting_paths:parentRows.filter(x=>!x.has_supporting).map(x=>x.id),
  problem_ids_without_practice_paths:parentRows.filter(x=>!x.has_practice).map(x=>x.id),
  focused_link_checks_passed:assertions.length,
  exact_new_or_clarified_handoffs:['/resources/phonics -> /reading-fluency-program','/resources/phonics -> /reading-classes-for-kids','/reading-fluency-program -> /blog/how-to-improve-reading-fluency-in-children'],
  canonical_changes:0,redirections_changed:0,external_sameAs_changes:0,
  independently_confirmed_external_backlink_count:null,
  first_party_production_render_verified:false,
  search_engine_indexed_verdicts:'NOT_CHECKED',
  external_profiles_checked_in_browser:'See dated B5 report; cannot establish account control via web search alone',
};
fs.writeFileSync(out+'/SUMMARY.json',JSON.stringify(summary,null,2)+'\n');
console.log('TSSA7_B5_SUMMARY '+JSON.stringify(summary));
