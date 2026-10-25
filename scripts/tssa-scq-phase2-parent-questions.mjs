#!/usr/bin/env node
/* TSSA-SCQ Phase 2: source→rendered parent answer evidence; no website changes. */
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
const base=process.cwd(), out=path.join(base,'artifacts/tssa-scq-phase2'), origin='https://tinystepslearning.com';
fs.mkdirSync(out,{recursive:true});
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const die=s=>{throw Error('TSSA-SCQ Phase2: '+s)};
function parseCsv(src){
 const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<src.length;i++){const c=src[i];
  if(c==='"'&&q&&src[i+1]==='"'){cell+='"';i++}
  else if(c==='"')q=!q;
  else if(c===','&&!q){row.push(cell);cell=''}
  else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&src[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(Boolean))rows.push(row);row=[]}
  else cell+=c;
 }
 if(q)die('CSV quote not closed');
 if(cell||row.length){row.push(cell);rows.push(row)}
 const [h,...rest]=rows;
 return rest.map(r=>Object.fromEntries(h.map((k,i)=>[k,r[i]||''])));
}
const idx=JSON.parse(read('dist/ai-resource-index.json'));
const owners=new Map(Object.values(idx.corpus).flat().map(v=>[v.canonical_url,v]));
if(owners.size!==279)die('Corpus baseline changed: '+owners.size);
const parentLayer=new Map((idx.layers.find(x=>Number(x.layer)===1)?.items||[]).map(x=>[x.id,x]));
const parents=parseCsv(read('artifacts/tssa7-b3/PARENT_INTENT_28.csv'));
const benchmark=parseCsv(read('artifacts/tssa7-b3/BENCHMARK_12.csv'));
const commercial=parseCsv(read('artifacts/tssa7-b3/COMMERCIAL_INTENTS.csv'));
if(parents.length!==28||benchmark.length!==12||commercial.length!==9||parentLayer.size!==28)die('B3 question baseline drift');
const questions=[
 ...parents.map(x=>({cohort:'parent-problem',id:x.id,question:x.question,owner:x.primary_owner,
  subject:x.subject,answer:parentLayer.get(x.id)?.answer||'',
  expectedLinks:(x.followup_paths||'').split(' | ').filter(Boolean)})),
 ...benchmark.map(x=>({cohort:'benchmark',id:x.id,question:x.question,owner:x.primary_owner,
  subject:'benchmark',answer:'',expectedLinks:[]})),
];
const findings=[], flag=(severity,id,code,detail)=>findings.push({severity,id,code,detail});
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const ignored=new Set('child children kids child my our the a an and to on of for from when at who what how why is are can do does should i we you your they with their in has have that this but need enough better improve online english first'.split(' '));
const keywords=s=>[...new Set((clean(s).toLowerCase().match(/[a-z]{3,}/g)||[]).filter(w=>!ignored.has(w)))];
const cache=new Map();
function pageFor(route){
 if(cache.has(route))return cache.get(route);
 const p=path.join(base,'dist',route==='/'?'index.html':route.slice(1)+'/index.html');
 if(!fs.existsSync(p))return null;
 const doc=new JSDOM(fs.readFileSync(p,'utf8'),{url:origin+route}).window.document;
 const main=doc.querySelector('main')||doc.querySelector('#root')||doc.body;
 const result={
  canonical:doc.querySelector('link[rel="canonical"]')?.getAttribute('href')||'',
  h1:clean(main.querySelector('h1')?.textContent),
  title:clean(doc.querySelector('title')?.textContent),
  headingCount:main.querySelectorAll('h1,h2,h3').length,
  content:clean(main.textContent),
  jsonLd:doc.querySelectorAll('script[type="application/ld+json"]').length,
  links:[...main.querySelectorAll('a[href]')].map(el=>el.getAttribute('href')),
 };
 cache.set(route,result);return result;
}
const results=[];
for(const q of questions){
 const expected=origin+q.owner;
 if(!owners.has(expected)||owners.get(expected).indexing_state!=='indexable'){flag('ERROR',q.id,'INVALID_OWNER',q.owner);continue}
 const p=pageFor(q.owner);
 if(!p){flag('ERROR',q.id,'MISSING_RENDERED_OWNER',q.owner);continue}
 if(p.canonical!==expected)flag('ERROR',q.id,'CANONICAL_DRIFT',p.canonical);
 if(!p.h1)flag('ERROR',q.id,'MISSING_H1',q.owner);
 const words=keywords(q.question), matched=words.filter(w=>p.content.toLowerCase().includes(w));
 const overlap=words.length?Math.round(matched.length/words.length*100):0;
 if(words.length>=3&&overlap<25)flag('REVIEW',q.id,'LOW_LEXICAL_OVERLAP','Synonyms possible; inspect question vs visible answer');
 if(p.content.length<250)flag('REVIEW',q.id,'VERY_SHORT_CONTENT','Visible text '+p.content.length+' chars');
 const linked=q.expectedLinks.filter(h=>p.links.some(link=>link===h||link===origin+h||link?.startsWith(h+'#')));
 if(q.expectedLinks.length&&!linked.length)flag('REVIEW',q.id,'NO_DIRECT_FOLLOWUP','Indirect resources may still work');
 if(/\bBlog\s*\d{2}\b|canonical owner|this page owns|protected Tiny Steps/i.test(p.content))
  flag('REVIEW',q.id,'INTERNAL_TERMINOLOGY','Potential internal SEO wording in visible text');
 results.push({cohort:q.cohort,id:q.id,subject:q.subject,question:q.question,owner:q.owner,h1:p.h1,
  title:p.title,heading_count:p.headingCount,visible_chars:p.content.length,jsonld_blocks:p.jsonLd,
  distinctive_terms:words.join(' | '),matched_terms:matched.join(' | '),lexical_overlap_percent:overlap,
  registered_teaching_summary:q.answer,visible_excerpt:p.content.slice(0,650),
  expected_followups:q.expectedLinks.join(' | '),direct_handoff_matches:linked.join(' | '),
  answer_quality_status:'REQUIRES_EDUCATOR_REVIEW',evidence_type:'GENERATED_HTML_ONLY'});
}
const buyers=[];
for(const c of commercial){
 const p=pageFor(c.primary_owner),own=owners.get(origin+c.primary_owner);
 if(!p||!own||own.indexing_state!=='indexable'||p.canonical!==origin+c.primary_owner)
  flag('ERROR',c.id,'BUYER_OWNER_INVALID',c.primary_owner);
 buyers.push({id:c.id,question:c.query,intent:c.intent,owner:c.primary_owner,h1:p?.h1||'',
  title:p?.title||'',excerpt:p?.content.slice(0,450)||'',
  interpretation:'Distinct buyer intent does not imply page cannibalisation'});
}
if(results.length!==40||buyers.length!==9)die('Unexpected missing rows: '+results.length+' '+buyers.length);
const quote=v=>'"'+String(v??'').replace(/^[=+@-]/,m=>"'"+m).replaceAll('"','""')+'"';
const exportRows=(file,items,fields)=>fs.writeFileSync(path.join(out,file),
 [fields.join(','),...items.map(i=>fields.map(f=>quote(i[f])).join(','))].join('\n')+'\n');
