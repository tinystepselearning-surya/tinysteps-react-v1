#!/usr/bin/env node
// Read-only AI answer-engine E1/E2 production audit.
// The client is a normal HTTP requester, NOT a verified AI crawler, Google's renderer,
// Google URL Inspection or a native ChatGPT/Gemini query session.
// No forms, indexing requests, content mutations or deploys.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { PHONICS_PUBLISHED_RESOURCE_PATHS } from '../src/lib/phonicsPublicationRegistry.js';
import { GRAMMAR_PROGRAMMATIC_PATHS } from '../src/lib/grammarProgrammaticSeoManifest.js';
import { GRAMMAR_REFERENCE_EXTENSION_PATHS } from '../src/lib/grammarReferenceExtensionSeoManifest.js';
import { VOCABULARY_AUTHORITY_PATHS } from '../src/lib/vocabularyAuthoritySeoManifest.js';

const ORIGIN = 'https://tinystepslearning.com';
const REGULAR_AGENT = 'Mozilla/5.0 (compatible; TinyStepsReadOnlyAudit/1.0)';
const BLOGS = [
  '/blog/why-child-knows-letter-sounds-but-cannot-read-words',
  '/blog/sight-words-or-phonics-first',
  '/blog/why-child-reads-words-but-does-not-understand-story',
  '/blog/how-to-improve-reading-fluency-in-children',
  '/blog/are-phonics-apps-enough-for-kids',
  '/blog/what-age-to-start-phonics',
  '/blog/how-long-does-phonics-take',
  '/blog/child-knows-grammar-but-makes-mistakes',
  '/blog/child-understands-english-but-does-not-speak',
  '/blog/child-gives-one-word-answers',
  '/blog/online-phonics-classes-vs-school',
  '/blog/phonics-diagnostics',
];
const PHONICS = ['/resources/phonics/sh-digraph-phonics', '/resources/phonics/magic-e-phonics'];
const GRAMMAR = ['/resources/grammar/nouns-for-kids', '/resources/grammar/simple-past-tense-for-kids'];
const VOCAB = ['/resources/vocabulary/context-clues-for-kids', '/resources/vocabulary/vocabulary-for-better-writing'];
const samples = [
  ...BLOGS.map(path => ({ path, family: 'blog' })),
  ...PHONICS.map(path => ({ path, family: 'phonics' })),
  ...GRAMMAR.map(path => ({ path, family: 'grammar' })),
  ...VOCAB.map(path => ({ path, family: 'vocabulary' })),
];
const listOf = value => Array.isArray(value) ? value : [value];
const normalize = v => String(v || '').replace(/\s+/g, ' ').trim();
const tokens = node => listOf(node?.['@type']).filter(x => typeof x === 'string');
const asArr = x => Array.isArray(x) ? x : [x];
const findings = [];
const inventory = {
  blog: [...(await readFile('public/sitemap-blog.xml','utf8')).matchAll(/<loc>\s*https:\/\/tinystepslearning\.com(\/blog\/[^<\s]+)\s*<\/loc>/g)].map(x => x[1]),
  phonics: [...PHONICS_PUBLISHED_RESOURCE_PATHS],
  grammar: [...GRAMMAR_PROGRAMMATIC_PATHS, ...GRAMMAR_REFERENCE_EXTENSION_PATHS],
  vocabulary: [...VOCABULARY_AUTHORITY_PATHS],
};
const duplicate = values => values.filter((x, i) => values.indexOf(x) !== i);
for (const [family, values] of Object.entries(inventory)) {
  if (duplicate(values).length) throw new Error(family + ' has duplicate owned paths: ' + duplicate(values).join(','));
  const expected = { blog: 83, phonics: 31, grammar: 38, vocabulary: 16 }[family];
  if (values.length !== expected) throw new Error(family + ' publication inventory drift: ' + values.length + ' !== ' + expected);
}
if (new Set(Object.values(inventory).flat()).size !== 168) throw new Error('Owned URL collision among the 168 editorial/programmatic paths');
for (const item of samples) if (!inventory[item.family].includes(item.path)) throw new Error('Sample path not in source authority inventory: ' + item.path);

