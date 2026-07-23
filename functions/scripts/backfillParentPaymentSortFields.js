const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const WRITE_MODE = process.argv.includes('--write');
const PAGE_SIZE = 400;

const normalizeParentName = (parentId, data) =>
  String(data?.displayName || data?.name || data?.email || parentId)
    .trim()
    .toLocaleLowerCase('en') || parentId.toLocaleLowerCase('en');

async function run() {
  let cursor = null;
  let scanned = 0;
  let changed = 0;

  while (true) {
    let pageQuery = db
      .collectionGroup('months')
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (cursor) pageQuery = pageQuery.startAfter(cursor);

    const page = await pageQuery.get();
    if (page.empty) break;

    const parentIds = Array.from(
      new Set(page.docs.map((doc) => String(doc.get('parentId') || '').trim()).filter(Boolean))
    );
    const userSnaps = await db.getAll(
      ...parentIds.map((parentId) => db.collection('users').doc(parentId))
    );
    const usersById = new Map(userSnaps.map((snap) => [snap.id, snap.data() || {}]));
    const updates = page.docs.flatMap((doc) => {
      const parentId = String(doc.get('parentId') || '').trim();
      if (!parentId) return [];
      const parentNameSort = normalizeParentName(parentId, usersById.get(parentId));
      return doc.get('parentNameSort') === parentNameSort ? [] : [{ ref: doc.ref, parentNameSort }];
    });

    scanned += page.size;
    changed += updates.length;
    if (WRITE_MODE && updates.length > 0) {
      const batch = db.batch();
      updates.forEach(({ ref, parentNameSort }) => {
        batch.set(
          ref,
          { parentNameSort, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
      });
      await batch.commit();
    }

    cursor = page.docs[page.docs.length - 1];
    console.log({ scanned, changed, writeMode: WRITE_MODE });
    if (page.size < PAGE_SIZE) break;
  }

  console.log(`Completed ${WRITE_MODE ? 'write' : 'dry-run'} backfill`, { scanned, changed });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
