#!/usr/bin/env node
// TSSA-7/B2. Read-only origin observation. NOT Google/Bing URL Inspection,
// verified bot-IP traffic, native SERP rank, or a reindexing request.
import {mkdir,writeFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const ORIGIN='https://tinystepslearning.com';
const PATHS=[
  '/courses/public-speaking-foundations',
  '/courses/public-speaking-excellence',
  '/best-online-phonics-classes-for-kids-in-india',
  '/confidence-building-program-kids',
  '/blog/online-phonics-classes-vs-school',
  '/blog/grammar-assessment',
  '/resources/grammar/simple-past-tense-for-kids',
  '/resources/phonics/magic-e-phonics',
  '/resources/vocabulary',
  '/courses',
];
const request=async url=>{
  try {
    const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(25000),
      headers:{'user-agent':'TinyStepsReadOnlyB2Audit/1.0','accept':'text/html, application/json, application/xml;q=0.9, */*;q=0.8','cache-control':'no-cache'}});
    return {status:res.status,type:res.headers.get('content-type'),
      xRobots:res.headers.get('x-robots-tag')||'',
      cache:res.headers.get('cache-control')||'',
      location:res.headers.get('location')||'',body:await res.text()};
  }catch(e){return {error:String(e?.message||e),causeCode:e?.cause?.code||null,causeMessage:String(e?.cause?.message||''),causeName:e?.cause?.name||null};}
};
const stamp=new Date().toISOString();
const sitemap=await request(ORIGIN+'/sitemap.xml');
const refs=!sitemap.error&&sitemap.status===200 ?
  [...sitemap.body.matchAll(/<loc>\s*(https:\/\/tinystepslearning\.com\/sitemap-[^<\s]+\.xml)\s*<\/loc>/g)].map(x=>x[1]):[];