async function request(url) {
  try {
    const response = await fetch(url, {
      headers: { accept: 'text/html, text/plain;q=0.9, */*;q=0.8', 'user-agent': REGULAR_AGENT, 'cache-control':'no-cache' },
      redirect: 'manual',
      signal: AbortSignal.timeout(25000),
    });
    return {
      status: response.status, url: response.url, type: response.headers.get('content-type'),
      cache: response.headers.get('cache-control'), xRobots: response.headers.get('x-robots-tag'),
      location: response.headers.get('location'), body: await response.text(),
    };
  } catch(e) { return { error: String(e?.message || e) }; }
}
function collectJsonLd(document) {
  const all = [], parseErrors = [];
  function flatten(x) {
    if (Array.isArray(x)) return x.forEach(flatten);
    if (x && typeof x === 'object') {
      all.push(x);
      if(x['@graph']) flatten(x['@graph']);
    }
  }
  for(const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {flatten(JSON.parse(script.textContent || ''));}
    catch(e){parseErrors.push(String(e?.message || e));}
  }
  return { all, parseErrors };
}
function parseRobots(s) {
  const groups=[], lines=s.replace(/\r/g,'').split('\n');
  let agents=[], disallow=[], allow=[], hadDirective=false;
  const flush=()=>{if(agents.length) groups.push({agents:[...agents],disallow:[...disallow],allow:[...allow]});agents=[];disallow=[];allow=[];hadDirective=false;};
  for(let raw of lines){
    const line=raw.split('#')[0].trim();
    if(!line)continue;
    const m=line.match(/^([a-z-]+):\s*(.*)$/i); if(!m)continue;
    const k=m[1].toLowerCase(),v=m[2].trim();
    if(k==='user-agent'){if(hadDirective)flush();agents.push(v.toLowerCase());}
    else if(k==='allow'||k==='disallow'){hadDirective=true;(k==='allow'?allow:disallow).push(v);}
  }
  flush();
  return ['googlebot','oai-searchbot','chatgpt-user','perplexitybot'].map(agent=>{
    const group=groups.find(g=>g.agents.includes(agent));
    return {agent, explicitGroup:!!group, publicAllow:!!group?.allow.includes('/'),
      privateProtected: ['/admin/','/teacher/','/parent/','/kids/','/private/'].every(p=>group?.disallow.includes(p))};
  });
}
async function mapBounded(items, limit, fn) {
  const out=Array(items.length); let i=0;
  await Promise.all(Array.from({length:limit},async()=>{while(i<items.length){const n=i++;out[n]=await fn(items[n]);}}));return out;
}
const robotsResponse=await request(ORIGIN+'/robots.txt');
const robots=robotsResponse.status===200 ? parseRobots(robotsResponse.body) : [];
if(robotsResponse.status===200 && robots.length) {
  for(const group of robots) if(!group.explicitGroup||!group.publicAllow||!group.privateProtected)
    findings.push({severity:'investigate',scope:'robots',issue:'source crawler policy mismatch',agent:group.agent});
}
const fullScan=process.argv.includes('--full');
const selected=fullScan ? Object.entries(inventory).flatMap(([family,paths])=>paths.map(path=>({family,path}))) : samples;
const outName=fullScan ? 'ai-answer-e1e2-full' : 'ai-answer-e1e2-sample';
const rows=await mapBounded(selected,fullScan ? 6 : 4,async item=>{
  const response=await request(ORIGIN+item.path);
  const row={...item,status:response.status??null,error:response.error||null,contentType:response.type||null,
    cacheControl:response.cache||null,xRobots:response.xRobots||null,location:response.location||null,
    sampleAt:new Date().toISOString(),schemaTypes:[],flags:[],unknowns:[],canonical:null,h1:null,mainChars:null,
    jsonLdScripts:0,jsonLdParseErrors:[],answerSignal:false};
  if(response.error||!response.status||response.status===429||response.status>=500){
    row.unknowns.push('origin-fetch-unavailable; retry and compare with independent client');return row;
  }
  if(response.status!==200){row.flags.push('unexpected-http-status');return row;}
  if(!/text\/html/i.test(response.type||'')){row.flags.push('unexpected-content-type');return row;}
  const document=new JSDOM(response.body,{url:ORIGIN+item.path}).window.document;
  const canonicals=[...document.querySelectorAll('link[rel="canonical"]')].map(x=>x.getAttribute('href'));
  const tags=[...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"],meta[name="bingbot"]')];
  row.canonical=canonicals[0]||null;
  if(canonicals.length!==1||row.canonical!==ORIGIN+item.path)row.flags.push('canonical-count-or-target-mismatch');
  if(tags.some(x=>/\bnoindex\b/i.test(x.getAttribute('content')||''))||/\bnoindex\b/i.test(response.xRobots||''))row.flags.push('indexability-noindex');
  row.h1=normalize(document.querySelector('main h1')?.textContent||document.querySelector('h1')?.textContent);
  row.mainChars=normalize(document.querySelector('main')?.textContent).length;
  if(!row.h1||row.mainChars<350)row.flags.push('missing-meaningful-visible-content');
  const {all,parseErrors}=collectJsonLd(document);
  row.jsonLdScripts=document.querySelectorAll('script[type="application/ld+json"]').length;
  row.jsonLdParseErrors=parseErrors;
  row.schemaTypes=[...new Set(all.flatMap(tokens))].sort();
  if(!row.jsonLdScripts||parseErrors.length)row.flags.push('missing-or-malformed-jsonld');
  const hasType=t=>all.some(n=>tokens(n).includes(t));
  const visible=normalize(document.querySelector('main')?.textContent||'').toLowerCase();
  if(item.family==='blog'){
    const articles=all.filter(n=>tokens(n).includes('BlogPosting'));
    const match=articles.find(n=>normalize(n.headline).toLowerCase()===row.h1.toLowerCase() && (
       n.url===ORIGIN+item.path ||
       (n.mainEntityOfPage?.['@id']||n.mainEntityOfPage)===ORIGIN+item.path+'#webpage'
    ));
    if(!match)row.flags.push('blogposting-headline-or-identity-mismatch');
    if(match && (!match.datePublished||!match.author))row.flags.push('blogposting-missing-date-or-author');
    if(match && match.description && !normalize(match.description))row.flags.push('blogposting-empty-description');
    row.answerSignal=visible.includes('quick answer')&&row.mainChars>=900;
  } else if(item.family==='phonics'){
    if(!hasType('WebPage')||!hasType('BreadcrumbList'))row.flags.push('phonics-page-or-breadcrumb-schema-missing');
    row.answerSignal=visible.includes('quick answer')&&visible.includes('common confusion');
  } else if(item.family==='grammar'){
    if(!hasType('WebPage')||!hasType('BreadcrumbList'))row.flags.push('grammar-webpage-or-breadcrumb-schema-missing');
    row.answerSignal=visible.includes('what this grammar skill means')&&visible.includes('worked examples');
  } else {
    if(!hasType('Article')||!hasType('BreadcrumbList'))row.flags.push('vocabulary-article-or-breadcrumb-schema-missing');
    row.answerSignal=visible.includes('what this vocabulary skill means')&&visible.includes('worked examples');
  }
  if(!row.answerSignal)row.unknowns.push('parent-answer-pattern-needs-human-review');
  return row;
});
// Machine directories are optional discovery aids, not mandated AI-ranking endpoints.
const discoveryPaths=['/ai-resource-index.json','/ai-resource-index.txt','/llms.txt','/llms-full.txt','/sitemap-blog.xml','/sitemap-static.xml'];
const discovery=await mapBounded(discoveryPaths,4,async pathname=>{
  const r=await request(ORIGIN+pathname);
  const result={path:pathname,status:r.status??null,contentType:r.type??null,bytes:r.body?.length??0,error:r.error??null,flags:[]};
  if(r.error||!r.status||r.status>=500||r.status===429){result.flags.push('origin-response-unverified');return result;}
  if(r.status!==200||!r.body||/^\\s*<!doctype html/i.test(r.body)){result.flags.push('missing-or-html-fallback');return result;}
  if(pathname.endsWith('.json')){
    try {
      const index=JSON.parse(r.body);
      result.revision=index.revision;
      result.corpusCounts=index.corpus_counts;
      const keys={blog:'editorial_blogs',phonics:'programmatic_phonics_guides',grammar:'programmatic_grammar_guides',vocabulary:'vocabulary_authority_guides'};
      for(const [family,key] of Object.entries(keys)){
        const entries=index.corpus?.[key];
        const expected=inventory[family].map(x=>ORIGIN+x);
        const found=Array.isArray(entries)?entries.map(x=>x.canonical_url):[];
        const missing=expected.filter(x=>!found.includes(x));
        const unexpected=found.filter(x=>!expected.includes(x));
        if(missing.length||unexpected.length||found.length!==expected.length){
          result.flags.push('ai-json-corpus-parity-'+family);
          result[family+'MissingCount']=missing.length;
          result[family+'UnexpectedCount']=unexpected.length;
          result[family+'ActualCount']=found.length;
        }
      }
    }catch(e){result.flags.push('malformed-ai-index-json');result.parseError=String(e?.message||e);}
  } else if(pathname.startsWith('/sitemap-') && pathname.endsWith('.xml')){
    const locs=[...r.body.matchAll(/<loc>\\s*([^<]+)\\s*<\\/loc>/gi)].map(x=>x[1].trim());
    const expected=pathname==='/sitemap-blog.xml' ? inventory.blog : [...inventory.phonics,...inventory.grammar,...inventory.vocabulary];
    const missing=expected.filter(x=>!locs.includes(ORIGIN+x));
    result.sitemapLocs=locs.length;
    result.expectedCanonicalUrls=expected.length;
    result.missingCount=missing.length;
    result.missingExamples=missing.slice(0,8);
    if(missing.length)result.flags.push('live-sitemap-missing-owned-canonical-pages');
  } else if(pathname==='/ai-resource-index.txt' && !r.body.includes('Canonical:')){
    result.flags.push('ai-index-text-lacks-canonical-owner-links');
  } else if(pathname.startsWith('/llms') && !r.body.includes('ai-resource-index.json')){
    result.flags.push('llm-directory-lacks-ai-answer-index-link');
  }
  return result;
});
await mkdir('artifacts',{recursive:true});
const output={
  generatedAt:new Date().toISOString(),scope:fullScan?'full-inventory':'representative-18',origin:ORIGIN,method:'ordinary read-only HTTP fetch; NOT a Googlebot IP / AI crawler or native answer engine',sourceInventory:{
    counts:Object.fromEntries(Object.entries(inventory).map(([k,v])=>[k,v.length])),
    uniquePaths:168,programmaticGuides:85,blogArticleCount:83
  },robots:{status:robotsResponse.status||null,error:robotsResponse.error||null,groups:robots},
  discovery,samples:rows,confirmedFlags:rows.flatMap(row=>row.flags.map(flag=>({path:row.path,flag}))),
  inaccessibleOrUnverified:rows.filter(row=>row.unknowns.length||row.error).map(row=>({path:row.path,unknowns:row.unknowns,error:row.error})),
};
await writeFile('artifacts/'+outName+'.json',JSON.stringify(output,null,2)+'\n');
const csvCell=x=>'"'+String(x??'').replace(/"/g,'""').replace(/\r?\n/g,' ')+'"';
const cols=['family','path','status','error','canonical','h1','mainChars','jsonLdScripts','schemaTypes','flags','unknowns','answerSignal','cacheControl','xRobots'];
await writeFile('artifacts/'+outName+'.csv',cols.join(',')+'\n'+rows.map(row=>cols.map(col=>csvCell(Array.isArray(row[col])?row[col].join(';'):row[col])).join(',')).join('\n')+'\n');
console.log('AI_E1E2_INVENTORY '+JSON.stringify(output.sourceInventory));
console.log('AI_E1E2_ROBOTS '+JSON.stringify(output.robots));
console.log('AI_E1E2_DISCOVERY '+JSON.stringify(discovery));
for(const row of rows) console.log('AI_E1E2_URL '+JSON.stringify(row));
console.log('AI_E1E2_SUMMARY '+JSON.stringify({
  count:rows.length,readableHtml:rows.filter(x=>x.status===200&&x.mainChars>=350).length,
  jsonLdScriptsPresent:rows.filter(x=>x.jsonLdScripts>0).length,
  flags:output.confirmedFlags.length,unknowns:output.inaccessibleOrUnverified.length,
  artifacts:['artifacts/'+outName+'.json','artifacts/'+outName+'.csv']
}));