exportRows('PARENT_QUESTION_RENDERED_EVIDENCE_40.csv',results,
 ['cohort','id','subject','question','owner','h1','title','heading_count','visible_chars',
 'jsonld_blocks','distinctive_terms','matched_terms','lexical_overlap_percent',
 'registered_teaching_summary','visible_excerpt','expected_followups','direct_handoff_matches',
 'answer_quality_status','evidence_type']);
exportRows('COMMERCIAL_INTENTS_9.csv',buyers,['id','question','intent','owner','h1','title','excerpt','interpretation']);
const summary={
  source_question_checks:40,rendered_question_checks:results.length,
  distinct_answer_pages:new Set(results.map(x=>x.owner)).size,
  commercial_owner_checks:buyers.length,
  hard_errors:findings.filter(x=>x.severity==='ERROR').length,
  editorial_triage_flags:findings.filter(x=>x.severity==='REVIEW').length,
  by_flag:Object.fromEntries([...new Set(findings.map(x=>x.code))].map(k=>[k,findings.filter(x=>x.code===k).length])),
  quality_verdict:'HUMAN_EDUCATIONAL_ASSESSMENT_NOT_YET_COMPLETED',
  external_engines:'NOT_TESTED_BY_THIS_SOURCE_BUILD_AUDIT',
  explanation:'Lexical overlap is a review hint, not proof of a semantic gap; no GSC, indexing or AI citation claims',
};
fs.writeFileSync(path.join(out,'SUMMARY.json'),JSON.stringify(summary,null,2)+'\n');
fs.writeFileSync(path.join(out,'TRIAGE_FINDINGS.json'),JSON.stringify(findings,null,2)+'\n');
const doc=[
 '# TSSA-SCQ Phase 2: parent-answer evidence',
 '',
 'This is a generated-build and source-ownership check, not a semantic educational quality verdict.',
 'Assign exact, partial, supporting, or genuine gap only after an educator reviews the actual answer.',
 '',
 'Summary: '+JSON.stringify(summary),
 '',
 '## Review flags',
 ...findings.map(f=>'- '+f.severity+' '+f.id+' '+f.code+': '+f.detail),
 '',
 '## Commercial intent owners',
 ...buyers.map(x=>'- '+x.question+' → '+x.owner+' ('+x.intent+')'),
 '',
 'Preserve existing URLs, programme/curriculum facts, and the distinction between buyer comparison, fees and course owners.',
];
fs.writeFileSync(path.join(out,'REVIEW_QUEUE.md'),doc.join('\n')+'\n');
console.log('TSSA-SCQ Phase2 result '+JSON.stringify(summary));
if(summary.hard_errors)process.exitCode=1;
