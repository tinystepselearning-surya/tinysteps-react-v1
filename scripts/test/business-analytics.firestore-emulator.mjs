import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalyticsEmulatorStore} from '../business-analytics-emulator-store.mjs';
import {publishCertifiedFlowChange} from '../business-analytics-flow-publisher.mjs';
import {prepareFlowBaseline} from '../business-analytics-flow-baseline.mjs';
import {adaptCanonicalReceipt} from '../business-analytics-source-adapters.mjs';

const root='adminStats/businessAnalyticsV1';
test('real isolated Firestore transaction: seed, concurrent replay, period correction, generation rejection',async()=>{
 const {store,db,close}=createAnalyticsEmulatorStore();
 try{
  const generation='fixture-generation-1',updatedAt='2026-11-26T10:00:00Z';
  const annual={year:'2026',schemaVersion:1,metricDefinitionVersion:1,verificationStatus:'verified',updatedAt,
    months:Array.from({length:12},(_,i)=>({monthKey:'2026-'+String(i+1).padStart(2,'0'),metrics:{leadEnquiries:null,newOpportunities:null,repeatEnquiries:null,billedPaise:null,receivedPaise:0}}))};
  const seed=prepareFlowBaseline({generation,sourceWatermark:'fixture-watermark',annuals:[annual],contributors:[]});
  const batch=db.batch();
  for(const doc of [...seed.documents,seed.activationCandidate])batch.set(db.doc(doc.path),doc.data);
  await batch.commit();
  const payment=db.doc('payments/fixture-receipt');
  const receipt={sourceSystem:'admin_receive_parent_payment',sourceFunction:'adminReceiveParentPayment',status:'completed',currency:'INR',parentId:'fixture-parent',walletTransactionId:'fixture-wallet',idempotencyKey:'fixture-receipt',paidAt:new Date('2026-10-31T18:29:00Z'),paidDateKey:'2026-10-31',receiptMonthKey:'2026-10',monthKey:'2026-10',date:'2026-10-31',amount:1600.25,walletCreditedAmount:1600.25};
  await payment.set(receipt);
  const first=await payment.get();
  const contribution=adaptCanonicalReceipt({id:first.id,data:first.data(),updateTime:first.updateTime});
  const opts={generation,updatedAt};
  const results=await Promise.all([publishCertifiedFlowChange(store,contribution,opts),publishCertifiedFlowChange(store,contribution,opts)]);
  assert.deepEqual(results.map(x=>x.outcome).sort(),['apply','duplicate']);
  assert.equal((await db.doc(root+'/businessAnalyticsMonths/2026-10').get()).data().metrics.receivedPaise,160025);
  await payment.update({paidAt:new Date('2026-10-31T18:30:00Z'),paidDateKey:'2026-11-01',receiptMonthKey:'2026-11',monthKey:'2026-11',date:'2026-11-01',amount:1500,walletCreditedAmount:1500});
  const corrected=await payment.get();
  const correction=adaptCanonicalReceipt({id:corrected.id,data:corrected.data(),updateTime:corrected.updateTime});
  await publishCertifiedFlowChange(store,correction,opts);
  assert.equal((await publishCertifiedFlowChange(store,contribution,opts)).outcome,'stale');
  const year=(await db.doc(root+'/businessAnalyticsYears/2026').get()).data();
  assert.equal(year.months[9].metrics.receivedPaise,0);
  assert.equal(year.months[10].metrics.receivedPaise,150000);
  assert.equal((await db.doc(root+'/businessAnalyticsMonths/2026-11').get()).data().metrics.receivedPaise,150000);
  await assert.rejects(publishCertifiedFlowChange(store,correction,{...opts,generation:'wrong'}),/baseline/);
  await assert.rejects(store.runTransaction(tx=>tx.get('payments/fixture-receipt')),/allowlisted/);
 }finally{await close();}
});

import {createBusinessRefreshStore} from '../business-analytics-refresh-store.mjs';
import {refreshBusinessTrends} from '../business-analytics-refresh.mjs';

test('real isolated Firestore refresh reads existing records once and publishes yearly/current aggregates',async()=>{
 const {db,close}=createAnalyticsEmulatorStore();
 try {
  const batch=db.batch();
  batch.set(db.doc('leads/refresh-lead'),{receivedAt:'2026-10-01',parentName:'must not be selected'});
  batch.set(db.doc('leads/refresh-lead/inquiries/refresh-lead'),{sourceLeadId:'refresh-lead',receivedAt:'2026-10-01'});
  batch.set(db.doc('leads/refresh-lead/inquiries/refresh-repeat'),{receivedAt:'2026-10-02'});
  batch.set(db.doc('billingCharges/refresh-charge'),{monthKey:'2026-10',amount:640});
  batch.set(db.doc('enrollments/refresh-enrollment'),{kidId:'refresh-child',status:'active',createdAt:'2026-10-03'});
  await batch.commit();
  const store=createBusinessRefreshStore(db);
  const year=new Intl.DateTimeFormat('en-CA',{year:'numeric',timeZone:'Asia/Kolkata'}).format(new Date());
  // CI clock may precede the fixture dates in a future replay; fixtures are fixed for reproducibility.
  const years=[...new Set(['2026',year])].sort().filter(y=>y<=year);
  const opts={source:store,publisher:store,years,maxDocuments:30,pageSize:1};
  const dry=await refreshBusinessTrends(opts);
  assert.equal(dry.sourceDocuments,5);
  assert.equal(dry.outcome,'dry-run');
  assert.ok(!JSON.stringify(dry).includes('refresh-child'));
  const projected=dry.documents.find(d=>d.path.endsWith('/2026'));
  if(projected&&dry.readTime>='2026-10-01'){
   assert.equal(projected.data.months[9].metrics.leadEnquiries,2);
   assert.equal(projected.data.months[9].metrics.billedPaise,64000);
  }
  const applied=await refreshBusinessTrends({...opts,apply:true});
  assert.equal(applied.outcome,'published');
  const current=(await db.doc(root+'/businessAnalyticsSnapshots/current').get()).data();
  assert.equal(current.activeStudents,1);
  assert.equal(current.activeEnrollments,1);
  assert.equal(await store.publish({documents:dry.documents,readTime:dry.readTime}),'stale-or-replayed');
  await assert.rejects(refreshBusinessTrends({...opts,maxDocuments:2,apply:true}),/budget/i);
  assert.equal((await db.doc(root+'/businessAnalyticsSnapshots/current').get()).data().updatedAt,current.updatedAt);
 } finally {await close();}
});
