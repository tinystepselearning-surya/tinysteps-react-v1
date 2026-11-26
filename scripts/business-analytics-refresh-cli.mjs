#!/usr/bin/env node
// Explicit operator command. Dry-run by default. No deployment, no operational writes.
// Production execution requires a separate owner-approved read/write scope and ADC.
import {dailyBusinessCutoff,requireDailyReadWindow} from './business-analytics-daily-cutoff.mjs';
import {parseArgs} from 'node:util';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {createBusinessRefreshStore} from './business-analytics-refresh-store.mjs';
import {refreshBusinessTrends} from './business-analytics-refresh.mjs';
const PROD='tinysteps-react-v1',DEMO='demo-tinysteps-monthly-trends';
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
async function main(){
 const {values:v}=parseArgs({options:{
  project:{type:'string'},years:{type:'string'},'max-documents':{type:'string'},
  'page-size':{type:'string',default:'250'},'max-pages':{type:'string',default:'400'},
  'daily-cutoff':{type:'boolean',default:false},
  'inventory-only':{type:'boolean',default:false},
  apply:{type:'boolean',default:false},'approve-production-read':{type:'boolean',default:false},
  'confirm-production-aggregate-write':{type:'string'},
 },strict:true,allowPositionals:false});
 assert([PROD,DEMO].includes(v.project),'Explicit supported project required');
 if(v.project===PROD&&v.apply)assert(v['daily-cutoff'],'Production publication requires closed-day cutoff');
 assert(!(v['inventory-only']&&v.apply),'Inventory mode is read-only');
 if(!v['inventory-only'])assert(v.years&&v['max-documents'],'Explicit years and document budget required');
 if(v.project===PROD){
  assert(!process.env.FIRESTORE_EMULATOR_HOST,'Production command cannot run against an emulator');
  assert(v['approve-production-read']===true,'Separate approved production read scope required');
  if(v.apply)assert(v['confirm-production-aggregate-write']===PROD,'Separate production aggregate write approval required');
 }else{
  assert(/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||''),'Demo requires loopback emulator');
 }
 const app=initializeApp({projectId:v.project});
 const db=getFirestore(app);
 try{
  const store=createBusinessRefreshStore(db);
  if(v['inventory-only']){
   console.log(JSON.stringify({project:v.project,outcome:'inventory-only',...(await store.inventory())},null,2));
   return;
  }
  const now=new Date(),cutoff=v['daily-cutoff']?dailyBusinessCutoff(now):undefined;
  if(cutoff){if(v.apply&&(await store.publishedThrough())>=cutoff.throughDate){console.log(JSON.stringify({outcome:'already-published',throughDate:cutoff.throughDate}));return;}
   requireDailyReadWindow(now,cutoff);}
  const result=await refreshBusinessTrends({source:store,publisher:store,years:v.years.split(',').map(x=>x.trim()),maxDocuments:Number(v['max-documents']),pageSize:Number(v['page-size']),maxPages:Number(v['max-pages']),apply:v.apply,cutoff});
  console.log(JSON.stringify({project:v.project,...result},null,2));
 }finally{await db.terminate();await deleteApp(app);}
}
main().catch(e=>{console.error('Monthly trends refresh failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1;});