const sm=await Promise.all(refs.map(request));
const sitemapReady=refs.length>0 && sm.every(s=>s.status===200&&!s.error);
const allLocations=new Set(sm.flatMap(s=>[...String(s.body||'').matchAll(/<loc>\s*(https:\/\/tinystepslearning\.com\/[^<\s]+)\s*<\/loc>/g)].map(x=>x[1])));
const machine=await request(ORIGIN+'/ai-resource-index.json');
let byCanonical=new Map();
if(!machine.error&&machine.status===200)try{
  const index=JSON.parse(machine.body);
  const items=Object.values(index.corpus||{}).flat();
  byCanonical=new Map(items.filter(x=>x?.canonical_url).map(x=>[x.canonical_url,x]));
}catch(e){machine.parseError=String(e?.message||e);}
const results=await Promise.all(PATHS.map(async path=>{
  const url=ORIGIN+path;
  const o={path,checkedAt:stamp,expectedOwner:url,sourceIntent:'INDEX_B2_PILOT',
    originStatus:null,canonical:null,canonicalCount:0,robotsValues:[],googlebotValues:[],
    xRobots:null,sitemapListed:null,directoryIndexingState:null,
    verdict:'NOT_OBSERVED',flags:[],unknowns:[],
    gscIndexedVerdict:'UNVERIFIED',bingIndexedVerdict:'UNVERIFIED'};
  const page=await request(url);
  if(page.error){o.unknowns.push('origin request: '+page.error+(page.causeCode?' ['+page.causeCode+']':'')+(page.causeMessage?' '+page.causeMessage:''));return o;}
  o.originStatus=page.status;o.xRobots=page.xRobots;o.cache=page.cache;
  o.sitemapListed=sitemapReady ? allLocations.has(url) : null;
  if(!sitemapReady)o.unknowns.push('sitemap index or child sitemap retrieval incomplete');
  if(machine.error||machine.status!==200||machine.parseError)o.unknowns.push('AI directory fetch/parse incomplete');
  else o.directoryIndexingState=byCanonical.get(url)?.indexing_state??'NOT_IN_DIRECTORY';
  if(page.status!==200){o.flags.push('http-not-200');o.redirectLocation=page.location; o.verdict='OBSERVED_TECHNICAL_FLAG';return o;}
  const doc=new JSDOM(page.body,{url}).window.document;
  const canon=[...doc.querySelectorAll('link[rel="canonical"]')].map(n=>n.getAttribute('href'));
  o.canonicalCount=canon.length;o.canonical=canon[0]||null;
  o.robotsValues=[...doc.querySelectorAll('meta[name="robots"]')].map(n=>n.getAttribute('content')||'');
  o.googlebotValues=[...doc.querySelectorAll('meta[name="googlebot"]')].map(n=>n.getAttribute('content')||'');
  o.title=doc.title;o.h1=(doc.querySelector('h1')?.textContent||'').replace(/\s+/g,' ').trim();
  o.mainTextChars=(doc.querySelector('main')?.textContent||'').replace(/\s+/g,' ').trim().length;
  if(canon.length!==1||canon[0]!==url)o.flags.push('canonical-count-or-target');
  if(/noindex/i.test([page.xRobots,...o.robotsValues,...o.googlebotValues].join(',')))o.flags.push('served-noindex');
  if(o.robotsValues.length===0)o.unknowns.push('no robots meta found: examine defaults/headers');
  if(o.sitemapListed===false)o.flags.push('missing-from-live-sitemaps');
  if(!o.title||!o.h1||o.mainTextChars<200)o.flags.push('missing-substantial-rendered-content');
  if(o.directoryIndexingState==='noindex'&&
    ['/courses/public-speaking-foundations','/courses/public-speaking-excellence'].includes(path))
    o.flags.push('generated-ai-directory-noindex-for-canonical-course');
  o.verdict=o.flags.length?'OBSERVED_TECHNICAL_FLAG':'LIVE_INDEXABILITY_ELIGIBLE';
  return o;
}));
// Distinguish site-specific failures from runner-wide outbound networking failures.
const networkControl=await request('https://example.com/');
const summary={project:'TSSA-7',brick:'B2',observedAt:stamp,
  evidenceMode:'normal ordinary HTTP GET, no verified crawler or Google/Bing index inspection',
  candidateCount:results.length,
  observed200:results.filter(x=>x.originStatus===200).length,
  eligibleByLiveHeadersAndHtml:results.filter(x=>x.verdict==='LIVE_INDEXABILITY_ELIGIBLE').length,
  technicalFlags:results.filter(x=>x.flags.length).length,
  incomplete:results.filter(x=>x.unknowns.length).length,
  sitemapReady,machineDirectoryAvailable:byCanonical.size>0,
  networkControl:{host:'https://example.com/',status:networkControl.status??null,
    error:networkControl.error??null,causeCode:networkControl.causeCode??null,causeMessage:networkControl.causeMessage??null},
  machineDirectoryError:{error:machine.error??null,causeCode:machine.causeCode??null,causeMessage:machine.causeMessage??null},
  sitemapIndexError:{error:sitemap.error??null,causeCode:sitemap.causeCode??null,causeMessage:sitemap.causeMessage??null},
  googleIndexedUrlsVerified:0,bingIndexedUrlsVerified:0};
await mkdir('artifacts/tssa7-b2',{recursive:true});
await writeFile('artifacts/tssa7-b2/LIVE_INDEXABILITY_PILOT.json',JSON.stringify({summary,results},null,2)+'\n');
const csvcols=['path','originStatus','canonical','canonicalCount','robotsValues','googlebotValues','xRobots','sitemapListed','directoryIndexingState','mainTextChars','verdict','flags','unknowns','gscIndexedVerdict','bingIndexedVerdict'];
const q=x=>'"'+String(x==null?'':Array.isArray(x)?x.join(' | '):x).replaceAll('"','""')+'"';
await writeFile('artifacts/tssa7-b2/LIVE_INDEXABILITY_PILOT.csv',
  [csvcols.join(','),...results.map(row=>csvcols.map(k=>q(row[k])).join(','))].join('\n')+'\n');
console.log('TSSA7_B2_SUMMARY '+JSON.stringify(summary));
for(const row of results)console.log('TSSA7_B2_PAGE '+JSON.stringify({
  path:row.path,status:row.originStatus,verdict:row.verdict,
  canon:row.canonical,robots:row.robotsValues,
  xRobots:row.xRobots,sitemap:row.sitemapListed,machine:row.directoryIndexingState,
  flags:row.flags,unknowns:row.unknowns
}));
