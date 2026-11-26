#!/usr/bin/env node
// Explicit, read-only operator action. No writes, document lists, exports, or scheduler.
import {parseArgs} from 'node:util';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {analyticsInventoryPlan,runCountOnlyInventory} from './business-analytics-workspace-inventory.mjs';
const PROD='tinysteps-react-v1',DEMO='demo-tinysteps-monthly-trends';
async function main(){
 const {values:v}=parseArgs({options:{
  project:{type:'string'},month:{type:'string'},'approve-production-read':{type:'boolean',default:false},
 },strict:true,allowPositionals:false});
 if(![PROD,DEMO].includes(v.project))throw Error('Explicit supported project required');
 if(v.project===PROD&&(!v['approve-production-read']||process.env.FIRESTORE_EMULATOR_HOST))throw Error('Production read approval and non-emulator environment required');
 if(v.project===DEMO&&!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST||''))throw Error('Demo requires loopback emulator');
 const plan=analyticsInventoryPlan(v.month);
 const app=initializeApp({projectId:v.project});
 const db=getFirestore(app);
 try{
  const result=await runCountOnlyInventory(plan,async spec=>{
   let q=spec.group?db.collectionGroup(spec.collection):db.collection(spec.collection);
   for(const [field,op,value] of spec.filters)q=q.where(field,op,value instanceof Date?Timestamp.fromDate(value):value);
   const snap=await q.count().get();
   return snap.data().count;
  });
  console.log(JSON.stringify({project:v.project,outcome:'count-only',...result},null,2));
 }finally{await db.terminate();await deleteApp(app);}
}
main().catch(e=>{console.error('Analytics workspace count-only audit failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1;});
