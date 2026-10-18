#!/usr/bin/env node
// Read-only browser reliability check for all 39 indexable URLs in GSC #735.
// This is ordinary headless mobile Chromium, NOT Google's live inspection renderer.
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = 'https://tinystepslearning.com';
const original = JSON.parse(await readFile('artifacts/gsc735-58-batch-audit.json','utf8'));
const routes = original.rows.filter(x=>x.kind==='html');
if(routes.length!==39)throw new Error('Expected 39 canonical result-page URLs');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport: {width:390,height:844}, isMobile:true,
  serviceWorkers:'block', ignoreHTTPSErrors:false
});
async function parallel(items,limit,fn){
  const out=Array(items.length);let cursor=0;
  await Promise.all(Array.from({length:limit},async()=>{
    while(cursor<items.length){const i=cursor++;out[i]=await fn(items[i])}
  }));
  return out;
}
try {
 const results=await parallel(routes,2,async target=>{
   const row={id:target.id,path:target.path};
   const page=await context.newPage();
   const failedAssets=[];const pageErrors=[];
   page.on('requestfailed', req=>{
     const url=req.url();
     if(url.startsWith(BASE+'/assets/')&&/\.js(?:\?|$)/.test(url)){
       failedAssets.push({url:url.slice(BASE.length),reason:req.failure()?.errorText||'failed'});
     }
   });
   page.on('pageerror',error=>{
     pageErrors.push(String(error.message||error).slice(0,300));
   });
   try{
     const response=await page.goto(BASE+target.path,{waitUntil:'domcontentloaded',timeout:30000});
     await page.waitForTimeout(1200);
     const observed=await page.evaluate(()=>{
       const h1=(document.querySelector('main h1')||document.querySelector('h1'))?.textContent||'';
       const main=document.querySelector('main')?.textContent||'';
       const canonical=document.querySelector('link[rel="canonical"]')?.getAttribute('href')||'';
       return {title:document.title,h1:h1.replace(/\s+/g,' ').trim().slice(0,170),
         mainChars:main.replace(/\s+/g,' ').trim().length,canonical,
         recovered:!!document.querySelector('[data-ts-static-resource-recovery]'),
         genericError:/something went wrong/i.test(main.slice(0,250))}
     });
     row.http=response?.status()??null;
     row.h1=observed.h1;row.mainChars=observed.mainChars;
     row.canonical=observed.canonical;row.recovered=observed.recovered;
     row.genericError=observed.genericError;
     row.matchesBuildH1=observed.h1===(target.build?.h1||'');
     row.selfCanonical=observed.canonical===BASE+target.path;
   } catch(error){row.error=String(error.message||error).slice(0,350)}
   finally{
     row.failedAssets=failedAssets.slice(0,8);
     row.pageErrors=pageErrors.slice(0,8);
     await page.close();
   }
   row.flags=[];
   if(row.error)row.flags.push('browser-navigation-error');
   if(row.http!==200)row.flags.push('browser-http-not-200');
   if(!row.matchesBuildH1)row.flags.push('browser-h1-mismatch');
   if(!row.selfCanonical)row.flags.push('browser-canonical-mismatch');
   if((row.mainChars||0)<450 || row.genericError)row.flags.push('browser-rendered-content-failure');
   if(row.failedAssets.length)row.flags.push('js-asset-network-failure');
   if(row.pageErrors.length)row.flags.push('browser-js-pageerror');
   console.log('AUDIT_BROWSER '+JSON.stringify(row));
   return row;
 });
 const flags={};for(const r of results)for(const f of r.flags)flags[f]=(flags[f]||0)+1;
 const summary={total:results.length,ok200:results.filter(x=>x.http===200).length,
   matchingHeading:results.filter(x=>x.matchesBuildH1).length,
   selfCanonical:results.filter(x=>x.selfCanonical).length,
   noBrowserFlag:results.filter(x=>!x.flags.length).length,flags};
 await writeFile('artifacts/gsc735-39-mobile-browser-audit.json',
   JSON.stringify({observedAt:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA||'unknown',
     note:'Ordinary mobile Chromium, not Googlebot/Google live indexing; no user interactions or mutations',
     summary,rows:results},null,2)+'\n');
 console.log('AUDIT_BROWSER_SUMMARY '+JSON.stringify(summary));
}finally{await context.close();await browser.close()}
