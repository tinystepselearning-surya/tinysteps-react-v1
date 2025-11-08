const admin = require('firebase-admin');
if (!process.env.ADMIN_UID) { console.error('Set ADMIN_UID'); process.exit(1); }
admin.initializeApp();
const db = admin.firestore();

(async () => {
  const adminUid = process.env.ADMIN_UID;
  const snap = await db.collection('users').get();
  const batch = db.batch(); let n=0;
  snap.forEach(doc => { if (doc.id !== adminUid) { batch.delete(doc.ref); n++; }});
  if (n) await batch.commit();
  console.log(`Deleted ${n} user docs; kept ${adminUid}.`);
})();
