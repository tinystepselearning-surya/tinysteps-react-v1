const admin = require('firebase-admin');
admin.initializeApp();
const auth = admin.auth();
const ADMIN_UID = process.env.ADMIN_UID; // set this before running

(async () => {
  const toDelete = [];
  let token;
  do {
    const res = await auth.listUsers(1000, token);
    res.users.forEach(u => { if (u.uid !== ADMIN_UID) toDelete.push(u.uid); });
    token = res.pageToken;
  } while (token);
  for (const uid of toDelete) { await auth.deleteUser(uid); console.log('Deleted', uid); }
  console.log(`Done. Kept admin ${ADMIN_UID}. Deleted ${toDelete.length} users.`);
})();
