// Deliberately emulator-only wiring for the production-candidate transaction contract.
// No production endpoint can be selected through this factory.
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
const PROJECT='demo-tinysteps-monthly-trends';
const ROOT='adminStats/businessAnalyticsV1/';
const allowed=/^adminStats\/businessAnalyticsV1\/(businessAnalyticsControl\/active|businessAnalyticsMonths\/\d{4}-(0[1-9]|1[0-2])|businessAnalyticsYears\/\d{4}|businessAnalyticsContributors\/[0-9a-f]{64})$/;
export function createAnalyticsEmulatorStore() {
  const host=process.env.FIRESTORE_EMULATOR_HOST||'';
  if(!/^127\.0\.0\.1:\d+$/.test(host)||process.env.GCLOUD_PROJECT!==PROJECT||process.env.GOOGLE_CLOUD_PROJECT!==PROJECT) throw new Error('Monthly analytics store requires the isolated demo emulator');
  const app=initializeApp({projectId:PROJECT},'mat-emulator-'+process.pid+'-'+Math.random().toString(36).slice(2));
  const db=getFirestore(app);
  db.settings({host,ssl:false});
  const ref=path=>{
    if(typeof path!=='string'||!path.startsWith(ROOT)||!allowed.test(path))throw new Error('Analytics path not allowlisted');
    return db.doc(path);
  };
  const store={runTransaction:fn=>db.runTransaction(tx=>fn({
    get:async path=>{const snapshot=await tx.get(ref(path));return snapshot.exists?snapshot.data():null;},
    set:(path,data)=>{tx.set(ref(path),data);},
  }),{maxAttempts:5})};
  return {store,db,close:async()=>{await db.terminate();await deleteApp(app);}};
}
