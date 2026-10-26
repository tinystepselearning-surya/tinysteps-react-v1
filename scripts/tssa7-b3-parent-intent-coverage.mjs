#!/usr/bin/env node
/**
 * TSSA-7/B3 — repeatable, first-party source architecture audit only.
 * Run after scripts/generate-rss.mjs and tssa7-b1-content-authority-ledger.mjs.
 * Does not create URLs, edit public HTML, submit indexing requests, or rank pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { AI_ANSWER_LAYER_1_PARENT_PROBLEMS } from '../src/lib/aiAnswerLayerRegistry.js';
import { PUBLIC_REDIRECT_MANIFEST } from '../src/lib/publicRouteManifest.js';
import { RESOURCE_ECOSYSTEM_REGISTRY } from '../src/lib/resourcesArchitectureRegistry.js';
import { PHONICS_AGE_PROGRAMME_PATHS } from '../src/lib/phonicsAgeProgrammeRegistry.js';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'artifacts/tssa7-b3');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const fail = msg => { throw Error('TSSA-7/B3 ' + msg); };
const index = JSON.parse(read('public/ai-resource-index.json'));
const families = Object.values(index.corpus).filter(Array.isArray).flat();
const byPath = new Map(families.map(entry => [new URL(entry.canonical_url).pathname, entry]));
// Keep the historical 279-owner baseline frozen (19 October 2026).
// Later approved Phonics age programmes AND group commercial pages are
// separate present-day additions, not retroactively historical owners.
const groupPagePaths = [
  '/group-phonics-classes-for-kids',
  '/group-grammar-classes-for-kids',
  '/group-public-speaking-classes-for-kids',
];
const approvedNewPaths = [...PHONICS_AGE_PROGRAMME_PATHS, ...groupPagePaths];
const addedOwners = new Set(approvedNewPaths);
const currentAddedPaths = new Set(approvedNewPaths.filter(route => byPath.has(route)));
const historicalOwners = new Set([...byPath.keys()].filter(route => !addedOwners.has(route)));
const expectedCurrentOwners = 279 + approvedNewPaths.length;
if (addedOwners.size !== approvedNewPaths.length ||
    families.length !== expectedCurrentOwners ||
    byPath.size !== expectedCurrentOwners ||
    historicalOwners.size !== 279 ||
    currentAddedPaths.size !== approvedNewPaths.length) {
  fail('expected 279 historical canonical owners plus four approved Phonics age pages and three group commercial pages');
}
const redirects = new Set(PUBLIC_REDIRECT_MANIFEST.map(x => x.source));
const validPath = p => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !/[?#]/.test(p);
const verifyOwner = (owner, id) => {
  if (!validPath(owner)) fail(id + ' has invalid canonical path ' + owner);
  if (redirects.has(owner)) fail(id + ' points to redirect alias ' + owner);
  const record = byPath.get(owner);
  if (!record) fail(id + ' has no published corpus owner ' + owner);
  if (record.indexing_state !== 'indexable') fail(id + ' points to intentionally noindex owner ' + owner);
  return record;
};
const csvRows = str => {
  const records=[];let row=[],field='',quoted=false;
  for(let i=0;i<str.length;i++){const c=str[i];
    if(c==='"'&&quoted&&str[i+1]==='"'){field+='"';i++;}
    else if(c==='"')quoted=!quoted;
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&str[i+1]==='\n')i++;row.push(field);field='';if(row.some(Boolean))records.push(row);row=[];}
    else field+=c;
  }
  if(field||row.length){row.push(field);records.push(row);}
  if(quoted) fail('unclosed CSV quote');
  const [cols,...data]=records;return data.map(cells=>Object.fromEntries(cols.map((k,i)=>[k,cells[i]||''])));
};
const b1Parents=csvRows(read('artifacts/tssa7-b1/PARENT_PROBLEM_OWNER_MAP.csv'));
const b1Benchmarks=csvRows(read('artifacts/tssa7-b1/PRIORITY_12_CANONICAL_OWNERS.csv'));
if(b1Parents.length!==28||AI_ANSWER_LAYER_1_PARENT_PROBLEMS.length!==28||b1Benchmarks.length!==12)fail('established 28+12 intent baselines changed; review explicitly');
const sourceOwners=new Map(AI_ANSWER_LAYER_1_PARENT_PROBLEMS.map(x=>[x.id,x]));
if(sourceOwners.size!==28)fail('duplicate parent-problem ID');
const subjectPolicy={
 'phonics-reading':{programme:'/phonics',hub:'/resources/phonics',placement:'Check taught letter-sound correspondences, blending and decoding accuracy first; separate word accuracy from fluency and comprehension; do not place by age alone.'},
 'grammar-writing':{programme:'/grammar',hub:'/resources/grammar',placement:'Check independent sentence production, rule transfer and editing before recommending beginner or advanced grammar; do not place by age alone.'},
 'speaking-communication':{programme:'/speaking',hub:'/resources/speaking',placement:'Check response independence, conversational depth, storytelling and audience skills before placing a child; age is only a guide.'},
};
const rows=b1Parents.map(row=>{
 const p=sourceOwners.get(row.parent_problem_id);
 if(!p||p.query!==row.parent_question)fail('B1 parent map diverged '+row.parent_problem_id);
 const owner=new URL(row.canonical_owner).pathname;
 if(owner!==p.canonicalPath)fail('B1 owner differs from current registry: '+p.id);
 verifyOwner(owner,p.id);
 const policy=subjectPolicy[p.subject];if(!policy)fail('unreviewed parent subject '+p.subject);
 verifyOwner(policy.programme,'programme '+p.subject);
 const handoffs=[...(p.supportingPaths||[]),...(p.practicePaths||[])];
 const invalidHandoffs=handoffs.filter(x=>!validPath(x)||redirects.has(x)||!byPath.has(x));
 return {id:p.id,subject:p.subject,question:p.query,intent:'parent-problem',primary_owner:owner,
   owner_state:p.ownershipState,programme_path:policy.programme,subject_hub:policy.hub,
   placement_principle:policy.placement,source_answer_available:Boolean(p.answer),
   followup_paths:handoffs,unregistered_handoffs:invalidHandoffs,
   review_state:invalidHandoffs.length?'HANDOFF_REVIEW':'SOURCE_OWNER_VALID'};
});
const benchmark=new Map();
for(const row of b1Benchmarks){
 if(benchmark.has(row.question_id))fail('duplicate benchmark '+row.question_id);
 const owner=new URL(row.canonical_owner).pathname;verifyOwner(owner,'benchmark '+row.question_id);
 benchmark.set(row.question_id,{id:row.question_id,question:row.parent_question,primary_owner:owner,intent:'parent-question',
    evidence:'SOURCE_OWNER_ONLY_NOT_A_VERIFIED_NATIVE_AI_CITATION'});
}
if(benchmark.size!==12)fail('benchmark set changed');
const commercial=[
 ['online-phonics-classes','online phonics classes for kids','/phonics','programme'],
 ['best-online-phonics-classes','best online phonics classes for kids in India','/best-online-phonics-classes-for-kids-in-india','comparison'],
 ['phonics-prices','phonics class fees in India','/phonics-fees-india','pricing'],
 ['reading-classes','reading classes for kids','/reading-classes-for-kids','programme'],
 ['grammar-classes','online grammar classes for kids','/grammar','programme'],
 ['public-speaking-classes','public speaking classes for kids','/speaking','programme'],
 ['spoken-english-classes','spoken English classes for kids online','/spoken-english-classes-for-kids-online','programme'],
 ['writing-classes','writing classes for kids','/writing-classes-for-kids','programme'],
 ['early-phonics-age','phonics for young children aged 3 to 7','/courses/phonics-foundation','stage'],
].map(([id,query,owner,intent])=>({id,query,primary_owner:owner,intent}));
const protectedRouteOwners=new Map(RESOURCE_ECOSYSTEM_REGISTRY.map(x=>[x.path,x]));
for(const c of commercial){
 verifyOwner(c.primary_owner,'commercial '+c.id);
 if(c.intent!=='stage'&&!protectedRouteOwners.has(c.primary_owner)) fail('missing protected intent registry '+c.id);
}
if(new Set(commercial.map(x=>x.id)).size!==commercial.length)fail('duplicate commercial intent IDs');
const facts=read('src/config/semanticFacts.ts');
const stages=[...facts.matchAll(/publicSlug:\s*'([^']+)'[\s\S]{0,250}?ageRange:\s*\{\s*min:\s*(\d+),\s*max:\s*(\d+),\s*label:\s*'([^']+)'\s*\}[\s\S]{0,100}?lessonCount:\s*(\d+)/g)]
 .map(m=>({slug:m[1],age_min:+m[2],age_max:+m[3],age_label:m[4],lessons:+m[5]}));
if(stages.length!==7||stages.reduce((n,x)=>n+x.lessons,0)!==245)fail('seven level/245 curriculum baseline drift');
if(stages.some(x=>x.age_min<3||x.age_max>12||x.age_min>x.age_max))fail('course age range outside published brand scope');
const courses=read('src/pages/CoursesPage.tsx');
const labels=[
 'SEMANTIC_FACTS.programmes.phonics.levels.foundations.ageRange.label',
 'SEMANTIC_FACTS.programmes.phonics.levels.early.ageRange.label',
 'SEMANTIC_FACTS.programmes.phonics.levels.advanced.ageRange.label',
 'SEMANTIC_FACTS.programmes.grammar.levels.beginner.ageRange.label',
 'SEMANTIC_FACTS.programmes.grammar.levels.advanced.ageRange.label',
 'SEMANTIC_FACTS.programmes.speaking.levels.beginner.ageRange.label',
 'SEMANTIC_FACTS.programmes.speaking.levels.advanced.ageRange.label'
];
if(labels.some(label=>!courses.includes(label)))fail('/courses age label detached from the seven canonical curriculum levels');
fs.mkdirSync(OUT,{recursive:true});
const esc=v=>'"'+String(Array.isArray(v)?v.join(' | '):v??'').replaceAll('"','""')+'"';
const csv=(file,data,fields)=>fs.writeFileSync(path.join(OUT,file),
  [fields.join(','),...data.map(x=>fields.map(k=>esc(x[k])).join(','))].join('\n')+'\n');
csv('PARENT_INTENT_28.csv',rows,['id','subject','question','intent','primary_owner','owner_state','programme_path','subject_hub','placement_principle','source_answer_available','followup_paths','unregistered_handoffs','review_state']);
csv('BENCHMARK_12.csv',[...benchmark.values()],['id','question','primary_owner','intent','evidence']);
csv('COMMERCIAL_INTENTS.csv',commercial,['id','query','primary_owner','intent']);
csv('SEVEN_COURSE_STAGES.csv',stages,['slug','age_min','age_max','age_label','lessons']);
const summary={brick:'TSSA-7/B3',kind:'source-intent-map',observed_at:new Date().toISOString(),
 corpus_owners:byPath.size,historical_corpus_owners:historicalOwners.size,new_phonics_age_corpus_owners:PHONICS_AGE_PROGRAMME_PATHS.length,new_group_corpus_owners:groupPagePaths.length,parent_intents:rows.length,benchmark_intents:benchmark.size,commercial_intents:commercial.length,
 curriculum_levels:stages.length,structured_lessons:stages.reduce((n,x)=>n+x.lessons,0),
 owner_errors:0,followup_review_count:rows.filter(x=>x.unregistered_handoffs.length).length,
 followup_review_rows:rows.filter(x=>x.unregistered_handoffs.length).map(x=>({id:x.id,paths:x.unregistered_handoffs})),
 provider_indexing_verdict:'UNVERIFIED',native_ai_citation_verdict:'UNVERIFIED'};
fs.writeFileSync(path.join(OUT,'SUMMARY.json'),JSON.stringify(summary,null,2)+'\n');
console.log('TSSA7_B3_SUMMARY '+JSON.stringify(summary));
