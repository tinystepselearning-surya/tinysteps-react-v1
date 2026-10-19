#!/usr/bin/env node
// E4 rollout witness: ordinary read-only public HTTP, not Google URL Inspection,
// a verified bot-IP test, or a ChatGPT/Gemini generated answer session.
import { mkdir, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const ORIGIN='https://tinystepslearning.com';
const cases=[
  {
    path:'/blog/child-gives-one-word-answers',
    newHeading:'First check whether your child struggles to start speaking or to expand an answer',
    legacy:'First separate Blog 37 from the nearby speaking problems',
  },
  {
    path:'/blog/child-understands-english-but-does-not-speak',
    newHeading:'First distinguish speaking initiation from short replies and sentence difficulties',
    legacy:'First separate Blog 40 from the nearby speaking problems',
  },
  {
    path:'/blog/phonics-for-parents-guide',
    newHeading:'What this phonics guide covers and which guide to read next',
    legacy:'Blog 56 is the parent-support guide',
  },
];
const results=await Promise.all(cases.map(async item=>{
 const observation={path:item.path,observedAt:new Date().toISOString(),status:null,
   expectedNewHeading:item.newHeading,liveHasNewHeading:false,
   liveHasOldLabel:false,canonical:null,blogPostingLinked:false,flags:[],unknowns:[]};
 try{
  const res=await fetch(ORIGIN+item.path,{
   headers:{'user-agent':'Mozilla/5.0 (compatible; TinyStepsReadOnlyEditorialWitness/1.0)','accept':'text/html','cache-control':'no-cache'},
   redirect:'manual',signal:AbortSignal.timeout(20000)
  });
  observation.status=res.status;
  observation.cacheControl=res.headers.get('cache-control');
  if(res.status!==200){observation.unknowns.push('Origin did not return HTTP 200 for direct observation');return observation;}
  const html=await res.text();
  const doc=new JSDOM(html,{url:ORIGIN+item.path}).window.document;
  const content=(doc.querySelector('main')?.textContent||'').replace(/\s+/g,' ').trim();
  const canonical=doc.querySelector('link[rel="canonical"]')?.getAttribute('href')||null;
  observation.canonical=canonical;
  observation.mainChars=content.length;
  observation.liveHasNewHeading=content.includes(item.newHeading);
  observation.liveHasOldLabel=content.includes(item.legacy);
  if(canonical!==ORIGIN+item.path)observation.flags.push('canonical-mismatch');
  if(content.length<600)observation.flags.push('missing-main-content');
  const nodes=[];
  const visit=x=>{if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object'){nodes.push(x);if(x['@graph'])visit(x['@graph']);}};
  for(const tag of doc.querySelectorAll('script[type="application/ld+json"]')){
   try{visit(JSON.parse(tag.textContent||''));}catch{observation.flags.push('malformed-json-ld');}
  }
  observation.blogPostingLinked=nodes.some(n=>{
   const types=Array.isArray(n['@type'])?n['@type']:[n['@type']];
   if(!types.includes('BlogPosting'))return false;
   if(n.url===ORIGIN+item.path)return true;
   if(n.url && n.url!==ORIGIN+item.path)return false;
   const ref=typeof n.mainEntityOfPage==='string'?n.mainEntityOfPage:n.mainEntityOfPage?.['@id'];
   return nodes.some(p=>(Array.isArray(p['@type'])?p['@type']:[p['@type']]).includes('WebPage')&&p['@id']===ref&&p.url===ORIGIN+item.path);
  });
  if(!observation.blogPostingLinked)observation.flags.push('no-canonical-linked-blogposting');
  if(!observation.liveHasNewHeading)observation.unknowns.push('Merged E3 wording not observed on public origin; deployment propagation/version must be checked');
  if(observation.liveHasOldLabel)observation.unknowns.push('Old editor label still in current served HTML');
 }catch(e){observation.error=String(e?.message||e);observation.unknowns.push('Direct origin fetch failed');}
 return observation;
}));
const data={audit:'E4 rollout witness',observedAt:new Date().toISOString(),
  statement:'Ordinary origin-read HTTP only; no native engine session, no Googlebot IP verification, no indexing verdict',
  expectedMerge:'43a213cc40b0a2db201df1c72014aa8e671cc2e5',
  results};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/ai-e4-three-article-rollout-witness.json',JSON.stringify(data,null,2)+'\n');
for(const row of results)console.log('AI_E4_ROLLOUT '+JSON.stringify(row));
console.log('AI_E4_ROLLOUT_SUMMARY '+JSON.stringify({
  tested:results.length,newContentSeen:results.filter(x=>x.liveHasNewHeading).length,
  legacySeen:results.filter(x=>x.liveHasOldLabel).length,
  technicalFlags:results.flatMap(x=>x.flags).length,
  observationsNeedingRecheck:results.filter(x=>x.unknowns.length).length
}));
