#!/usr/bin/env node
// Run only inside an approved private runtime. No credentials are stored in this repo.
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {createBusinessRefreshStore} from './business-analytics-refresh-store.mjs';
import {refreshBusinessTrends} from './business-analytics-refresh.mjs';
import {runBusinessRefreshJob} from './business-analytics-job-config.mjs';
runBusinessRefreshJob({
 env:process.env,now:new Date(),
 async openStore(projectId){
  const app=initializeApp({projectId});
  const db=getFirestore(app);
  return {store:createBusinessRefreshStore(db),close:async()=>{try{await db.terminate();}finally{await deleteApp(app);}}};
 },
 refresh:refreshBusinessTrends,
 log:summary=>console.log(JSON.stringify(summary)),
}).catch(()=>{
 // SDK errors may contain resource paths; keep scheduled logs free of sensitive record details.
 console.error('Monthly trends refresh failed; previous published snapshot retained. Inspect approved private diagnostics.');
 process.exitCode=1;
});
